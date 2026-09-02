import Phaser from 'phaser';
import type { CombatFeedbackController } from './CombatFeedbackController';
import type { CombatPresentationController } from './CombatPresentationController';
import {
  resolveHitFeedbackProfile,
  shouldPresentCombatImpact,
  type CombatImpact,
  type HitFeedbackProfile,
  type PresentedImpactSound,
} from './HitFeedback';

const SOUND_KEYS: Record<PresentedImpactSound, string> = {
  light: 'impact-light',
  medium: 'impact-medium',
  heavy: 'impact-heavy',
  ultimate: 'impact-ultimate',
  magic: 'impact-magic',
  block: 'impact-block',
  armor: 'impact-armor',
  invulnerable: 'impact-invulnerable',
};

export class CombatImpactOrchestrator {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly feedback: CombatFeedbackController,
    private readonly presentation: CombatPresentationController,
  ) {}

  apply(impacts: CombatImpact[]): void {
    const presented = impacts
      .filter(shouldPresentCombatImpact)
      .map((impact) => ({ impact, profile: resolveHitFeedbackProfile(impact) }));

    if (presented.length === 0) {
      return;
    }

    for (const { impact, profile } of presented) {
      impact.defender?.showImpactFlash(profile.defenderFlashMs, profile.defenderFlashColor);
      this.presentation.spawnContactImpact(impact, profile);
    }

    const strongest = [...presented].sort((a, b) => (
      b.profile.hitstopMs - a.profile.hitstopMs || b.impact.damage - a.impact.damage
    ))[0];
    this.feedback.applyStrongestImpact(presented.map(({ impact }) => impact));
    this.playImpactSound(strongest.profile);
    this.triggerHaptics(strongest.profile);
  }

  private playImpactSound(profile: HitFeedbackProfile): void {
    const key = SOUND_KEYS[profile.sound];
    if (!this.scene.cache.audio.exists(key) || this.scene.sound.locked) {
      return;
    }
    this.scene.sound.play(key, {
      volume: profile.soundVolume,
      rate: profile.feedbackClass === 'ultimate' ? 0.94 : 1,
    });
  }

  private triggerHaptics(profile: HitFeedbackProfile): void {
    const durationMs = Math.round(profile.hapticMs * this.feedback.getAccessibilityScale());
    if (durationMs <= 0 || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    navigator.vibrate(durationMs);
  }
}
