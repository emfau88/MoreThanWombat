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
  getImpactVfxRecipe,
  getVfxLabRecipe,
  type VfxLabRecipeId,
  type VfxQuality,
} from './VfxRecipeRegistry';
import { UniversalVfxDirector } from './UniversalVfxDirector';

type AxeRainStrike = {
  owner: Fighter;
  x: number;
  y: number;
  delayMs: number;
  activeMs: number;
  didImpact: boolean;
  warning: Phaser.GameObjects.Ellipse;
  hitTargetInstanceIds: Set<number>;
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
        this.spawnFx('wombat-earthshaker-fx', fighter.x, fighter.y - 178, fighter.y - 6, false, 1.72, 'wombat-earthshaker-fx');
        this.shake(90, 0.0032);
      },
      'discount-fireball': (fighter) => {
        this.spawnCastFx('discount-wizard-fx-fireball', fighter, 66, -52, 1.08);
      },
      'discount-miscast': (fighter) => {
        this.spawnCastFx('discount-wizard-fx-miscast', fighter, 42, -58, 1.18);
      },
      'discount-clearance-orb': (fighter) => {
        this.startDiscountWizardUltimate(fighter);
      },
      'budget-axe-rain': (fighter) => {
        this.startBudgetBarbarianUltimate(fighter);
        this.shake(65, 0.0022);
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
      this.spawnFx('discount-wizard-fx-miscast', contactX, contactY, target.y + 8, false, 1.08);
    } else if (outcome === 'hit' && attackId === 'discount_clearance_orb') {
      this.spawnFx('discount-wizard-ultimate-impact', contactX, contactY, target.y + 10, false, 1.28, 'discount-wizard-ultimate-fx');
    } else if (outcome === 'hit' && attackId === 'wombat_earthshaker') {
      this.spawnFx('wombat-earthshaker-fx', contactX, target.y - 130, target.y + 8, false, 1.35, 'wombat-earthshaker-fx');
    } else if (outcome === 'hit' && (attackId === 'discount_wand_smack' || attackId === 'discount_fireball_cast')) {
      this.spawnFx('discount-wizard-fx-hit-puff', contactX, contactY, target.y + 8, false, 0.96);
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

    for (let index = this.axeRainStrikes.length - 1; index >= 0; index -= 1) {
      const strike = this.axeRainStrikes[index];
      strike.delayMs -= deltaMs;

      if (strike.delayMs > 0) {
        const pulse = 0.82 + Math.sin(this.scene.time.now / 55) * 0.08;
        strike.warning.setScale(pulse, pulse);
        continue;
      }

      if (!strike.didImpact) {
        strike.didImpact = true;
        strike.warning.destroy();
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
    return this.vfxQuality;
  }

  getVfxQuality(): VfxQuality {
    return this.vfxQuality;
  }

  clearTransientEffects(): void {
    this.universalVfx.clear();
    for (const strike of this.axeRainStrikes) {
      strike.warning.destroy();
    }
    this.axeRainStrikes.length = 0;
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

    this.spawnFx('discount-wizard-ultimate-teleport', startX, startY - 70, startY + 14, false, 1.18, 'discount-wizard-ultimate-fx');
    fighter.nudge(destinationX - fighter.x, 0, bounds);

    if (target) {
      fighter.faceTarget(target.x);
    } else {
      fighter.facing = fighter.x < visibleCenterX ? 'right' : 'left';
      fighter.updateVisuals();
    }

    this.spawnFx('discount-wizard-ultimate-teleport', fighter.x, fighter.y - 70, fighter.y + 14, false, 1.28, 'discount-wizard-ultimate-fx');
    this.shake(90, 0.0035);
  }

  private startBudgetBarbarianUltimate(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const offsets = [78, 148, 218];

    for (let index = 0; index < offsets.length; index += 1) {
      const x = Phaser.Math.Clamp(fighter.x + offsets[index] * direction, bounds.minX + 24, bounds.maxX - 24);
      const y = Phaser.Math.Clamp(fighter.y + (index - 1) * 10, bounds.minY + 12, bounds.maxY - 12);
      const warning = this.scene.add
        .ellipse(x, y - 8, 96, 36, 0xff3f1f, 0.16)
        .setStrokeStyle(2, 0xffd166, 0.72)
        .setDepth(y + 6);

      this.axeRainStrikes.push({
        owner: fighter,
        x,
        y,
        delayMs: 190 + index * 150,
        activeMs: 120,
        didImpact: false,
        warning,
        hitTargetInstanceIds: new Set<number>(),
      });
    }
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
      const dust = this.scene.add
        .ellipse(x, y, 34 + index * 8, 14 + index * 2, 0xd8c2a2, 0.28 - index * 0.04)
        .setDepth(fighter.y - 2)
        .setRotation(direction * -0.12);

      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        scaleX: 1.45,
        scaleY: 0.72,
        x: x - direction * (18 + index * 5),
        duration: 220 + index * 35,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      });
    }

    const ring = this.scene.add
      .ellipse(fighter.x + 48 * direction, fighter.y - 44, 92, 52, 0xffe39a, 0.18)
      .setStrokeStyle(3, 0xffd166, 0.72)
      .setDepth(fighter.y + 16)
      .setRotation(direction * 0.08);

    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.55,
      scaleY: 1.2,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
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

  private spawnCastFx(animationKey: string, caster: Fighter, offsetX: number, offsetY: number, scale: number): void {
    const direction = caster.facing === 'right' ? 1 : -1;
    this.spawnFx(animationKey, caster.x + offsetX * direction, caster.y + offsetY, caster.y + 12, caster.facing === 'left', scale);
  }

  private spawnFx(
    animationKey: string,
    x: number,
    y: number,
    depth: number,
    flipX: boolean,
    scale: number,
    textureKey = 'discount-wizard-fx',
  ): void {
    const sprite = this.scene.add.sprite(x, y, textureKey).setOrigin(0.5).setDepth(depth).setFlipX(flipX).setScale(scale);
    sprite.play(animationKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy());
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
