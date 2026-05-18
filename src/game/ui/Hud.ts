import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';
import { GAME_WIDTH } from '../GameConfig';

type BarElements = {
  label: Phaser.GameObjects.Text;
  background: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  side: 'left' | 'right';
};

const BAR_WIDTH = 220;
const BAR_HEIGHT = 16;

export class Hud {
  private readonly playerBar: BarElements;
  private readonly enemyBar: BarElements;

  constructor(scene: Phaser.Scene) {
    this.playerBar = this.createBar(scene, 28, 54, 'Wombat', 'left');
    this.enemyBar = this.createBar(scene, GAME_WIDTH - 28, 54, 'Enemy', 'right');
  }

  update(player: Fighter, enemy: Fighter | null): void {
    this.updateBar(this.playerBar, player.label, player.hp, player.maxHp);

    if (!enemy) {
      this.enemyBar.label.setText('No Enemy');
      this.enemyBar.background.setVisible(false);
      this.enemyBar.fill.setVisible(false);
      return;
    }

    this.enemyBar.background.setVisible(true);
    this.enemyBar.fill.setVisible(true);
    this.updateBar(this.enemyBar, enemy.label, enemy.hp, enemy.maxHp);
  }

  private createBar(scene: Phaser.Scene, x: number, y: number, label: string, side: 'left' | 'right'): BarElements {
    const isLeft = side === 'left';
    const text = scene.add
      .text(x, y - 20, label, {
        color: '#f5f0d8',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(isLeft ? 0 : 1, 0)
      .setDepth(2000)
      .setScrollFactor(0);
    const background = scene.add
      .rectangle(x, y, BAR_WIDTH, BAR_HEIGHT, 0x141821, 0.84)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setStrokeStyle(2, 0xf5f0d8, 0.34)
      .setDepth(2000)
      .setScrollFactor(0);
    const fill = scene.add
      .rectangle(isLeft ? x + 2 : x - 2, y, BAR_WIDTH - 4, BAR_HEIGHT - 4, 0x63c76a, 0.95)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setDepth(2001)
      .setScrollFactor(0);

    return { label: text, background, fill, side };
  }

  private updateBar(bar: BarElements, label: string, hp: number, maxHp: number): void {
    const hpRatio = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 0;
    bar.label.setText(`${label} HP ${hp}/${maxHp}`);
    bar.fill.displayWidth = (BAR_WIDTH - 4) * hpRatio;

    if (hpRatio <= 0.25) {
      bar.fill.setFillStyle(0xe05263, 0.95);
      return;
    }

    if (hpRatio <= 0.5) {
      bar.fill.setFillStyle(0xf4a261, 0.95);
      return;
    }

    bar.fill.setFillStyle(0x63c76a, 0.95);
  }
}
