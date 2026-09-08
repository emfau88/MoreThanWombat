import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLAYER_DEFENSE_CONTRACT,
  choosePlayerDefense,
  getDefenseDurationMs,
  getDefenseResponse,
  getWakeUpResponse,
  isIncapacitatedPhase,
} from '../src/game/combat/DefenseContract';

test('neutral defend selects guard while strong direction selects a normalized evade', () => {
  assert.deepEqual(choosePlayerDefense(0.2, 0), { action: 'guard', directionX: 0, directionY: 0 });
  const evade = choosePlayerDefense(1, 1);
  assert.equal(evade.action, 'evade');
  assert.ok(Math.abs(Math.hypot(evade.directionX, evade.directionY) - 1) < 0.0001);
});

test('guard has a protected window followed by punishable recovery', () => {
  assert.equal(getDefenseResponse('guard', 0), 'guard');
  assert.equal(getDefenseResponse('guard', PLAYER_DEFENSE_CONTRACT.guardActiveMs - 1), 'guard');
  assert.equal(getDefenseResponse('guard', PLAYER_DEFENSE_CONTRACT.guardActiveMs), 'normal');
  assert.ok(getDefenseDurationMs('guard') > PLAYER_DEFENSE_CONTRACT.guardActiveMs);
});

test('evade protects only its precise middle window and retains recovery', () => {
  assert.equal(getDefenseResponse('evade', 0), 'normal');
  assert.equal(getDefenseResponse('evade', PLAYER_DEFENSE_CONTRACT.evadeStartupMs), 'invulnerable');
  assert.equal(getDefenseResponse('evade', PLAYER_DEFENSE_CONTRACT.evadeStartupMs
    + PLAYER_DEFENSE_CONTRACT.evadeInvulnerableMs), 'normal');
  assert.ok(getDefenseDurationMs('evade') > PLAYER_DEFENSE_CONTRACT.evadeStartupMs
    + PLAYER_DEFENSE_CONTRACT.evadeInvulnerableMs);
});

test('wake-up protection ends before recovery and knockdown phases remain distinct', () => {
  assert.equal(getWakeUpResponse(PLAYER_DEFENSE_CONTRACT.wakeUpInvulnerableMs - 1), 'invulnerable');
  assert.equal(getWakeUpResponse(PLAYER_DEFENSE_CONTRACT.wakeUpInvulnerableMs), 'normal');
  for (const phase of ['launched', 'knockdown', 'grounded', 'wake_up']) assert.ok(isIncapacitatedPhase(phase));
  assert.equal(isIncapacitatedPhase('dead'), false);
});
