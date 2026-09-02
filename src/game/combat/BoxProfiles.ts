export type LocalBox = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export type FighterBoxProfileId =
  | 'standing'
  | 'moving'
  | 'attacking'
  | 'airborne'
  | 'hit'
  | 'knockdown';

export type FighterBoxProfiles = Partial<Record<FighterBoxProfileId, LocalBox | null>>;

export type AttackHitboxWindow = {
  id: 'early' | 'main' | 'late' | string;
  startMs: number;
  endMs: number;
  boxes: LocalBox[];
};

export type AttackHitboxProfile = {
  laneTolerance: number;
  heightTolerance: number;
  windows: AttackHitboxWindow[];
};

export type BoxProfileState =
  | 'idle'
  | 'walk'
  | 'attack'
  | 'special'
  | 'ultimate'
  | 'hitstun'
  | 'jump'
  | 'fall'
  | 'airAttack'
  | 'landing'
  | 'dead';

export function getFighterBoxProfileId(state: BoxProfileState, isGrounded: boolean): FighterBoxProfileId {
  if (state === 'dead') {
    return 'knockdown';
  }

  if (!isGrounded || state === 'jump' || state === 'fall' || state === 'airAttack') {
    return 'airborne';
  }

  if (state === 'hitstun') {
    return 'hit';
  }

  if (state === 'attack' || state === 'special' || state === 'ultimate') {
    return 'attacking';
  }

  if (state === 'walk' || state === 'landing') {
    return 'moving';
  }

  return 'standing';
}

export function resolveFighterBox(
  fallback: LocalBox,
  profiles: FighterBoxProfiles | undefined,
  profileId: FighterBoxProfileId,
): LocalBox | null {
  const authored = profiles?.[profileId];
  return authored === undefined ? fallback : authored;
}

export function getAttackHitboxWindow(
  profile: AttackHitboxProfile,
  activeElapsedMs: number,
): AttackHitboxWindow | null {
  if (!Number.isFinite(activeElapsedMs) || activeElapsedMs < 0) {
    return null;
  }

  return profile.windows.find((window) => (
    activeElapsedMs >= window.startMs && activeElapsedMs < window.endMs
  )) ?? null;
}

export function validateAttackHitboxProfile(profile: AttackHitboxProfile, activeMs: number): string[] {
  const failures: string[] = [];
  let previousEndMs = 0;

  if (profile.laneTolerance < 0 || profile.heightTolerance < 0) {
    failures.push('lane and height tolerances must be non-negative');
  }

  for (const [index, window] of profile.windows.entries()) {
    if (window.startMs !== previousEndMs) {
      failures.push(`window ${window.id} must start at ${previousEndMs}ms`);
    }
    if (window.endMs <= window.startMs) {
      failures.push(`window ${window.id} must have positive duration`);
    }
    if (window.boxes.length === 0) {
      failures.push(`window ${window.id} must contain at least one box`);
    }
    for (const box of window.boxes) {
      if (box.width <= 0 || box.height <= 0) {
        failures.push(`window ${window.id} contains a non-positive box`);
      }
    }
    previousEndMs = window.endMs;

    if (index > 0 && profile.windows[index - 1].endMs > window.startMs) {
      failures.push(`window ${window.id} overlaps the previous window`);
    }
  }

  if (profile.windows.length === 0) {
    failures.push('profile must contain at least one window');
  } else if (previousEndMs !== activeMs) {
    failures.push(`profile must cover the complete ${activeMs}ms active phase`);
  }

  return failures;
}
