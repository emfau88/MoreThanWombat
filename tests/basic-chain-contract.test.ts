import assert from 'node:assert/strict';
import test from 'node:test';
import { canBufferBasicChain, canCancelIntoBasicChain } from '../src/game/combat/BasicChainContract';
import type { AttackDefinition } from '../src/game/data/attacks';

const attack: AttackDefinition = {
  id: 'test-chain', label: 'Test', startupMs: 100, activeMs: 100, recoveryMs: 200,
  damage: 1, hitstunMs: 1, knockbackX: 0, knockbackY: 0,
  hitbox: { offsetX: 0, offsetY: 0, width: 10, height: 10 },
  basicChainWindow: { inputOpenMs: 120, inputCloseMs: 330, hitCancelMs: 230, whiffCancelMs: 360 },
};

test('basic chain input uses a bounded inclusive buffer window', () => {
  assert.equal(canBufferBasicChain(attack, 119), false);
  assert.equal(canBufferBasicChain(attack, 120), true);
  assert.equal(canBufferBasicChain(attack, 330), true);
  assert.equal(canBufferBasicChain(attack, 331), false);
});

test('a confirmed hit continues earlier than a whiff', () => {
  assert.equal(canCancelIntoBasicChain(attack, 230, true), true);
  assert.equal(canCancelIntoBasicChain(attack, 230, false), false);
  assert.equal(canCancelIntoBasicChain(attack, 360, false), true);
});
