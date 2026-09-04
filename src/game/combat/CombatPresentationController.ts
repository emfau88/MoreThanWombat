import Phaser from 'phaser';
import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import type { Fighter, FighterBounds } from './Fighter';
import type { CombatImpact, HitFeedbackProfile } from './HitFeedback';
import { MoveStartCueController } from './MoveStartCueController';
import { getRectOverlapCenter, type Rect } from '../utils/Rect';
import { canCombatFactionHit } from './CombatFaction';
import {
  VFX_LAB_RECIPE_IDS,
  cycleVfxQuality,
  getAuxiliaryVfxRecipe,
  getImpactVfxRecipe,
  getVfxLabRecipe,
  type AuxiliaryVfxRecipeId,
  type VfxLabRecipeId,
  type VfxQuality,
} from './VfxRecipeRegistry';
import type { VfxPerformanceDiagnostics } from './VfxPerformanceBudget';
import { UniversalVfxDirector } from './UniversalVfxDirector';

type AxeRainStrike = {
  owner: Fighter;
  x: number;
  y: number;
  delayMs: number;
  activeMs: number;
  didImpact: boolean;
  warningPulseMs: number;
  hitTargetInstanceIds: Set<number>;
};

type TimedGroundCue = {
  x: number;
  y: number;
  depth: number;
  delayMs: number;
  recipeId: AuxiliaryVfxRecipeId;
  shakeDurationMs?: number;
  shakeIntensity?: number;
};

export type CombatPresentationContext = {
  getArenaBounds: () => FighterBounds;
  getCurrentTargets: () => Fighter[];
  getTargetFor: (fighter: Fighter) => Fighter | null;
  getVisibleCenterX: () => number;
  getShakeScale: () => number;
};

