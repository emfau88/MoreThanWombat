import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getImpactAccessibilityScale,
  resolveHitFeedbackProfile,
  shouldPresentCombatImpact,
} from '../src/game/combat/HitFeedback';

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

test('feedback classes are perceptually ordered without relying on damage numbers', () => {
  const light = resolveHitFeedbackProfile({ damage: 4, timeline: { feedbackClass: 'light' } });
  const medium = resolveHitFeedbackProfile({ damage: 4, timeline: { feedbackClass: 'medium' } });
  const heavy = resolveHitFeedbackProfile({ damage: 4, timeline: { feedbackClass: 'heavy' } });
  const ultimate = resolveHitFeedbackProfile({ damage: 4, timeline: { feedbackClass: 'ultimate' } });

  assert.ok(light.hitstopMs < medium.hitstopMs);
  assert.ok(medium.hitstopMs < heavy.hitstopMs);
  assert.ok(heavy.hitstopMs < ultimate.hitstopMs);
  assert.ok(light.sparkScale < heavy.sparkScale);
  assert.ok(light.soundVolume < ultimate.soundVolume);
  assert.ok(light.defenderFlashMs >= 40 && ultimate.defenderFlashMs <= 70);
});

test('feedback policy distinguishes block, armor, and invulnerability', () => {
  const blocked = resolveHitFeedbackProfile({ damage: 0, outcome: 'blocked' });
  const armored = resolveHitFeedbackProfile({ damage: 12, outcome: 'armored' });
  const invulnerable = resolveHitFeedbackProfile({ damage: 0, outcome: 'invulnerable' });

  assert.equal(blocked.hitstopMs, 28);
  assert.equal(blocked.sparkStyle, 'block');
  assert.equal(armored.sparkStyle, 'armor');
  assert.equal(armored.sound, 'armor');
  assert.equal(invulnerable.hitstopMs, 0);
  assert.equal(invulnerable.sparkStyle, 'invulnerable');
});

test('magic moves override spark and sound while retaining their strength class', () => {
  const profile = resolveHitFeedbackProfile({
    damage: 9,
    timeline: { feedbackClass: 'heavy', impactSparkStyle: 'magic', impactSound: 'magic' },
  });
  assert.equal(profile.feedbackClass, 'heavy');
  assert.equal(profile.sparkStyle, 'magic');
  assert.equal(profile.sound, 'magic');
});

test('whiffs never enter the presentation path', () => {
  assert.equal(shouldPresentCombatImpact({ damage: 0, outcome: 'miss' }), false);
  assert.equal(shouldPresentCombatImpact({ damage: 0, outcome: 'blocked' }), true);
  assert.equal(shouldPresentCombatImpact({ damage: 0, outcome: 'invulnerable' }), true);
});

test('shake accessibility supports full, reduced, and disabled output', () => {
  assert.equal(getImpactAccessibilityScale('full'), 1);
  assert.equal(getImpactAccessibilityScale('reduced'), 0.35);
  assert.equal(getImpactAccessibilityScale('off'), 0);
});
