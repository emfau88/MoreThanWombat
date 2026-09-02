import assert from 'node:assert/strict';
import test from 'node:test';
import { CombatClock } from '../src/game/debug/CombatClock';

test('combat clock pauses, advances one fixed frame, and resumes', () => {
  const clock = new CombatClock();
  clock.togglePause();
  assert.deepEqual(clock.consume(16), { shouldAdvance: false, deltaMs: 0 });
  clock.requestFrameStep();
  const step = clock.consume(16);
  assert.equal(step.shouldAdvance, true);
  assert.ok(Math.abs(step.deltaMs - 1000 / 60) < 0.001);
  assert.deepEqual(clock.consume(16), { shouldAdvance: false, deltaMs: 0 });
  clock.togglePause();
  assert.deepEqual(clock.consume(16), { shouldAdvance: true, deltaMs: 16 });
});

test('combat clock cycles deterministic slow-motion scales', () => {
  const clock = new CombatClock();
  clock.cycleTimeScale();
  assert.equal(clock.consume(20).deltaMs, 10);
  clock.cycleTimeScale();
  assert.equal(clock.consume(20).deltaMs, 5);
  clock.cycleTimeScale();
  assert.equal(clock.consume(20).deltaMs, 20);
});
