import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveHitFeedbackProfile } from '../src/game/combat/HitFeedback';

test('feedback policy preserves an authored move override', () => {
  const profile = resolveHitFeedbackProfile({
    damage: 28,
    timeline: {
      feedbackClass: 'ultimate',
      hitstopMs: 24,
      shakeDurationMs: 130,
      shakeIntensity: 0.008,
    },
  });
  assert.equal(profile.feedbackClass, 'ultimate');
  assert.equal(profile.hitstopMs, 24);
  assert.equal(profile.shakeDurationMs, 130);
});

test('feedback policy distinguishes blocked and invulnerable contacts', () => {
  assert.equal(resolveHitFeedbackProfile({ damage: 0, outcome: 'blocked' }).hitstopMs, 30);
  assert.equal(resolveHitFeedbackProfile({ damage: 0, outcome: 'invulnerable' }).hitstopMs, 0);
});
