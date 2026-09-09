import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLAYER_MOVEMENT_CONTRACT,
  advanceRunCharge,
  getClampedInputMagnitude,
  shouldKeepRunning,
} from '../src/game/combat/MovementContract';

test('run requires a short deliberate full-direction hold on keyboard and touch', () => {
  assert.equal(advanceRunCharge(0, 0.7, 0, 500), 0);
  assert.equal(advanceRunCharge(0, 1, 0, 100), 100);
  assert.equal(advanceRunCharge(100, 1, 0, 200), PLAYER_MOVEMENT_CONTRACT.runActivationMs);
});

test('run survives steering but releases around a neutral stick', () => {
  assert.equal(shouldKeepRunning(0.3, 0), true);
  assert.equal(shouldKeepRunning(0.1, 0.1), false);
  assert.equal(getClampedInputMagnitude(1, 1), 1);
});
