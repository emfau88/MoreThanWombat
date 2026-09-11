import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';

type LocalBar = {
  fighter: Fighter;
  background: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  remainingMs: number;
};

const BAR_WIDTH = 50;
const BAR_HEIGHT = 6;
const VISIBLE_MS = 1650;
const FADE_MS = 350;

export class EnemyHealthBarOverlay {
  private readonly bars = new Map<number, LocalBar>();

  constructor(private readonly scene: Phaser.Scene) {}

  reveal(fighter: Fighter): void {
    const existing = this.bars.get(fighter.instanceId);
    if (existing) {
      existing.remainingMs = VISIBLE_MS;
      return;
    }

    const background = this.scene.add.rectangle(0, 0, BAR_WIDTH + 4, BAR_HEIGHT + 4, 0x071019, 0.9)
      .setStrokeStyle(1, 0xc4d6df, 0.82)
      .setDepth(1880);
    const fill = this.scene.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, 0x65d46e, 1)
      .setOrigin(0, 0.5)
      .setDepth(1881);
    this.bars.set(fighter.instanceId, { fighter, background, fill, remainingMs: VISIBLE_MS });
  }

  update(deltaMs: number, activeFighters: readonly Fighter[]): void {
    const activeIds = new Set(activeFighters.map((fighter) => fighter.instanceId));
    for (const [instanceId, bar] of this.bars) {
      if (!activeIds.has(instanceId)) {
        this.remove(instanceId);
        continue;
      }

      bar.remainingMs = Math.max(0, bar.remainingMs - Math.max(0, deltaMs));
      if (bar.remainingMs <= 0) {
        this.remove(instanceId);
        continue;
      }

      const ratio = bar.fighter.maxHp > 0 ? Phaser.Math.Clamp(bar.fighter.hp / bar.fighter.maxHp, 0, 1) : 0;
      const alpha = Phaser.Math.Clamp(bar.remainingMs / FADE_MS, 0, 1);
      const x = bar.fighter.x;
      const y = bar.fighter.y - bar.fighter.bodyHeight - 15;
      bar.background.setPosition(x, y).setAlpha(alpha);
      bar.fill.setPosition(x - BAR_WIDTH * 0.5, y)
        .setDisplaySize(Math.max(1, BAR_WIDTH * ratio), BAR_HEIGHT)
        .setFillStyle(ratio <= 0.25 ? 0xf04455 : ratio <= 0.5 ? 0xffa33c : 0x65d46e, 1)
        .setAlpha(alpha);
    }
  }

  clear(): void {
    for (const instanceId of [...this.bars.keys()]) this.remove(instanceId);
  }

  getActiveCount(): number {
    return this.bars.size;
  }

  private remove(instanceId: number): void {
    const bar = this.bars.get(instanceId);
    if (!bar) return;
    bar.background.destroy();
    bar.fill.destroy();
    this.bars.delete(instanceId);
  }
}
