import Phaser from 'phaser';
import type { Fighter, FighterBounds, FighterFacing } from './Fighter';
import type { ProjectileDefinition } from '../data/projectiles';
import { getRectOverlapCenter, type Rect } from '../utils/Rect';
import type { CombatOutcome } from './CombatResolver';
import { canCombatFactionHit, type CombatFaction } from './CombatFaction';

type ActiveProjectile = {
  owner: Fighter;
  ownerInstanceId: number;
  ownerFaction: CombatFaction;
  facing: FighterFacing;
  definition: ProjectileDefinition;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  ageMs: number;
  hitTargetInstanceIds: Set<number>;
};

export type ProjectileHit = {
  projectileId: string;
  sourceAttackId: string;
  outcome: CombatOutcome;
  impactAnimationKey: string;
  damage: number;
  x: number;
  y: number;
  target: Fighter;
  attacker: Fighter;
};

export class ProjectileSystem {
  private readonly projectiles: ActiveProjectile[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(owner: Fighter, definition: ProjectileDefinition): void {
    const direction = owner.facing === 'right' ? 1 : -1;
    const x = owner.x + definition.spawnOffsetX * direction;
    const y = owner.y;
    const sprite = this.scene.add
      .sprite(x, y + definition.spawnOffsetY, definition.textureKey)
      .setOrigin(0.5)
      .setScale(definition.scale)
      .setFlipX(owner.facing === 'left')
      .setDepth(owner.y + 18);

    sprite.play(definition.animationKey);

    this.projectiles.push({
      owner,
      ownerInstanceId: owner.instanceId,
      ownerFaction: owner.faction,
      facing: owner.facing,
      definition,
      sprite,
      x,
      y,
      velocityX: definition.speed * direction,
      velocityY: 0,
      ageMs: 0,
      hitTargetInstanceIds: new Set<number>(),
    });
  }

  update(deltaSeconds: number, targets: Fighter[], bounds: FighterBounds): ProjectileHit[] {
    const hits: ProjectileHit[] = [];

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.ageMs += deltaSeconds * 1000;
      this.updateProjectileVelocity(projectile, targets, deltaSeconds);
      projectile.x += projectile.velocityX * deltaSeconds;
      projectile.y += projectile.velocityY * deltaSeconds;
      projectile.sprite.setPosition(projectile.x, projectile.y + projectile.definition.spawnOffsetY);

      const hitbox = this.getHitbox(projectile);
      let targetContact: { x: number; y: number } | null = null;
      const target = targets.find((candidate) => {
        if (
          candidate.instanceId === projectile.ownerInstanceId
          || !canCombatFactionHit(projectile.ownerFaction, candidate.faction)
          || candidate.state === 'dead'
        ) {
          return false;
        }

        if (projectile.hitTargetInstanceIds.has(candidate.instanceId)) {
          return false;
        }

        if (Math.abs(candidate.y - projectile.y) > projectile.definition.laneTolerance) {
          return false;
        }

        if (Math.abs(candidate.z) > projectile.definition.heightTolerance) {
          return false;
        }

        const hurtbox = candidate.getHurtbox();
        targetContact = hurtbox ? getRectOverlapCenter(hitbox, hurtbox) : null;
        return targetContact !== null;
      });

      if (target) {
        const contact = targetContact ?? { x: projectile.x, y: projectile.y + projectile.definition.spawnOffsetY };
        projectile.hitTargetInstanceIds.add(target.instanceId);
        const response = target.getCombatResponse();
        const outcome: CombatOutcome = response === 'guard'
          ? 'blocked'
          : response === 'armor'
            ? 'armored'
          : response === 'invulnerable'
            ? 'invulnerable'
            : 'hit';
        if (outcome === 'hit') {
          target.receiveHit({
            damage: projectile.definition.damage,
            hitstunMs: projectile.definition.hitstunMs,
            knockbackX: projectile.definition.knockbackX,
            knockbackY: projectile.definition.knockbackY,
            sourceFacing: projectile.facing,
          });
        } else if (outcome === 'armored') {
          target.receiveArmoredHit(projectile.definition.damage);
        }
        hits.push({
          projectileId: projectile.definition.id,
          sourceAttackId: projectile.definition.sourceAttackId,
          outcome,
          impactAnimationKey: projectile.definition.impactAnimationKey,
          damage: outcome === 'hit' || outcome === 'armored' ? projectile.definition.damage : 0,
          x: contact.x,
          y: contact.y,
          target,
          attacker: projectile.owner,
        });
        target.showDebugContact(contact.x, contact.y);
        this.removeAt(index);
        continue;
      }

      if (this.isExpired(projectile, bounds)) {
        this.removeAt(index);
      }
    }

    return hits;
  }

  destroy(): void {
    for (const projectile of this.projectiles) {
      projectile.sprite.destroy();
    }

    this.projectiles.length = 0;
  }

  private getHitbox(projectile: ActiveProjectile): Rect {
    const { definition } = projectile;
    return {
      x: projectile.x + definition.hitbox.offsetX,
      y: projectile.y + definition.spawnOffsetY + definition.hitbox.offsetY,
      width: definition.hitbox.width,
      height: definition.hitbox.height,
    };
  }

  private updateProjectileVelocity(projectile: ActiveProjectile, targets: Fighter[], deltaSeconds: number): void {
    const { definition } = projectile;

    if (!definition.homingStrength) {
      return;
    }

    const target = this.findHomingTarget(projectile, targets);

    if (!target) {
      return;
    }

    const currentVelocity = new Phaser.Math.Vector2(projectile.velocityX, projectile.velocityY);
    const desiredVelocity = new Phaser.Math.Vector2(target.x - projectile.x, target.y - projectile.y)
      .normalize()
      .scale(definition.speed);
    currentVelocity.lerp(desiredVelocity, Phaser.Math.Clamp(definition.homingStrength * deltaSeconds, 0, 1));

    if (currentVelocity.lengthSq() > 0) {
      currentVelocity.normalize().scale(definition.speed);
    }

    projectile.velocityX = currentVelocity.x;
    projectile.velocityY = currentVelocity.y;
    projectile.facing = currentVelocity.x < 0 ? 'left' : 'right';
    projectile.sprite.setFlipX(projectile.facing === 'left');
  }

  private findHomingTarget(projectile: ActiveProjectile, targets: Fighter[]): Fighter | null {
    let closestTarget: Fighter | null = null;
    let closestDistanceSq = Number.POSITIVE_INFINITY;

    for (const candidate of targets) {
      if (
        candidate.instanceId === projectile.ownerInstanceId
        || !canCombatFactionHit(projectile.ownerFaction, candidate.faction)
        || candidate.state === 'dead'
      ) {
        continue;
      }

      if (projectile.hitTargetInstanceIds.has(candidate.instanceId)) {
        continue;
      }

      const distanceSq = Phaser.Math.Distance.Squared(projectile.x, projectile.y, candidate.x, candidate.y);

      if (distanceSq < closestDistanceSq) {
        closestDistanceSq = distanceSq;
        closestTarget = candidate;
      }
    }

    return closestTarget;
  }

  private isExpired(projectile: ActiveProjectile, bounds: FighterBounds): boolean {
    return (
      projectile.ageMs >= projectile.definition.lifetimeMs ||
      projectile.x < bounds.minX - 120 ||
      projectile.x > bounds.maxX + 120 ||
      projectile.y < bounds.minY - 180 ||
      projectile.y > bounds.maxY + 80
    );
  }

  private removeAt(index: number): void {
    const [projectile] = this.projectiles.splice(index, 1);
    projectile.sprite.destroy();
  }
}
