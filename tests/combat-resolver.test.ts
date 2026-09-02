import assert from 'node:assert/strict';
import test from 'node:test';
import type { AttackDefinition } from '../src/game/data/attacks';
import { resolveCombatContact } from '../src/game/combat/CombatResolver';

const baseAttack: AttackDefinition = {
  id: 'test_hit',
  label: 'Test Hit',
  startupMs: 10,
  activeMs: 20,
  recoveryMs: 30,
  damage: 12,
  hitstunMs: 100,
  knockbackX: 80,
  knockbackY: 12,
  hitbox: { offsetX: 0, offsetY: 0, width: 20, height: 20 },
};

function resolve(overrides: Partial<Parameters<typeof resolveCombatContact>[0]> = {}) {
  return resolveCombatContact({
    attack: baseAttack,
    activeHitbox: { x: 10, y: 10, width: 20, height: 20 },
    defenderHurtbox: { x: 20, y: 15, width: 20, height: 20 },
    defenderIsDead: false,
    defenderResponse: 'normal',
    alreadyHit: false,
    attackerX: 10,
    attackerY: 20,
    defenderX: 30,
    defenderY: 20,
    attackerFacing: 'right',
    ...overrides,
  });
}

test('combat resolution returns the center of the actual overlap', () => {
  const result = resolve();
  assert.equal(result.outcome, 'hit');
  if (result.outcome === 'miss') return;
  assert.equal(result.damage, 12);
  assert.equal(result.contactX, 25);
  assert.equal(result.contactY, 22.5);
});

test('combat resolution rejects non-overlap and duplicate targets', () => {
  assert.deepEqual(resolve({ defenderHurtbox: { x: 100, y: 100, width: 20, height: 20 } }), {
    outcome: 'miss',
    damage: 0,
    reason: 'no-overlap',
  });
  assert.deepEqual(resolve({ alreadyHit: true }), {
    outcome: 'miss',
    damage: 0,
    reason: 'already-hit',
  });
});

test('combat resolution enforces authored lane and height tolerances', () => {
  assert.deepEqual(resolve({ attackerY: 0, defenderY: 35, laneTolerance: 34 }), {
    outcome: 'miss',
    damage: 0,
    reason: 'lane-range',
  });
  assert.deepEqual(resolve({ attackerZ: 0, defenderZ: 81, heightTolerance: 80 }), {
    outcome: 'miss',
    damage: 0,
    reason: 'height-range',
  });
});

test('guard and invulnerability connect without dealing damage', () => {
  const blocked = resolve({ defenderResponse: 'guard' });
  const invulnerable = resolve({ defenderResponse: 'invulnerable' });
  assert.equal(blocked.outcome, 'blocked');
  assert.equal(blocked.damage, 0);
  assert.equal(invulnerable.outcome, 'invulnerable');
  assert.equal(invulnerable.damage, 0);
});

test('armor takes damage without becoming a normal hit outcome', () => {
  const armored = resolve({ defenderResponse: 'armor' });
  assert.equal(armored.outcome, 'armored');
  assert.equal(armored.damage, baseAttack.damage);
});

test('radial knockback derives facing and vertical direction from positions', () => {
  const radialAttack = { ...baseAttack, knockbackMode: 'radial' as const, launchVelocityZ: 500 };
  const result = resolve({
    attack: radialAttack,
    defenderX: 0,
    defenderY: 5,
    attackerX: 10,
    attackerY: 20,
  });
  assert.equal(result.outcome, 'hit');
  if (result.outcome === 'miss') return;
  assert.equal(result.sourceFacing, 'left');
  assert.equal(result.verticalKnockbackDirection, -1);
  assert.equal(result.launchVelocityZ, 500);
});
