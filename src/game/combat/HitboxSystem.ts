import type { Fighter } from './Fighter';
import { resolveCombatContact, type CombatOutcome } from './CombatResolver';
import { canCombatFactionHit } from './CombatFaction';

export type HitResolution = {
  didHit: boolean;
  didConnect: boolean;
  damage: number;
  attackId?: string;
  outcome?: CombatOutcome;
  contactX?: number;
  contactY?: number;
  hitboxProfileId?: string;
  attacker?: Fighter;
  defender?: Fighter;
};

export class HitboxSystem {
  resolveHit(attacker: Fighter, defender: Fighter): HitResolution {
    if (!canCombatFactionHit(attacker.faction, defender.faction)) {
      return { didHit: false, didConnect: false, damage: 0 };
    }

    const activeHitboxes = attacker.getActiveHitboxes();
    const hurtbox = defender.getHurtbox();

    const attack = attacker.getCurrentAttack();
    const defenderHitTargetId = String(defender.instanceId);
    let connectedProfileId: string | undefined;
    let resolution = resolveCombatContact({
      attack,
      activeHitbox: null,
      defenderHurtbox: hurtbox,
      defenderIsDead: defender.state === 'dead',
      defenderResponse: defender.getCombatResponse(),
      alreadyHit: attacker.hasHitTarget(defenderHitTargetId),
      attackerX: attacker.x,
      attackerY: attacker.y,
      attackerZ: attacker.z,
      defenderX: defender.x,
      defenderY: defender.y,
      defenderZ: defender.z,
      attackerFacing: attacker.facing,
    });

    for (const activeHitbox of activeHitboxes) {
      const candidate = resolveCombatContact({
        attack,
        activeHitbox: activeHitbox.rect,
        defenderHurtbox: hurtbox,
        defenderIsDead: defender.state === 'dead',
        defenderResponse: defender.getCombatResponse(),
        alreadyHit: attacker.hasHitTarget(defenderHitTargetId),
        attackerX: attacker.x,
        attackerY: attacker.y,
        attackerZ: attacker.z,
        defenderX: defender.x,
        defenderY: defender.y,
        defenderZ: defender.z,
        laneTolerance: activeHitbox.laneTolerance,
        heightTolerance: activeHitbox.heightTolerance,
        attackerFacing: attacker.facing,
      });
      resolution = candidate;
      if (candidate.outcome !== 'miss') {
        connectedProfileId = activeHitbox.profileId;
        break;
      }
    }

    if (resolution.outcome === 'miss') {
      return { didHit: false, didConnect: false, damage: 0 };
    }

    if ((resolution.outcome === 'hit' || resolution.outcome === 'guard_broken') && attack) {
      const guardBroken = resolution.outcome === 'guard_broken';
      defender.receiveHit({
        damage: resolution.damage,
        hitstunMs: guardBroken ? Math.max(220, attack.hitstunMs * 0.65) : attack.hitstunMs,
        knockbackX: guardBroken ? attack.knockbackX * 0.5 : attack.knockbackX,
        knockbackY: (guardBroken ? attack.knockbackY * 0.5 : attack.knockbackY) * resolution.verticalKnockbackDirection,
        sourceFacing: resolution.sourceFacing,
        launchVelocityZ: guardBroken ? undefined : resolution.launchVelocityZ,
        hitReaction: guardBroken ? 'hitstun' : attack.hitReaction,
      });
    } else if (resolution.outcome === 'armored') {
      defender.receiveArmoredHit(resolution.damage);
    }

    attacker.registerHit(defenderHitTargetId);
    attacker.showDebugContact(resolution.contactX, resolution.contactY);
    return {
      didHit: resolution.outcome === 'hit' || resolution.outcome === 'guard_broken' || resolution.outcome === 'armored',
      didConnect: true,
      damage: resolution.damage,
      attackId: resolution.attackId,
      outcome: resolution.outcome,
      contactX: resolution.contactX,
      contactY: resolution.contactY,
      hitboxProfileId: connectedProfileId,
      attacker,
      defender,
    };
  }
}
