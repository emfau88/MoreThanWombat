import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';
import { GAME_WIDTH } from '../GameConfig';

type BarElements = {
  label: Phaser.GameObjects.Text;
  hpBackground: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  manaBackground: Phaser.GameObjects.Rectangle;
  manaFill: Phaser.GameObjects.Rectangle;
  side: 'left' | 'right';
};

const BAR_WIDTH = 220;
const HP_BAR_HEIGHT = 14;
const MANA_BAR_HEIGHT = 9;

export class Hud {
  private readonly playerBar: BarElements;
  private readonly enemyBar: BarElements;

  constructor(scene: Phaser.Scene) {
    this.playerBar = this.createBar(scene, 28, 54, 'Wombat', 'left');
    this.enemyBar = this.createBar(scene, GAME_WIDTH - 28, 54, 'Enemy', 'right');
  }

  update(player: Fighter, enemy: Fighter | null): void {
    this.updateBar(this.playerBar, player.label, player.hp, player.maxHp, player.mana, player.maxMana);

    if (!enemy) {
      this.enemyBar.label.setText('No Enemy');
      this.setBarVisible(this.enemyBar, false);
      return;
    }

    this.setBarVisible(this.enemyBar, true);
    this.updateBar(this.enemyBar, enemy.label, enemy.hp, enemy.maxHp, enemy.mana, enemy.maxMana);
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
    const hpBackground = scene.add
      .rectangle(x, y, BAR_WIDTH, HP_BAR_HEIGHT, 0x141821, 0.84)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setStrokeStyle(2, 0xf5f0d8, 0.34)
      .setDepth(2000)
      .setScrollFactor(0);
    const hpFill = scene.add
      .rectangle(isLeft ? x + 2 : x - 2, y, BAR_WIDTH - 4, HP_BAR_HEIGHT - 4, 0x63c76a, 0.95)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setDepth(2001)
      .setScrollFactor(0);
    const manaBackground = scene.add
      .rectangle(x, y + 15, BAR_WIDTH, MANA_BAR_HEIGHT, 0x101827, 0.78)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setStrokeStyle(1, 0xbfe6ff, 0.26)
      .setDepth(2000)
      .setScrollFactor(0);
    const manaFill = scene.add
      .rectangle(isLeft ? x + 2 : x - 2, y + 15, BAR_WIDTH - 4, MANA_BAR_HEIGHT - 3, 0x3aa7ff, 0.92)
      .setOrigin(isLeft ? 0 : 1, 0.5)
      .setDepth(2001)
      .setScrollFactor(0);

    return { label: text, hpBackground, hpFill, manaBackground, manaFill, side };
  }

  private updateBar(bar: BarElements, label: string, hp: number, maxHp: number, mana: number, maxMana: number): void {
    const hpRatio = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 0;
    const manaRatio = maxMana > 0 ? Phaser.Math.Clamp(mana / maxMana, 0, 1) : 0;
    bar.label.setText(`${label} HP ${hp}/${maxHp} MP ${Math.floor(mana)}/${maxMana}`);
    bar.hpFill.displayWidth = (BAR_WIDTH - 4) * hpRatio;
    bar.manaFill.displayWidth = (BAR_WIDTH - 4) * manaRatio;

    if (hpRatio <= 0.25) {
      bar.hpFill.setFillStyle(0xe05263, 0.95);
      return;
    }

    if (hpRatio <= 0.5) {
      bar.hpFill.setFillStyle(0xf4a261, 0.95);
      return;
    }

    bar.hpFill.setFillStyle(0x63c76a, 0.95);
  }

  private setBarVisible(bar: BarElements, visible: boolean): void {
    bar.hpBackground.setVisible(visible);
    bar.hpFill.setVisible(visible);
    bar.manaBackground.setVisible(visible);
    bar.manaFill.setVisible(visible);
  }
}
