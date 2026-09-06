export type EncounterDirectorPhase =
  | 'section_intro'
  | 'spawning'
  | 'active'
  | 'clear_delay'
  | 'travel'
  | 'transition'
  | 'next_section'
  | 'defeat'
  | 'victory';

export type EncounterPressureChannel = 'melee' | 'ranged' | 'disruption';

export type EncounterPressureBudget = Readonly<{
  meleeTokens: number;
  rangedTokens: number;
  disruptionBudget: number;
  /** Optional alternating crowd-pressure window, measured in active simulation time. */
  burst?: Readonly<{ periodMs: number; durationMs: number }>;
}>;

export type EncounterDirectorEvent =
  | { type: 'spawning'; sectionIndex: number }
  | { type: 'active'; sectionIndex: number }
  | { type: 'clear_delay'; sectionIndex: number }
  | { type: 'travel'; sectionIndex: number }
  | { type: 'next_section'; sectionIndex: number }
  | { type: 'section_intro'; sectionIndex: number }
  | { type: 'victory'; sectionIndex: number };

export type EncounterDirectorOptions = Readonly<{
  sectionCount: number;
  pressureProfiles: readonly EncounterPressureBudget[];
  sectionIntroMs?: number;
  spawnEntryMs?: number;
  clearDelayMs?: number;
  transitionMs?: number;
}>;

export type EncounterDirectorSnapshot = Readonly<{
  sectionIndex: number;
  phase: EncounterDirectorPhase;
  phaseRemainingMs: number;
  budget: EncounterPressureBudget;
  usedTokens: Readonly<Record<EncounterPressureChannel, number>>;
}>;

const DEFAULT_PHASE_DURATIONS = {
  sectionIntroMs: 650,
  spawnEntryMs: 700,
  clearDelayMs: 650,
  transitionMs: 500,
} as const;

const EMPTY_BUDGET: EncounterPressureBudget = {
  meleeTokens: 0,
  rangedTokens: 0,
  disruptionBudget: 0,
};

/**
 * Deterministic lifecycle and attack-pressure authority for Wave encounters.
 * It has no Phaser dependency so phase and token rules can be tested directly.
 */
export class EncounterDirector {
  private readonly sectionCount: number;
  private readonly pressureProfiles: readonly EncounterPressureBudget[];
  private readonly durations: Record<keyof typeof DEFAULT_PHASE_DURATIONS, number>;
  private readonly allocations = new Map<number, EncounterPressureChannel>();
  private sectionIndex = 0;
  private phase: EncounterDirectorPhase = 'section_intro';
  private phaseRemainingMs: number;
  private activeElapsedMs = 0;
  private attackSpacingRemainingMs = 0;

  constructor(options: EncounterDirectorOptions) {
    if (!Number.isInteger(options.sectionCount) || options.sectionCount <= 0) {
      throw new Error('EncounterDirector needs at least one section');
    }

    this.sectionCount = options.sectionCount;
    if (options.pressureProfiles.length !== options.sectionCount) {
      throw new Error('Every section needs a pressure profile');
    }
    this.pressureProfiles = options.pressureProfiles.map(normalizeBudget);
    this.durations = {
      sectionIntroMs: normalizeDuration(options.sectionIntroMs, DEFAULT_PHASE_DURATIONS.sectionIntroMs),
      spawnEntryMs: normalizeDuration(options.spawnEntryMs, DEFAULT_PHASE_DURATIONS.spawnEntryMs),
      clearDelayMs: normalizeDuration(options.clearDelayMs, DEFAULT_PHASE_DURATIONS.clearDelayMs),
      transitionMs: normalizeDuration(options.transitionMs, DEFAULT_PHASE_DURATIONS.transitionMs),
    };
    this.phaseRemainingMs = this.durations.sectionIntroMs;
  }

  advance(deltaMs: number, allSpawnedEnemiesDefeated: boolean): EncounterDirectorEvent[] {
    const events: EncounterDirectorEvent[] = [];
    const remainingDeltaMs = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    if (this.phase === 'active') {
      this.activeElapsedMs += remainingDeltaMs;
      this.attackSpacingRemainingMs = Math.max(0, this.attackSpacingRemainingMs - remainingDeltaMs);
    }

    if (this.phase === 'active' && allSpawnedEnemiesDefeated) {
      this.enterClearDelay(events);
      return events;
    }

    // A rendered entry cannot be skipped by one delayed browser frame.
    if (this.isTimedPhase()) {
      this.phaseRemainingMs = Math.max(0, this.phaseRemainingMs - remainingDeltaMs);
      if (this.phaseRemainingMs === 0) this.advanceTimedPhase(events);
    }

    return events;
  }

  beginTransition(): boolean {
    if (this.phase !== 'travel') {
      return false;
    }

    this.releaseAllTokens();
    this.phase = 'transition';
    this.phaseRemainingMs = this.durations.transitionMs;
    return true;
  }

  requestAttack(enemyInstanceId: number, channel: EncounterPressureChannel): boolean {
    if (this.phase !== 'active' || this.attackSpacingRemainingMs > 0 || this.allocations.has(enemyInstanceId)) {
      return false;
    }

    const budget = this.getBudget();
    const used = this.getTokenUsage();
    if (budget.burst && this.activeElapsedMs % budget.burst.periodMs >= budget.burst.durationMs
      && this.allocations.size >= 1) return false;
    const limit = channel === 'melee'
      ? budget.meleeTokens
      : channel === 'ranged'
        ? budget.rangedTokens
        : budget.disruptionBudget;

    if (used[channel] >= limit) {
      return false;
    }

    this.allocations.set(enemyInstanceId, channel);
    this.attackSpacingRemainingMs = 300;
    return true;
  }

