import Phaser from 'phaser';
import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import type { ProjectileHit } from './ProjectileSystem';
import type { Fighter, FighterBounds } from './Fighter';
import type { HitResolution } from './HitboxSystem';
import type { CombatImpact } from './HitFeedback';
import { MoveStartCueController } from './MoveStartCueController';
import { intersectsRect, type Rect } from '../utils/Rect';

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
};

export class CombatPresentationController {
  private readonly axeRainStrikes: AxeRainStrike[] = [];
  private readonly moveStartCues: MoveStartCueController;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly context: CombatPresentationContext,
  ) {
    this.moveStartCues = new MoveStartCueController({
      'wombat-earthshaker': (fighter) => {
        this.spawnFx('wombat-earthshaker-fx', fighter.x, fighter.y - 178, fighter.y - 6, false, 1.72, 'wombat-earthshaker-fx');
        this.scene.cameras.main.shake(150, 0.008);
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
        this.scene.cameras.main.shake(100, 0.005);
      },
      'buster-bulldozer': (fighter) => {
        this.startBusterBulldogUltimate(fighter);
      },
    });
  }

  handleAttackStarted(fighter: Fighter, attack: AttackDefinition): void {
    this.moveStartCues.handleAttackStarted(fighter, attack);
  }

  spawnHitImpact(hit: HitResolution): void {
    const attackId = hit.attackId;
    const target = hit.defender;
    if (!attackId || !target) {
      return;
    }

    const contactX = hit.contactX ?? target.x;
    const contactY = hit.contactY ?? target.y - 42;

    if (attackId === 'discount_miscast') {
      this.spawnFx('discount-wizard-fx-miscast', contactX, contactY, target.y + 8, false, 1.08);
      return;
    }

    if (attackId === 'discount_clearance_orb') {
      this.spawnFx('discount-wizard-ultimate-impact', contactX, contactY, target.y + 10, false, 1.28, 'discount-wizard-ultimate-fx');
      return;
    }

    if (attackId === 'wombat_earthshaker') {
      this.spawnFx('wombat-earthshaker-fx', contactX, target.y - 130, target.y + 8, false, 1.35, 'wombat-earthshaker-fx');
      return;
    }

    if (attackId === 'discount_wand_smack' || attackId === 'discount_fireball_cast') {
      this.spawnFx('discount-wizard-fx-hit-puff', contactX, contactY, target.y + 8, false, 0.96);
    }
  }

  spawnProjectileImpact(projectileHit: ProjectileHit): void {
    if (projectileHit.projectileId === 'discount_ultimate_orb_projectile') {
      this.spawnFx(
        projectileHit.impactAnimationKey,
        projectileHit.x,
        projectileHit.y,
        projectileHit.target.y + 10,
        false,
        1.28,
        'discount-wizard-ultimate-fx',
      );
      return;
    }

    this.spawnFx(
      projectileHit.impactAnimationKey,
      projectileHit.x,
      projectileHit.y,
      projectileHit.target.y + 8,
      false,
      0.96,
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
        this.scene.cameras.main.shake(70, 0.004);
      }

      strike.activeMs -= deltaMs;
      impacts.push(...this.resolveAxeRainStrike(strike));

      if (strike.activeMs <= 0) {
        this.axeRainStrikes.splice(index, 1);
      }
    }

    return impacts;
  }

  clearTransientEffects(): void {
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
    this.scene.cameras.main.shake(90, 0.004);
  }

  private startBudgetBarbarianUltimate(fighter: Fighter): void {
    const bounds = this.context.getArenaBounds();
    const direction = fighter.facing === 'right' ? 1 : -1;
    const offsets = [78, 148, 218];

    for (let index = 0; index < offsets.length; index += 1) {
      const x = Phaser.Math.Clamp(fighter.x + offsets[index] * direction, bounds.minX + 24, bounds.maxX - 24);
      const y = Phaser.Math.Clamp(fighter.y + (index - 1) * 10, bounds.minY + 12, bounds.maxY - 12);
      const warning = this.scene.add
        .ellipse(x, y - 8, 88, 34, 0xff3f1f, 0.16)
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
    this.scene.cameras.main.shake(120, 0.006);

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
    const hitbox: Rect = {
      x: strike.x - 48,
      y: strike.y - 82,
      width: 96,
      height: 96,
    };
    const impacts: CombatImpact[] = [];

    for (const target of this.context.getCurrentTargets()) {
      if (target.instanceId === strike.owner.instanceId || target.state === 'dead' || strike.hitTargetInstanceIds.has(target.instanceId)) {
        continue;
      }

      const hurtbox = target.getHurtbox();
      if (!hurtbox || !intersectsRect(hitbox, hurtbox)) {
        continue;
      }

      strike.hitTargetInstanceIds.add(target.instanceId);
      const response = target.getCombatResponse();
      const outcome = response === 'guard'
        ? 'blocked'
        : response === 'invulnerable'
          ? 'invulnerable'
          : 'hit';

      if (outcome === 'hit') {
        target.receiveHit({
          damage: 13,
          hitstunMs: 300,
          knockbackX: 135,
          knockbackY: 58,
          sourceFacing: strike.owner.facing,
        });
      }

      impacts.push({
        damage: outcome === 'hit' ? 13 : 0,
        attackId: 'budget_axe_rain',
        outcome,
        timeline: attacksById.budget_axe_rain.timeline,
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
}
