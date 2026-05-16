import Phaser from 'phaser';
import type { Fighter, FighterBounds, FighterFacing } from './Fighter';
import type { ProjectileDefinition } from '../data/projectiles';
import { intersectsRect, type Rect } from '../utils/Rect';

type ActiveProjectile = {
  ownerInstanceId: number;
  facing: FighterFacing;
  definition: ProjectileDefinition;
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  ageMs: number;
  hitTargetInstanceIds: Set<number>;
};

export type ProjectileHit = {
  projectileId: string;
  impactAnimationKey: string;
  damage: number;
  x: number;
  y: number;
  target: Fighter;
};

export class ProjectileSystem {
  private readonly projectiles: ActiveProjectile[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(owner: Fighter, definition: ProjectileDefinition): void {
    const direction = owner.facing === 'right' ? 1 : -1;
    const x = owner.x + definition.spawnOffsetX * direction;
    const y = owner.y + definition.spawnOffsetY;
    const sprite = this.scene.add
      .sprite(x, y, definition.textureKey)
      .setOrigin(0.5)
      .setScale(definition.scale)
      .setFlipX(owner.facing === 'left')
      .setDepth(owner.y + 18);

    sprite.play(definition.animationKey);

    this.projectiles.push({
      ownerInstanceId: owner.instanceId,
      facing: owner.facing,
      definition,
      sprite,
      x,
      y,
      ageMs: 0,
      hitTargetInstanceIds: new Set<number>(),
    });
  }

  update(deltaSeconds: number, targets: Fighter[], bounds: FighterBounds): ProjectileHit[] {
    const hits: ProjectileHit[] = [];

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      const direction = projectile.facing === 'right' ? 1 : -1;
      projectile.ageMs += deltaSeconds * 1000;
      projectile.x += projectile.definition.speed * direction * deltaSeconds;
      projectile.sprite.setPosition(projectile.x, projectile.y);

      const hitbox = this.getHitbox(projectile);
      const target = targets.find((candidate) => {
        if (candidate.instanceId === projectile.ownerInstanceId || candidate.state === 'dead') {
          return false;
        }

        if (projectile.hitTargetInstanceIds.has(candidate.instanceId)) {
          return false;
        }

        const hurtbox = candidate.getHurtbox();
        return hurtbox ? intersectsRect(hitbox, hurtbox) : false;
      });

      if (target) {
        projectile.hitTargetInstanceIds.add(target.instanceId);
        target.receiveHit({
          damage: projectile.definition.damage,
          hitstunMs: projectile.definition.hitstunMs,
          knockbackX: projectile.definition.knockbackX,
          knockbackY: projectile.definition.knockbackY,
          sourceFacing: projectile.facing,
        });
        hits.push({
          projectileId: projectile.definition.id,
          impactAnimationKey: projectile.definition.impactAnimationKey,
          damage: projectile.definition.damage,
          x: projectile.x,
          y: projectile.y,
          target,
        });
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
      y: projectile.y + definition.hitbox.offsetY,
      width: definition.hitbox.width,
      height: definition.hitbox.height,
    };
  }

  private isExpired(projectile: ActiveProjectile, bounds: FighterBounds): boolean {
    return (
      projectile.ageMs >= projectile.definition.lifetimeMs ||
      projectile.x < bounds.minX - 120 ||
      projectile.x > bounds.maxX + 120
    );
  }

  private removeAt(index: number): void {
    const [projectile] = this.projectiles.splice(index, 1);
    projectile.sprite.destroy();
  }
}