  releaseAttack(enemyInstanceId: number): void {
    this.allocations.delete(enemyInstanceId);
  }

  reconcileAttackTokens(activeEnemyInstanceIds: ReadonlySet<number>): void {
    for (const enemyInstanceId of this.allocations.keys()) {
      if (!activeEnemyInstanceIds.has(enemyInstanceId)) {
        this.allocations.delete(enemyInstanceId);
      }
    }
  }

  releaseAllTokens(): void {
    this.allocations.clear();
  }

  finishDefeat(): void {
    this.releaseAllTokens();
    this.phase = 'defeat';
    this.phaseRemainingMs = 0;
  }

  getPhase(): EncounterDirectorPhase {
    return this.phase;
  }

  getSectionIndex(): number {
    return this.sectionIndex;
  }

  getBudget(): EncounterPressureBudget {
    return this.pressureProfiles[this.sectionIndex] ?? EMPTY_BUDGET;
  }

  getTokenUsage(): Record<EncounterPressureChannel, number> {
    const usage: Record<EncounterPressureChannel, number> = { melee: 0, ranged: 0, disruption: 0 };
    for (const channel of this.allocations.values()) {
      usage[channel] += 1;
    }
    return usage;
  }

  canRegenerateMana(): boolean {
    return this.phase === 'active';
  }

  getSnapshot(): EncounterDirectorSnapshot {
    return {
      sectionIndex: this.sectionIndex,
      phase: this.phase,
      phaseRemainingMs: this.phaseRemainingMs,
      budget: this.getBudget(),
      usedTokens: this.getTokenUsage(),
    };
  }

  getDebugLabel(): string {
    const budget = this.getBudget();
    const used = this.getTokenUsage();
    return [
      `enc ${this.sectionIndex + 1}/${this.sectionCount} ${this.phase}`,
      `M ${used.melee}/${budget.meleeTokens}`,
      `R ${used.ranged}/${budget.rangedTokens}`,
      `D ${used.disruption}/${budget.disruptionBudget}`,
    ].join(' | ');
  }

  private isTimedPhase(): boolean {
    return this.phase === 'section_intro'
      || this.phase === 'spawning'
      || this.phase === 'clear_delay'
      || this.phase === 'transition';
  }

  private advanceTimedPhase(events: EncounterDirectorEvent[]): void {
    if (this.phase === 'section_intro') {
      this.phase = 'spawning';
      this.phaseRemainingMs = this.durations.spawnEntryMs;
      events.push({ type: 'spawning', sectionIndex: this.sectionIndex });
      return;
    }

    if (this.phase === 'spawning') {
      this.activeElapsedMs = 0;
      this.attackSpacingRemainingMs = 0;
      this.phase = 'active';
      this.phaseRemainingMs = 0;
      events.push({ type: 'active', sectionIndex: this.sectionIndex });
      return;
    }

    if (this.phase === 'clear_delay') {
      this.releaseAllTokens();
      this.phaseRemainingMs = 0;
      if (this.sectionIndex >= this.sectionCount - 1) {
        this.phase = 'victory';
        events.push({ type: 'victory', sectionIndex: this.sectionIndex });
      } else {
        this.phase = 'travel';
        events.push({ type: 'travel', sectionIndex: this.sectionIndex });
      }
      return;
    }

    if (this.phase === 'transition') {
      this.sectionIndex += 1;
      this.phase = 'next_section';
      this.phaseRemainingMs = 0;
      events.push({ type: 'next_section', sectionIndex: this.sectionIndex });
      this.phase = 'section_intro';
      this.phaseRemainingMs = this.durations.sectionIntroMs;
      events.push({ type: 'section_intro', sectionIndex: this.sectionIndex });
    }
  }

  private enterClearDelay(events: EncounterDirectorEvent[]): void {
    this.releaseAllTokens();
    this.phase = 'clear_delay';
    this.phaseRemainingMs = this.durations.clearDelayMs;
    events.push({ type: 'clear_delay', sectionIndex: this.sectionIndex });
  }
}

function normalizeDuration(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined ? Math.max(0, value) : fallback;
}

function normalizeBudget(budget: EncounterPressureBudget): EncounterPressureBudget {
  const violations = getPressureBudgetViolations(budget);
  if (violations.length > 0) throw new Error(violations.join('; '));
  return {
    meleeTokens: budget.meleeTokens,
    rangedTokens: budget.rangedTokens,
    disruptionBudget: budget.disruptionBudget,
    ...(budget.burst ? { burst: { ...budget.burst } } : {}),
  };
}

export function getPressureBudgetViolations(budget: EncounterPressureBudget): string[] {
  const violations: string[] = [];
  if ([budget.meleeTokens, budget.rangedTokens, budget.disruptionBudget]
    .some((value) => !Number.isInteger(value) || value < 0)) {
    violations.push('pressure budgets must be non-negative integers');
  }
  if (budget.burst && (!Number.isFinite(budget.burst.periodMs) || budget.burst.periodMs <= 0
    || !Number.isFinite(budget.burst.durationMs) || budget.burst.durationMs <= 0
    || budget.burst.durationMs > budget.burst.periodMs)) {
    violations.push('burst duration must be positive, finite and no longer than its positive finite period');
  }
  return violations;
}
