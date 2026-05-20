import type { Fighter } from './Fighter';
import { intersectsRect } from '../utils/Rect';

export type HitResolution = {
  didHit: boolean;
  damage: number;
  attackId?: string;
};

export class HitboxSystem {
  resolveHit(attacker: Fighter, defender: Fighter): HitResolution {
    const activeHitbox = attacker.getActiveHitbox();
    const hurtbox = defender.getHurtbox();

    if (!activeHitbox || !hurtbox) {
      return { didHit: false, damage: 0 };
    }

    if (defender.state === 'dead') {
      return { didHit: false, damage: 0 };
    }

    if (!intersectsRect(activeHitbox, hurtbox)) {
      return { didHit: false, damage: 0 };
    }

    const attack = attacker.getCurrentAttack();

    if (!attack) {
      return { didHit: false, damage: 0 };
    }

    if (attack.projectileId) {
      return { didHit: false, damage: 0 };
    }

    const defenderHitTargetId = String(defender.instanceId);

    if (attacker.hasHitTarget(defenderHitTargetId)) {
      return { didHit: false, damage: 0 };
    }

    const isRadialSlam = attack.id === 'wombat_earthshaker';
    const sourceFacing = isRadialSlam
      ? defender.x >= attacker.x
        ? 'right'
        : 'left'
      : attacker.facing;
    const verticalDirection = isRadialSlam && defender.y !== attacker.y ? Math.sign(defender.y - attacker.y) : 1;

    defender.receiveHit({
      damage: attack.damage,
      hitstunMs: attack.hitstunMs,
      knockbackX: attack.knockbackX,
      knockbackY: attack.knockbackY * verticalDirection,
      sourceFacing,
      launchVelocityZ: isRadialSlam ? 500 : undefined,
    });
    attacker.registerHit(defenderHitTargetId);
    return {
      didHit: true,
      damage: attack.damage,
      attackId: attack.id,
    };
  }
}
