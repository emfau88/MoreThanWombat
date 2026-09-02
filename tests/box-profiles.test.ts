import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAttackHitboxWindow,
  getFighterBoxProfileId,
  resolveFighterBox,
  validateAttackHitboxProfile,
  type AttackHitboxProfile,
} from '../src/game/combat/BoxProfiles';
import { canCombatFactionHit } from '../src/game/combat/CombatFaction';
import { attacksById } from '../src/game/data/attacks';
import { getRectOverlapCenter } from '../src/game/utils/Rect';

const sampleProfile: AttackHitboxProfile = {
  laneTolerance: 32,
  heightTolerance: 70,
  windows: [
    { id: 'early', startMs: 0, endMs: 20, boxes: [{ offsetX: 10, offsetY: -20, width: 20, height: 20 }] },
    { id: 'main', startMs: 20, endMs: 60, boxes: [{ offsetX: 12, offsetY: -22, width: 28, height: 24 }] },
    { id: 'late', startMs: 60, endMs: 80, boxes: [{ offsetX: 14, offsetY: -20, width: 18, height: 20 }] },
  ],
};

test('attack hitbox windows switch on exact half-open boundaries', () => {
  assert.equal(getAttackHitboxWindow(sampleProfile, -1), null);
  assert.equal(getAttackHitboxWindow(sampleProfile, 0)?.id, 'early');
  assert.equal(getAttackHitboxWindow(sampleProfile, 19.999)?.id, 'early');
  assert.equal(getAttackHitboxWindow(sampleProfile, 20)?.id, 'main');
  assert.equal(getAttackHitboxWindow(sampleProfile, 60)?.id, 'late');
  assert.equal(getAttackHitboxWindow(sampleProfile, 80), null);
});

test('authored hitbox profiles cover their complete active phase', () => {
  const authoredAttacks = Object.values(attacksById).filter((attack) => attack.hitboxProfile);
  assert.ok(authoredAttacks.length >= 3);

  for (const attack of authoredAttacks) {
    assert.deepEqual(
      validateAttackHitboxProfile(attack.hitboxProfile!, attack.activeMs),
      [],
      attack.id,
    );
  }

  const axeRainArea = attacksById.budget_axe_rain.areaHit;
  assert.ok(axeRainArea);
  assert.equal(axeRainArea.hitbox.width, 96);
  assert.equal(axeRainArea.laneTolerance * 2, 36);
});

test('fighter states select explicit hurtbox and pushbox profiles', () => {
  assert.equal(getFighterBoxProfileId('idle', true), 'standing');
  assert.equal(getFighterBoxProfileId('walk', true), 'moving');
  assert.equal(getFighterBoxProfileId('attack', true), 'attacking');
  assert.equal(getFighterBoxProfileId('hitstun', true), 'hit');
  assert.equal(getFighterBoxProfileId('jump', false), 'airborne');
  assert.equal(getFighterBoxProfileId('dead', true), 'knockdown');

  const fallback = { offsetX: -10, offsetY: -20, width: 20, height: 20 };
  assert.equal(resolveFighterBox(fallback, { airborne: null }, 'airborne'), null);
  assert.deepEqual(resolveFighterBox(fallback, undefined, 'standing'), fallback);
});

test('combat factions reject friendly fire while allowing opposing teams', () => {
  assert.equal(canCombatFactionHit('player', 'player'), false);
  assert.equal(canCombatFactionHit('enemy', 'enemy'), false);
  assert.equal(canCombatFactionHit('player', 'enemy'), true);
  assert.equal(canCombatFactionHit('enemy', 'player'), true);
  assert.equal(canCombatFactionHit('neutral', 'neutral'), false);
});

test('all contact types can share the actual overlap center', () => {
  assert.deepEqual(
    getRectOverlapCenter(
      { x: 10, y: 10, width: 30, height: 20 },
      { x: 30, y: 15, width: 20, height: 20 },
    ),
    { x: 35, y: 22.5 },
  );
  assert.equal(
    getRectOverlapCenter(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 0, width: 10, height: 10 },
    ),
    null,
  );
});
