import type { CombatOutcome } from './CombatResolver';
import type { HitFeedbackClass, MoveTimelineDefinition } from './MoveTimeline';

export type CombatImpact = {
  damage: number;
  attackId?: string;
  outcome?: CombatOutcome;
  timeline?: MoveTimelineDefinition;
};

export type HitFeedbackProfile = {
  feedbackClass: HitFeedbackClass;
  hitstopMs: number;
  shakeDurationMs: number;
  shakeIntensity: number;
};

const DEFAULT_PROFILES: Record<HitFeedbackClass, HitFeedbackProfile> = {
  light: { feedbackClass: 'light', hitstopMs: 50, shakeDurationMs: 60, shakeIntensity: 0.0035 },
  medium: { feedbackClass: 'medium', hitstopMs: 70, shakeDurationMs: 72, shakeIntensity: 0.0045 },
  heavy: { feedbackClass: 'heavy', hitstopMs: 100, shakeDurationMs: 90, shakeIntensity: 0.006 },
  ultimate: { feedbackClass: 'ultimate', hitstopMs: 120, shakeDurationMs: 130, shakeIntensity: 0.008 },
};

export function resolveHitFeedbackProfile(impact: CombatImpact): HitFeedbackProfile {
  const outcome = impact.outcome ?? 'hit';
  const inferredClass: HitFeedbackClass = impact.timeline?.feedbackClass
    ?? (impact.damage >= 18 ? 'heavy' : impact.damage >= 10 ? 'medium' : 'light');
  const baseProfile = DEFAULT_PROFILES[inferredClass];

  if (outcome === 'invulnerable') {
    return { feedbackClass: 'light', hitstopMs: 0, shakeDurationMs: 0, shakeIntensity: 0 };
  }

  if (outcome === 'blocked') {
    return { feedbackClass: 'light', hitstopMs: 30, shakeDurationMs: 0, shakeIntensity: 0 };
  }

  return {
    feedbackClass: inferredClass,
    hitstopMs: impact.timeline?.hitstopMs ?? baseProfile.hitstopMs,
    shakeDurationMs: impact.timeline?.shakeDurationMs ?? baseProfile.shakeDurationMs,
    shakeIntensity: impact.timeline?.shakeIntensity ?? baseProfile.shakeIntensity,
  };
}
