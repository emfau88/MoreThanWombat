export type AttackPhase = 'startup' | 'active' | 'recovery' | 'none';

export type HitFeedbackClass = 'light' | 'medium' | 'heavy' | 'ultimate';

export type MoveStartCue =
  | 'wombat-earthshaker'
  | 'discount-fireball'
  | 'discount-miscast'
  | 'discount-clearance-orb'
  | 'budget-axe-rain'
  | 'buster-bulldozer';

export type MoveTimelineDefinition = {
  feedbackClass?: HitFeedbackClass;
  startCue?: MoveStartCue;
  hitstopMs?: number;
  shakeDurationMs?: number;
  shakeIntensity?: number;
};

export type TimedMove = {
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
};

export type MoveTimelineSnapshot = {
  phase: AttackPhase;
  elapsedMs: number;
  phaseElapsedMs: number;
  phaseRemainingMs: number;
  totalDurationMs: number;
  normalizedProgress: number;
};

export function getMoveDurationMs(move: TimedMove): number {
  return move.startupMs + move.activeMs + move.recoveryMs;
}

export function getAttackPhaseAtElapsed(move: TimedMove, elapsedMs: number): AttackPhase {
  const safeElapsedMs = Math.max(0, elapsedMs);

  if (safeElapsedMs < move.startupMs) {
    return 'startup';
  }

  if (safeElapsedMs < move.startupMs + move.activeMs) {
    return 'active';
  }

  if (safeElapsedMs < getMoveDurationMs(move)) {
    return 'recovery';
  }

  return 'none';
}

export function getMoveTimelineSnapshot(move: TimedMove, elapsedMs: number): MoveTimelineSnapshot {
  const totalDurationMs = getMoveDurationMs(move);
  const clampedElapsedMs = Math.max(0, Math.min(elapsedMs, totalDurationMs));
  const phase = getAttackPhaseAtElapsed(move, clampedElapsedMs);
  let phaseStartMs = 0;
  let phaseDurationMs = move.startupMs;

  if (phase === 'active') {
    phaseStartMs = move.startupMs;
    phaseDurationMs = move.activeMs;
  } else if (phase === 'recovery') {
    phaseStartMs = move.startupMs + move.activeMs;
    phaseDurationMs = move.recoveryMs;
  } else if (phase === 'none') {
    phaseStartMs = totalDurationMs;
    phaseDurationMs = 0;
  }

  const phaseElapsedMs = Math.max(0, clampedElapsedMs - phaseStartMs);

  return {
    phase,
    elapsedMs: clampedElapsedMs,
    phaseElapsedMs,
    phaseRemainingMs: Math.max(0, phaseDurationMs - phaseElapsedMs),
    totalDurationMs,
    normalizedProgress: totalDurationMs > 0 ? clampedElapsedMs / totalDurationMs : 1,
  };
}
