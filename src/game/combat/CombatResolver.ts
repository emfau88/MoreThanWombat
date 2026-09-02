import type { AttackDefinition } from '../data/attacks';
import { intersectsRect, type Rect } from '../utils/Rect';
import type { FighterFacing } from './Fighter';

export type CombatResponse = 'normal' | 'guard' | 'invulnerable';
export type CombatOutcome = 'miss' | 'hit' | 'blocked' | 'invulnerable';
export type CombatMissReason = 'no-hitbox' | 'dead' | 'no-overlap' | 'projectile' | 'already-hit';

export type CombatResolutionInput = {
  attack: AttackDefinition | null;
  activeHitbox: Rect | null;
  defenderHurtbox: Rect | null;
  defenderIsDead: boolean;
  defenderResponse: CombatResponse;
  alreadyHit: boolean;
  attackerX: number;
  attackerY: number;
  defenderX: number;
  defenderY: number;
  attackerFacing: FighterFacing;
};

export type CombatResolution =
  | {
      outcome: 'miss';
      damage: 0;
      reason: CombatMissReason;
    }
  | {
      outcome: 'hit' | 'blocked' | 'invulnerable';
      damage: number;
      attackId: string;
      contactX: number;
      contactY: number;
      sourceFacing: FighterFacing;
      verticalKnockbackDirection: number;
      launchVelocityZ?: number;
    };

export function resolveCombatContact(input: CombatResolutionInput): CombatResolution {
  const { attack, activeHitbox, defenderHurtbox } = input;

  if (!attack || !activeHitbox || !defenderHurtbox) {
    return { outcome: 'miss', damage: 0, reason: 'no-hitbox' };
  }

  if (input.defenderIsDead) {
    return { outcome: 'miss', damage: 0, reason: 'dead' };
  }

  if (attack.projectileId) {
    return { outcome: 'miss', damage: 0, reason: 'projectile' };
  }

  if (input.alreadyHit) {
    return { outcome: 'miss', damage: 0, reason: 'already-hit' };
  }

  if (!intersectsRect(activeHitbox, defenderHurtbox)) {
    return { outcome: 'miss', damage: 0, reason: 'no-overlap' };
  }

  const overlapLeft = Math.max(activeHitbox.x, defenderHurtbox.x);
  const overlapRight = Math.min(activeHitbox.x + activeHitbox.width, defenderHurtbox.x + defenderHurtbox.width);
  const overlapTop = Math.max(activeHitbox.y, defenderHurtbox.y);
  const overlapBottom = Math.min(activeHitbox.y + activeHitbox.height, defenderHurtbox.y + defenderHurtbox.height);
  const isRadialKnockback = attack.knockbackMode === 'radial';
  const sourceFacing = isRadialKnockback
    ? input.defenderX >= input.attackerX
      ? 'right'
      : 'left'
    : input.attackerFacing;
  const verticalKnockbackDirection =
    isRadialKnockback && input.defenderY !== input.attackerY ? Math.sign(input.defenderY - input.attackerY) : 1;
  const outcome = input.defenderResponse === 'guard'
    ? 'blocked'
    : input.defenderResponse === 'invulnerable'
      ? 'invulnerable'
      : 'hit';

  return {
    outcome,
    damage: outcome === 'hit' ? attack.damage : 0,
    attackId: attack.id,
    contactX: (overlapLeft + overlapRight) * 0.5,
    contactY: (overlapTop + overlapBottom) * 0.5,
    sourceFacing,
    verticalKnockbackDirection,
    launchVelocityZ: attack.launchVelocityZ,
  };
}