export class CombatPresentationController {
  private readonly axeRainStrikes: AxeRainStrike[] = [];
  private readonly timedGroundCues: TimedGroundCue[] = [];
  private readonly moveStartCues: MoveStartCueController;
  private readonly universalVfx: UniversalVfxDirector;
  private vfxQuality: VfxQuality = 'full';
  private vfxLabRecipeIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly context: CombatPresentationContext,
  ) {
    this.universalVfx = new UniversalVfxDirector(scene);
    this.moveStartCues = new MoveStartCueController({
      'wombat-earthshaker': (fighter) => {
        this.startWombatUltimate(fighter);
        this.spawnAuxiliary('warning.ground', fighter.x, fighter.y + 2, fighter.y + 6);
        this.timedGroundCues.push({
          x: fighter.x,
          y: fighter.y + 2,
          depth: fighter.y + 14,
          delayMs: 240,
          recipeId: 'ground.earthshaker',
          shakeDurationMs: 90,
          shakeIntensity: 0.0032,
        });
      },
      'discount-fireball': (fighter) => {
        this.spawnAuxiliary('magic.cast', fighter.x + 54 * (fighter.facing === 'right' ? 1 : -1), fighter.y - 52, fighter.y + 12, fighter.facing === 'right' ? 1 : -1);
      },
      'discount-miscast': (fighter) => {
        this.spawnAuxiliary('magic.phase', fighter.x, fighter.y - 54, fighter.y + 12);
      },
      'discount-clearance-orb': (fighter) => {
        this.startDiscountWizardUltimate(fighter);
      },
      'budget-axe-rain': (fighter) => {
        this.startBudgetBarbarianUltimate(fighter);
        this.shake(65, 0.0022);
      },
      'mara-breach-step': (fighter) => {
        this.startMaraBreachStep(fighter);
      },
      'mara-red-line-barrage': (fighter) => {
        this.startMaraUltimate(fighter);
      },
      'buster-bulldozer': (fighter) => {
        this.startBusterBulldogUltimate(fighter);
      },
    });
  }

  handleAttackStarted(fighter: Fighter, attack: AttackDefinition): void {
    this.moveStartCues.handleAttackStarted(fighter, attack);
  }

  spawnContactImpact(impact: CombatImpact, profile: HitFeedbackProfile): void {
    const attackId = impact.attackId;
    const target = impact.defender;
    if (!attackId || !target) {
      return;
    }

    const contactX = impact.contactX ?? target.x;
    const contactY = impact.contactY ?? target.y - 42;
    const outcome = impact.outcome ?? 'hit';

    if (outcome === 'hit' && attackId === 'discount_miscast') {
      this.spawnAuxiliary('magic.cast', contactX, contactY, target.y + 8, impact.attacker?.facing === 'left' ? -1 : 1);
    } else if (outcome === 'hit' && attackId === 'discount_clearance_orb') {
      this.spawnAuxiliary('magic.phase', contactX, contactY - 18, target.y + 10);
    }

    this.universalVfx.spawn(
      getImpactVfxRecipe(profile),
      contactX,
      contactY,
      target.y + 20,
      this.vfxQuality,
      impact.attacker?.facing === 'left' ? -1 : 1,
    );
  }

  update(deltaMs: number): CombatImpact[] {
    const impacts: CombatImpact[] = [];

    for (let index = this.timedGroundCues.length - 1; index >= 0; index -= 1) {
      const cue = this.timedGroundCues[index];
      cue.delayMs -= deltaMs;
      if (cue.delayMs > 0) {
        continue;
      }
      this.spawnAuxiliary(cue.recipeId, cue.x, cue.y, cue.depth);
      this.shake(cue.shakeDurationMs ?? 0, cue.shakeIntensity ?? 0);
      this.timedGroundCues.splice(index, 1);
    }

    for (let index = this.axeRainStrikes.length - 1; index >= 0; index -= 1) {
      const strike = this.axeRainStrikes[index];
      strike.delayMs -= deltaMs;

      if (strike.delayMs > 0) {
        strike.warningPulseMs -= deltaMs;
        if (strike.warningPulseMs <= 0) {
          this.spawnAuxiliary('warning.ground', strike.x, strike.y - 8, strike.y + 6);
          strike.warningPulseMs += 140;
        }
        continue;
      }

      if (!strike.didImpact) {
        strike.didImpact = true;
        this.spawnAuxiliary('ground.shock', strike.x, strike.y, strike.y + 14);
        this.spawnAxeRainFx(strike.x, strike.y);
        this.shake(60, 0.0028);
      }

      strike.activeMs -= deltaMs;
      impacts.push(...this.resolveAxeRainStrike(strike));

      if (strike.activeMs <= 0) {
        this.axeRainStrikes.splice(index, 1);
      }
    }

    return impacts;
  }

  advancePresentation(deltaMs: number): void {
    this.universalVfx.update(deltaMs);
  }

  cycleVfxLabRecipe(): VfxLabRecipeId {
    this.vfxLabRecipeIndex = (this.vfxLabRecipeIndex + 1) % VFX_LAB_RECIPE_IDS.length;
    this.spawnVfxLabPreview();
    return this.getVfxLabRecipeId();
  }

  getVfxLabRecipeId(): VfxLabRecipeId {
    return VFX_LAB_RECIPE_IDS[this.vfxLabRecipeIndex];
  }

  cycleVfxQuality(): VfxQuality {
    this.vfxQuality = cycleVfxQuality(this.vfxQuality);
    this.universalVfx.trimToBudget(this.vfxQuality);
    return this.vfxQuality;
  }

  getVfxQuality(): VfxQuality {
    return this.vfxQuality;
  }

  getVfxDiagnostics(): VfxPerformanceDiagnostics {
    return this.universalVfx.getDiagnostics(this.vfxQuality);
  }

  clearTransientEffects(): void {
    this.universalVfx.clear();
    this.axeRainStrikes.length = 0;
    this.timedGroundCues.length = 0;
  }

  destroy(): void {
    this.clearTransientEffects();
  }

  private startDiscountWizardUltimate(fighter: Fighter): void {
    const target = this.context.getTargetFor(fighter);
    const bounds = this.context.getArenaBounds();
    const startX = fighter.x;
    const startY = fighter.y;
    const safeMargin = 56;
    const visibleCenterX = this.context.getVisibleCenterX();
    const targetX = target?.x ?? visibleCenterX;
    const destinationX = targetX < visibleCenterX ? bounds.maxX - safeMargin : bounds.minX + safeMargin;

    this.startUltimateCue(fighter, 'CLEARANCE ORB', 'CLEAR THE AISLE', 0x7be7ff, 0x244c72, 1);
    this.spawnUltimateCharge(startX, startY - 58, 0x7be7ff, 1.15);
    this.spawnAuxiliary('magic.cast', startX + 28 * (fighter.facing === 'right' ? 1 : -1), startY - 54, startY + 14, fighter.facing === 'right' ? 1 : -1);
    this.spawnAuxiliary('magic.phase', startX, startY - 70, startY + 14);
    this.scene.tweens.add({
      targets: fighter.container,
      scaleX: 0.84,
      scaleY: 1.12,
      duration: 120,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 110,
    });
    fighter.nudge(destinationX - fighter.x, 0, bounds);

    if (target) {
      fighter.faceTarget(target.x);
    } else {
      fighter.facing = fighter.x < visibleCenterX ? 'right' : 'left';
      fighter.updateVisuals();
    }

    this.spawnAuxiliary('magic.phase', fighter.x, fighter.y - 70, fighter.y + 14);
    this.spawnUltimateCharge(fighter.x, fighter.y - 58, 0xd68cff, 1.35);
    this.shake(90, 0.0035);
  }

  private startWombatUltimate(fighter: Fighter): void {
    this.startUltimateCue(fighter, 'EARTHSHAKER', 'NAP SLAM', 0xffd166, 0x6e3b18, fighter.facing === 'right' ? 1 : -1);
    this.spawnUltimateCharge(fighter.x, fighter.y - 42, 0xffd166, 1.5);
    this.scene.tweens.add({
      targets: fighter.container,
      scaleX: 1.12,
      scaleY: 0.9,
      duration: 115,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 75,
    });
  }

  private startUltimateCue(
    fighter: Fighter,
    title: string,
    subtitle: string,
    color: number,
    shadowColor: number,
    direction: number,
  ): void {
    const titleText = this.scene.add
      .text(fighter.x + 18 * direction, fighter.y - 128, title, {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        stroke: `#${shadowColor.toString(16).padStart(6, '0')}`,
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(fighter.y + 84)
      .setScale(0.58)
      .setAlpha(0);
    const subtitleText = this.scene.add
      .text(fighter.x + 18 * direction, fighter.y - 105, subtitle, {
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        letterSpacing: 1.4,
        stroke: '#10131d',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(fighter.y + 85)
      .setScale(0.72)
      .setAlpha(0);

    this.scene.tweens.add({
      targets: [titleText, subtitleText],
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 110,
      ease: 'Back.Out',
      hold: 270,
      yoyo: true,
      onComplete: () => {
        titleText.destroy();
        subtitleText.destroy();
      },
    });
  }

  private spawnUltimateCharge(x: number, y: number, color: number, scale: number): void {
    const outer = this.scene.add.circle(x, y, 28, color, 0.12).setStrokeStyle(3, color, 0.82).setDepth(y + 16);
    const inner = this.scene.add.circle(x, y, 12, 0xffffff, 0.3).setDepth(y + 17);
    this.scene.tweens.add({
      targets: outer,
      scaleX: scale,
      scaleY: scale,
      alpha: 0,
      duration: 230,
      ease: 'Cubic.easeOut',
      onComplete: () => outer.destroy(),
    });
    this.scene.tweens.add({
      targets: inner,
      scaleX: 0.25,
      scaleY: 0.25,
      alpha: 0,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => inner.destroy(),
    });
  }

  private startBudgetBarbarianUltimate(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const offsets = [78, 148, 218];

    for (let index = 0; index < offsets.length; index += 1) {
      const x = Phaser.Math.Clamp(fighter.x + offsets[index] * direction, bounds.minX + 24, bounds.maxX - 24);
      const y = Phaser.Math.Clamp(fighter.y + (index - 1) * 10, bounds.minY + 12, bounds.maxY - 12);
      this.axeRainStrikes.push({
        owner: fighter,
        x,
        y,
        delayMs: 190 + index * 150,
        activeMs: 120,
        didImpact: false,
        warningPulseMs: 0,
        hitTargetInstanceIds: new Set<number>(),
      });
      this.spawnAuxiliary('warning.ground', x, y - 8, y + 6);
    }
  }

  private startMaraBreachStep(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const dashDistance = 46;
    const startX = fighter.x;
    const destinationX = Phaser.Math.Clamp(startX + dashDistance * direction, bounds.minX + 24, bounds.maxX - 24);

    fighter.nudge(destinationX - fighter.x, 0, bounds);
    this.spawnAuxiliary('ground.small', startX - 8 * direction, fighter.y + 4, fighter.y + 6, -direction);
    this.spawnAuxiliary('ground.small', fighter.x + 22 * direction, fighter.y + 4, fighter.y + 8, direction);
  }

  private startMaraUltimate(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const startX = fighter.x;
    const destinationX = Phaser.Math.Clamp(startX + 34 * direction, bounds.minX + 24, bounds.maxX - 24);

    this.startUltimateCue(fighter, 'RED-LINE', 'BARRAGE', 0xf6cf4d, 0x3d4a1c, direction);
    this.spawnUltimateCharge(startX + 8 * direction, fighter.y - 60, 0xf6cf4d, 1.18);
    this.spawnAuxiliary('ground.small', startX - 12 * direction, fighter.y + 4, fighter.y + 6, -direction);
    fighter.nudge(destinationX - fighter.x, 0, bounds);
    this.spawnAuxiliary('ground.shock', fighter.x + 42 * direction, fighter.y - 2, fighter.y + 18, direction);
    this.scene.tweens.add({
      targets: fighter.container,
      scaleX: 1.1,
      scaleY: 0.92,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 90,
    });
    this.shake(82, 0.0034);
  }

  private startBusterBulldogUltimate(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const dashDistance = 94;
    const startX = fighter.x;
    const targetX = Phaser.Math.Clamp(fighter.x + dashDistance * direction, bounds.minX + 24, bounds.maxX - 24);
    const actualDistance = targetX - fighter.x;

    fighter.nudge(actualDistance, 0, bounds);
    this.shake(80, 0.003);

    for (let index = 0; index < 4; index += 1) {
      const progress = index / 3;
      const x = startX + actualDistance * progress - 18 * direction;
      const y = fighter.y + 6 + (index % 2) * 4;
      this.spawnAuxiliary('ground.small', x, y, fighter.y - 2, direction);
    }
    this.spawnAuxiliary('ground.shock', fighter.x + 48 * direction, fighter.y - 2, fighter.y + 16, direction);
  }

  private resolveAxeRainStrike(strike: AxeRainStrike): CombatImpact[] {
    const attack = attacksById.budget_axe_rain;
    const areaHit = attack.areaHit;
    if (!areaHit) {
      return [];
    }
    const hitbox: Rect = {
      x: strike.x + areaHit.hitbox.offsetX,
      y: strike.y + areaHit.hitbox.offsetY,
      width: areaHit.hitbox.width,
      height: areaHit.hitbox.height,
    };
    const impacts: CombatImpact[] = [];

    for (const target of this.context.getCurrentTargets()) {
      if (
        target.instanceId === strike.owner.instanceId
        || !canCombatFactionHit(strike.owner.faction, target.faction)
        || target.state === 'dead'
        || strike.hitTargetInstanceIds.has(target.instanceId)
      ) {
        continue;
      }

      if (Math.abs(target.y - strike.y) > areaHit.laneTolerance || Math.abs(target.z) > areaHit.heightTolerance) {
        continue;
      }

      const hurtbox = target.getHurtbox();
      const contact = hurtbox ? getRectOverlapCenter(hitbox, hurtbox) : null;
      if (!contact) {
        continue;
      }

      strike.hitTargetInstanceIds.add(target.instanceId);
      target.showDebugContact(contact.x, contact.y);
      const response = target.getCombatResponse();
      const outcome = response === 'guard'
        ? 'blocked'
        : response === 'armor'
          ? 'armored'
        : response === 'invulnerable'
          ? 'invulnerable'
          : 'hit';

      if (outcome === 'hit') {
        target.receiveHit({
          damage: areaHit.damage,
          hitstunMs: areaHit.hitstunMs,
          knockbackX: areaHit.knockbackX,
          knockbackY: areaHit.knockbackY,
          sourceFacing: strike.owner.facing,
        });
      } else if (outcome === 'armored') {
        target.receiveArmoredHit(areaHit.damage);
      }

      impacts.push({
        damage: outcome === 'hit' || outcome === 'armored' ? areaHit.damage : 0,
        attackId: 'budget_axe_rain',
        outcome,
        timeline: attack.timeline,
        contactX: contact.x,
        contactY: contact.y,
        attacker: strike.owner,
        defender: target,
      });
    }

    return impacts;
  }

  private spawnAxeRainFx(x: number, y: number): void {
    const sprite = this.scene.add
      .sprite(x, y - 168, 'budget-barbarian-ultimate-fx')
      .setOrigin(0.5)
      .setDepth(y + 18)
      .setScale(1.08);

    sprite.play('budget-barbarian-axe-fall');
    this.scene.tweens.add({
      targets: sprite,
      y: y - 62,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        sprite.play('budget-barbarian-axe-impact');
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          sprite.play('budget-barbarian-axe-stuck');
          this.scene.time.delayedCall(720, () => sprite.destroy());
        });
      },
    });
  }

  private spawnAuxiliary(id: AuxiliaryVfxRecipeId, x: number, y: number, depth: number, direction = 1): void {
    this.universalVfx.spawn(getAuxiliaryVfxRecipe(id), x, y, depth, this.vfxQuality, direction);
  }

  private spawnVfxLabPreview(): void {
    const recipe = getVfxLabRecipe(this.getVfxLabRecipeId());
    const centerX = this.context.getVisibleCenterX();
    const y = recipe.anchor === 'ground' ? 408 : 342;
    this.universalVfx.spawn(recipe, centerX, y, 2230, this.vfxQuality);
  }

  private shake(durationMs: number, intensity: number): void {
    const scale = this.context.getShakeScale();
    if (durationMs <= 0 || intensity <= 0 || scale <= 0) {
      return;
    }
    this.scene.cameras.main.shake(durationMs, intensity * scale);
  }
}
