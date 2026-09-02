import Phaser from 'phaser';
import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import type { Fighter, FighterBounds } from './Fighter';
import type { CombatImpact, HitFeedbackProfile, PresentedImpactStyle } from './HitFeedback';
import { MoveStartCueController } from './MoveStartCueController';
import { getRectOverlapCenter, type Rect } from '../utils/Rect';
import { canCombatFactionHit } from './CombatFaction';
import {
  cycleVfxStyleLockMode,
  getStyleLockContactTexture,
  getStyleLockGroundTexture,
  type VfxStyleLockMode,
} from './VfxStyleLock';

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

type ActiveContactSpark = {
  container: Phaser.GameObjects.Container;
  elapsedMs: number;
  durationMs: number;
  startScale: number;
  endScaleX: number;
  endScaleY: number;
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
  private readonly contactSparks: ActiveContactSpark[] = [];
  private readonly moveStartCues: MoveStartCueController;
  private vfxStyleLockMode: VfxStyleLockMode = 'reference';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly context: CombatPresentationContext,
  ) {
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

    this.spawnGenericContactSpark(contactX, contactY, target.y + 20, profile.sparkStyle, profile.sparkScale);
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
    this.updateContactSparks(deltaMs);
  }

  cycleVfxStyleLockMode(): VfxStyleLockMode {
    this.vfxStyleLockMode = cycleVfxStyleLockMode(this.vfxStyleLockMode);
    if (this.vfxStyleLockMode !== 'reference') {
      this.spawnVfxStyleLockPreview();
    }
    return this.vfxStyleLockMode;
  }

  getVfxStyleLockMode(): VfxStyleLockMode {
    return this.vfxStyleLockMode;
  }

  clearTransientEffects(): void {
    for (const strike of this.axeRainStrikes) {
      strike.warning.destroy();
    }
    this.axeRainStrikes.length = 0;
    for (const spark of this.contactSparks) {
      spark.container.destroy(true);
    }
    this.contactSparks.length = 0;
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

  private spawnGenericContactSpark(
    x: number,
    y: number,
    depth: number,
    style: PresentedImpactStyle,
    scale: number,
  ): void {
    const styleLockTexture = getStyleLockContactTexture(this.vfxStyleLockMode, style);
    if (styleLockTexture) {
      this.spawnStyleLockContactSpark(x, y, depth, styleLockTexture, scale);
      return;
    }

    const palette: Record<PresentedImpactStyle, { core: number; edge: number; rays: number }> = {
      physical: { core: 0xfff7d1, edge: 0xff9f43, rays: 5 },
      magic: { core: 0xffffff, edge: 0xd86cff, rays: 6 },
      block: { core: 0xd7fbff, edge: 0x52c7e8, rays: 4 },
      armor: { core: 0xffdf9e, edge: 0xb76b2d, rays: 5 },
      invulnerable: { core: 0xe9fdff, edge: 0x77d9ff, rays: 3 },
    };
    const colors = palette[style];
    const container = this.scene.add.container(x, y).setDepth(depth);
    const ring = this.scene.add
      .ellipse(0, 0, 30, 20, colors.edge, 0.08)
      .setStrokeStyle(2, colors.edge, 0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    const core = this.scene.add
      .ellipse(0, 0, 15, 11, colors.core, 0.96)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rays: Phaser.GameObjects.Rectangle[] = [];

    for (let index = 0; index < colors.rays; index += 1) {
      const angle = (Math.PI * 2 * index) / colors.rays + (style === 'magic' ? 0.24 : 0);
      const length = 15 + (index % 2) * 5;
      const ray = this.scene.add
        .rectangle(Math.cos(angle) * 12, Math.sin(angle) * 8, length, 3, colors.edge, 0.9)
        .setRotation(angle)
        .setBlendMode(Phaser.BlendModes.ADD);
      rays.push(ray);
    }

    container.add([ring, ...rays, core]);
    const startScale = scale * 0.68;
    container.setScale(startScale);
    this.contactSparks.push({
      container,
      elapsedMs: 0,
      durationMs: style === 'invulnerable' ? 105 : 125,
      startScale,
      endScaleX: scale * 1.16,
      endScaleY: scale * (style === 'block' ? 0.94 : 1.16),
    });
  }

  private spawnStyleLockContactSpark(
    x: number,
    y: number,
    depth: number,
    textureKey: string,
    scale: number,
  ): void {
    const container = this.scene.add.container(x, y).setDepth(depth);
    const image = this.scene.add.image(0, 0, textureKey).setOrigin(0.5);
    container.add(image);
    const startScale = scale * 0.44;
    this.contactSparks.push({
      container: container.setScale(startScale),
      elapsedMs: 0,
      durationMs: 118,
      startScale,
      endScaleX: scale * 0.64,
      endScaleY: scale * 0.64,
    });
  }

  private spawnVfxStyleLockPreview(): void {
    const physicalTexture = getStyleLockContactTexture(this.vfxStyleLockMode, 'physical');
    const magicTexture = getStyleLockContactTexture(this.vfxStyleLockMode, 'magic');
    const groundTexture = getStyleLockGroundTexture(this.vfxStyleLockMode);
    if (!physicalTexture || !magicTexture || !groundTexture) {
      return;
    }

    const centerX = this.context.getVisibleCenterX();
    const previews = [
      { texture: physicalTexture, x: centerX - 150, y: 342, depth: 2230, scale: 0.6 },
      { texture: magicTexture, x: centerX, y: 342, depth: 2230, scale: 0.6 },
      { texture: groundTexture, x: centerX + 150, y: 408, depth: 2230, scale: 0.58 },
    ];

    for (const preview of previews) {
      const container = this.scene.add.container(preview.x, preview.y).setDepth(preview.depth);
      container.add(this.scene.add.image(0, 0, preview.texture).setOrigin(0.5));
      this.contactSparks.push({
        container: container.setScale(preview.scale),
        elapsedMs: 0,
        durationMs: 900,
        startScale: preview.scale,
        endScaleX: preview.scale * 1.04,
        endScaleY: preview.scale * 1.04,
      });
    }
  }

  private updateContactSparks(deltaMs: number): void {
    for (let index = this.contactSparks.length - 1; index >= 0; index -= 1) {
      const spark = this.contactSparks[index];
      spark.elapsedMs += Math.max(0, deltaMs);
      const progress = Phaser.Math.Clamp(spark.elapsedMs / spark.durationMs, 0, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      spark.container
        .setAlpha(1 - progress)
        .setScale(
          Phaser.Math.Linear(spark.startScale, spark.endScaleX, eased),
          Phaser.Math.Linear(spark.startScale, spark.endScaleY, eased),
        );
      if (progress >= 1) {
        spark.container.destroy(true);
        this.contactSparks.splice(index, 1);
      }
    }
  }

  private shake(durationMs: number, intensity: number): void {
    const scale = this.context.getShakeScale();
    if (durationMs <= 0 || intensity <= 0 || scale <= 0) {
      return;
    }
    this.scene.cameras.main.shake(durationMs, intensity * scale);
  }
}
