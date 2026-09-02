import type { CombatOutcome } from './CombatResolver';
import type { Fighter } from './Fighter';
import type {
  HitFeedbackClass,
  ImpactSoundId,
  MoveTimelineDefinition,
} from './MoveTimeline';

export type PresentedImpactStyle = 'physical' | 'magic' | 'block' | 'armor' | 'invulnerable';
export type PresentedImpactSound = ImpactSoundId | 'block' | 'armor' | 'invulnerable';
export type ImpactShakeMode = 'full' | 'reduced' | 'off';

export type CombatImpact = {
  damage: number;
  attackId?: string;
  outcome?: CombatOutcome;
  timeline?: MoveTimelineDefinition;
  contactX?: number;
  contactY?: number;
  attacker?: Fighter;
  defender?: Fighter;
};

export type HitFeedbackProfile = {
  feedbackClass: HitFeedbackClass;
  hitstopMs: number;
  shakeDurationMs: number;
  shakeIntensity: number;
  defenderFlashMs: number;
  defenderFlashColor: number;
  sparkStyle: PresentedImpactStyle;
  sparkScale: number;
  sound: PresentedImpactSound;
  soundVolume: number;
  hapticMs: number;
};

const DEFAULT_PROFILES: Record<HitFeedbackClass, HitFeedbackProfile> = {
  light: {
    feedbackClass: 'light', hitstopMs: 45, shakeDurationMs: 48, shakeIntensity: 0.0028,
    defenderFlashMs: 42, defenderFlashColor: 0xfff4c2, sparkStyle: 'physical', sparkScale: 0.72,
    sound: 'light', soundVolume: 0.36, hapticMs: 8,
  },
  medium: {
    feedbackClass: 'medium', hitstopMs: 65, shakeDurationMs: 68, shakeIntensity: 0.004,
    defenderFlashMs: 50, defenderFlashColor: 0xffedaa, sparkStyle: 'physical', sparkScale: 0.94,
    sound: 'medium', soundVolume: 0.44, hapticMs: 12,
  },
  heavy: {
    feedbackClass: 'heavy', hitstopMs: 90, shakeDurationMs: 88, shakeIntensity: 0.0058,
    defenderFlashMs: 58, defenderFlashColor: 0xffe38c, sparkStyle: 'physical', sparkScale: 1.18,
    sound: 'heavy', soundVolume: 0.54, hapticMs: 18,
  },
  ultimate: {
    feedbackClass: 'ultimate', hitstopMs: 110, shakeDurationMs: 120, shakeIntensity: 0.0075,
    defenderFlashMs: 64, defenderFlashColor: 0xffffff, sparkStyle: 'physical', sparkScale: 1.48,
    sound: 'ultimate', soundVolume: 0.62, hapticMs: 26,
  },
};

const OUTCOME_PROFILES: Partial<Record<CombatOutcome, HitFeedbackProfile>> = {
  blocked: {
    feedbackClass: 'light', hitstopMs: 28, shakeDurationMs: 0, shakeIntensity: 0,
    defenderFlashMs: 36, defenderFlashColor: 0x8be9fd, sparkStyle: 'block', sparkScale: 0.82,
    sound: 'block', soundVolume: 0.4, hapticMs: 6,
  },
  armored: {
    feedbackClass: 'medium', hitstopMs: 40, shakeDurationMs: 42, shakeIntensity: 0.0025,
    defenderFlashMs: 40, defenderFlashColor: 0xffb65c, sparkStyle: 'armor', sparkScale: 0.9,
    sound: 'armor', soundVolume: 0.46, hapticMs: 9,
  },
  invulnerable: {
    feedbackClass: 'light', hitstopMs: 0, shakeDurationMs: 0, shakeIntensity: 0,
    defenderFlashMs: 34, defenderFlashColor: 0xbdefff, sparkStyle: 'invulnerable', sparkScale: 0.74,
    sound: 'invulnerable', soundVolume: 0.32, hapticMs: 0,
  },
};

export function resolveHitFeedbackProfile(impact: CombatImpact): HitFeedbackProfile {
  const outcome = impact.outcome ?? 'hit';
  const inferredClass: HitFeedbackClass = impact.timeline?.feedbackClass
    ?? (impact.damage >= 18 ? 'heavy' : impact.damage >= 10 ? 'medium' : 'light');
  const baseProfile = DEFAULT_PROFILES[inferredClass];
  const outcomeProfile = OUTCOME_PROFILES[outcome];

  if (outcomeProfile) {
    return outcomeProfile;
  }

  const isMagic = impact.timeline?.impactSparkStyle === 'magic';
  return {
    feedbackClass: inferredClass,
    hitstopMs: impact.timeline?.hitstopMs ?? baseProfile.hitstopMs,
    shakeDurationMs: impact.timeline?.shakeDurationMs ?? baseProfile.shakeDurationMs,
    shakeIntensity: impact.timeline?.shakeIntensity ?? baseProfile.shakeIntensity,
    defenderFlashMs: impact.timeline?.defenderFlashMs ?? baseProfile.defenderFlashMs,
    defenderFlashColor: impact.timeline?.defenderFlashColor ?? baseProfile.defenderFlashColor,
    sparkStyle: isMagic ? 'magic' : baseProfile.sparkStyle,
    sparkScale: baseProfile.sparkScale,
    sound: impact.timeline?.impactSound ?? (isMagic ? 'magic' : baseProfile.sound),
    soundVolume: impact.timeline?.impactSoundVolume ?? baseProfile.soundVolume,
    hapticMs: impact.timeline?.hapticMs ?? baseProfile.hapticMs,
  };
}

export function shouldPresentCombatImpact(impact: CombatImpact): boolean {
  const outcome = impact.outcome ?? 'hit';
  return outcome !== 'miss' && (
    impact.damage > 0
    || outcome === 'blocked'
    || outcome === 'armored'
    || outcome === 'invulnerable'
  );
}

export function getImpactAccessibilityScale(mode: ImpactShakeMode): number {
  if (mode === 'off') {
    return 0;
  }
  return mode === 'reduced' ? 0.35 : 1;
}
