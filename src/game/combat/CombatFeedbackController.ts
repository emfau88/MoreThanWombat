import Phaser from 'phaser';
import {
  getImpactAccessibilityScale,
  resolveHitFeedbackProfile,
  shouldPresentCombatImpact,
  type CombatImpact,
  type HitFeedbackProfile,
  type ImpactShakeMode,
} from './HitFeedback';

export type { CombatImpact } from './HitFeedback';

export class CombatFeedbackController {
  private hitstopRemainingMs = 0;
  private shakeMode: ImpactShakeMode = 'full';
  private lastImpact: { outcome: string; profile: HitFeedbackProfile } | null = null;

  constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera) {}

  advance(deltaMs: number): void {
    this.hitstopRemainingMs = Math.max(0, this.hitstopRemainingMs - Math.max(0, deltaMs));
  }

  applyStrongestImpact(impacts: CombatImpact[]): void {
    const validImpacts = impacts.filter(shouldPresentCombatImpact);
    if (validImpacts.length === 0) {
      return;
    }

    const strongest = validImpacts
      .map((impact) => ({ impact, profile: resolveHitFeedbackProfile(impact) }))
      .sort((a, b) => b.profile.hitstopMs - a.profile.hitstopMs || b.impact.damage - a.impact.damage)[0];

    this.hitstopRemainingMs = Math.max(this.hitstopRemainingMs, strongest.profile.hitstopMs);
    this.lastImpact = { outcome: strongest.impact.outcome ?? 'hit', profile: strongest.profile };
    const accessibilityScale = getImpactAccessibilityScale(this.shakeMode);
    if (strongest.profile.shakeDurationMs > 0 && strongest.profile.shakeIntensity > 0 && accessibilityScale > 0) {
      this.camera.shake(
        strongest.profile.shakeDurationMs,
        strongest.profile.shakeIntensity * accessibilityScale,
      );
    }
  }

  isHitstopActive(): boolean {
    return this.hitstopRemainingMs > 0;
  }

  getHitstopRemainingMs(): number {
    return this.hitstopRemainingMs;
  }

  cycleShakeMode(): ImpactShakeMode {
    this.shakeMode = this.shakeMode === 'full' ? 'reduced' : this.shakeMode === 'reduced' ? 'off' : 'full';
    return this.shakeMode;
  }

  getShakeMode(): ImpactShakeMode {
    return this.shakeMode;
  }

  getAccessibilityScale(): number {
    return getImpactAccessibilityScale(this.shakeMode);
  }

  getLastImpactDebugInfo(): { outcome: string; feedbackClass: string; sparkStyle: string; sound: string } | null {
    if (!this.lastImpact) {
      return null;
    }
    return {
      outcome: this.lastImpact.outcome,
      feedbackClass: this.lastImpact.profile.feedbackClass,
      sparkStyle: this.lastImpact.profile.sparkStyle,
      sound: this.lastImpact.profile.sound,
    };
  }

  reset(): void {
    this.hitstopRemainingMs = 0;
    this.lastImpact = null;
  }
}
