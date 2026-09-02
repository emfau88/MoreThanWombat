export type CombatClockStep = {
  shouldAdvance: boolean;
  deltaMs: number;
};

const FIXED_FRAME_MS = 1000 / 60;
const TIME_SCALES = [1, 0.5, 0.25] as const;

export class CombatClock {
  private paused = false;
  private timeScaleIndex = 0;
  private pendingFrameSteps = 0;

  consume(realDeltaMs: number): CombatClockStep {
    if (this.paused) {
      if (this.pendingFrameSteps <= 0) {
        return { shouldAdvance: false, deltaMs: 0 };
      }

      this.pendingFrameSteps -= 1;
      return { shouldAdvance: true, deltaMs: FIXED_FRAME_MS };
    }

    return {
      shouldAdvance: true,
      deltaMs: Math.max(0, realDeltaMs) * this.getTimeScale(),
    };
  }

  togglePause(): void {
    this.paused = !this.paused;
    if (!this.paused) {
      this.pendingFrameSteps = 0;
    }
  }

  requestFrameStep(): void {
    this.paused = true;
    this.pendingFrameSteps += 1;
  }

  cycleTimeScale(): void {
    this.timeScaleIndex = (this.timeScaleIndex + 1) % TIME_SCALES.length;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getTimeScale(): number {
    return TIME_SCALES[this.timeScaleIndex];
  }
}
