import Phaser from 'phaser';
import { resolveHitFeedbackProfile, type CombatImpact } from './HitFeedback';

export type { CombatImpact } from './HitFeedback';

export class CombatFeedbackController {
  private hitstopRemainingMs = 0;

  constructor(private readonly camera: Phaser.Cameras.Scene2D.Camera) {}

  advance(deltaMs: number): void {
    this.hitstopRemainingMs = Math.max(0, this.hitstopRemainingMs - Math.max(0, deltaMs));
  }

  applyStrongestImpact(impacts: CombatImpact[]): void {
    const validImpacts = impacts.filter((impact) => impact.damage > 0 || impact.outcome === 'blocked');
    if (validImpacts.length === 0) {
      return;
    }

    const strongest = validImpacts
      .map((impact) => ({ impact, profile: resolveHitFeedbackProfile(impact) }))
      .sort((a, b) => b.profile.hitstopMs - a.profile.hitstopMs || b.impact.damage - a.impact.damage)[0];

    this.hitstopRemainingMs = Math.max(this.hitstopRemainingMs, strongest.profile.hitstopMs);
    if (strongest.profile.shakeDurationMs > 0 && strongest.profile.shakeIntensity > 0) {
      this.camera.shake(strongest.profile.shakeDurationMs, strongest.profile.shakeIntensity);
    }
  }

  isHitstopActive(): boolean {
    return this.hitstopRemainingMs > 0;
  }

  getHitstopRemainingMs(): number {
    return this.hitstopRemainingMs;
  }

  reset(): void {
    this.hitstopRemainingMs = 0;
  }
}
