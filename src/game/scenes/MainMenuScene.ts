import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig';
import type { BattleMode } from '../core/BattleModes';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'main-menu-background').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05070c, 0.16).setDepth(1);

    this.createModeButton(GAME_WIDTH / 2, 318, 300, 70, 'Duel', 'Current 1v1 setup', 'duel');
    this.createModeButton(GAME_WIDTH / 2, 408, 300, 70, 'Waves', 'Three short enemy waves', 'waves');

    this.add.text(GAME_WIDTH / 2, 482, 'Touch or click a mode to start', {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
      stroke: '#111820',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);
  }

  private createModeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    subtitle: string,
    mode: BattleMode,
  ): void {
    const panel = this.add.rectangle(x, y, width, height, 0x182334, 0.88).setStrokeStyle(3, 0xe9c46a).setDepth(4);
    const titleText = this.add.text(x, y - 12, title, {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '23px',
      stroke: '#111820',
      strokeThickness: 3,
    }).setOrigin(0.5);
    const subtitleText = this.add.text(x, y + 18, subtitle, {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '13px',
      stroke: '#111820',
      strokeThickness: 3,
    }).setOrigin(0.5);

    panel.setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        panel.setFillStyle(0x2d3a4a, 0.96);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.setFillStyle(0x182334, 0.88);
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        this.scene.start('CharacterSelectScene', { mode });
      });

    titleText.setDepth(5);
    subtitleText.setDepth(5);
  }
}
