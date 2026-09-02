import type { Fighter } from './Fighter';
import { resolveCombatContact, type CombatOutcome } from './CombatResolver';

export type HitResolution = {
  didHit: boolean;
  didConnect: boolean;
  damage: number;
  attackId?: string;
  outcome?: CombatOutcome;
  contactX?: number;
  contactY?: number;
  attacker?: Fighter;
  defender?: Fighter;
};

export class HitboxSystem {
  resolveHit(attacker: Fighter, defender: Fighter): HitResolution {
    const activeHitbox = attacker.getActiveHitbox();
    const hurtbox = defender.getHurtbox();

    const attack = attacker.getCurrentAttack();
    const defenderHitTargetId = String(defender.instanceId);
    const resolution = resolveCombatContact({
      attack,
      activeHitbox,
      defenderHurtbox: hurtbox,
      defenderIsDead: defender.state === 'dead',
      defenderResponse: defender.getCombatResponse(),
      alreadyHit: attacker.hasHitTarget(defenderHitTargetId),
      attackerX: attacker.x,
      attackerY: attacker.y,
      defenderX: defender.x,
      defenderY: defender.y,
      attackerFacing: attacker.facing,
    });

    if (resolution.outcome === 'miss') {
      return { didHit: false, didConnect: false, damage: 0 };
    }

    if (resolution.outcome === 'hit' && attack) {
      defender.receiveHit({
        damage: resolution.damage,
        hitstunMs: attack.hitstunMs,
        knockbackX: attack.knockbackX,
        knockbackY: attack.knockbackY * resolution.verticalKnockbackDirection,
        sourceFacing: resolution.sourceFacing,
        launchVelocityZ: resolution.launchVelocityZ,
      });
    }

    attacker.registerHit(defenderHitTargetId);
    return {
      didHit: resolution.outcome === 'hit',
      didConnect: true,
      damage: resolution.damage,
      attackId: resolution.attackId,
      outcome: resolution.outcome,
      contactX: resolution.contactX,
      contactY: resolution.contactY,
      attacker,
      defender,
    };
  }
}
