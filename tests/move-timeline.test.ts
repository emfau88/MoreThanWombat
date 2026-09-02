import assert from 'node:assert/strict';
import test from 'node:test';
import { getAttackPhaseAtElapsed, getMoveDurationMs, getMoveTimelineSnapshot } from '../src/game/combat/MoveTimeline';

const move = { startupMs: 90, activeMs: 80, recoveryMs: 160 };

test('move timeline exposes exact startup, active, recovery, and end boundaries', () => {
  assert.equal(getMoveDurationMs(move), 330);
  assert.equal(getAttackPhaseAtElapsed(move, 0), 'startup');
  assert.equal(getAttackPhaseAtElapsed(move, 89.99), 'startup');
  assert.equal(getAttackPhaseAtElapsed(move, 90), 'active');
  assert.equal(getAttackPhaseAtElapsed(move, 169.99), 'active');
  assert.equal(getAttackPhaseAtElapsed(move, 170), 'recovery');
  assert.equal(getAttackPhaseAtElapsed(move, 329.99), 'recovery');
  assert.equal(getAttackPhaseAtElapsed(move, 330), 'none');
});

test('timeline snapshot reports phase-local time and remaining time', () => {
  const snapshot = getMoveTimelineSnapshot(move, 120);
  assert.equal(snapshot.phase, 'active');
  assert.equal(snapshot.phaseElapsedMs, 30);
  assert.equal(snapshot.phaseRemainingMs, 50);
  assert.equal(snapshot.totalDurationMs, 330);
});
