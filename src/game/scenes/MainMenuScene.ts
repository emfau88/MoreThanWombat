import Phaser from 'phaser';
import { GAME_HEIGHT } from '../GameConfig';
import type { BattleMode } from '../core/BattleModes';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const viewportWidth = this.scale.width;
    this.add.image(viewportWidth / 2, GAME_HEIGHT / 2, 'main-menu-background').setDisplaySize(viewportWidth, GAME_HEIGHT).setDepth(0);

    this.createModeButton(viewportWidth / 2, 258, 338, 84, 'Duel', 'Current 1v1 setup', 'duel');
    this.createModeButton(viewportWidth / 2, 358, 338, 84, 'Waves', 'Three short enemy waves', 'waves');
    this.createModeButton(viewportWidth / 2, 458, 338, 84, 'Combat Gym', 'Frame step, boxes, presets, and dummy lab', 'test');

    this.add.text(viewportWidth / 2, 516, 'Touch or click a mode to start', {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '13px',
      stroke: '#111820',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.restartForViewport, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.restartForViewport, this);
    });
  }

  private restartForViewport(): void {
    this.scene.restart();
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
    const panel = this.add.image(x, y, 'main-menu-button-panel').setDisplaySize(width, height).setDepth(4);
    const baseScaleX = panel.scaleX;
    const baseScaleY = panel.scaleY;
    const titleText = this.add.text(x, y - 14, title, {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '25px',
      fontStyle: 'bold',
      stroke: '#071018',
      strokeThickness: 4,
    }).setOrigin(0.5);
    const subtitleText = this.add.text(x, y + 13, subtitle, {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '13px',
      stroke: '#071018',
      strokeThickness: 3,
    }).setOrigin(0.5);

    panel.setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        panel.setTint(0xfff1bf);
        panel.setScale(baseScaleX * 1.035, baseScaleY * 1.035);
        titleText.setScale(1.035);
        subtitleText.setScale(1.035);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.clearTint();
        panel.setScale(baseScaleX, baseScaleY);
        titleText.setScale(1);
        subtitleText.setScale(1);
      })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        panel.setScale(baseScaleX * 0.98, baseScaleY * 0.98);
        titleText.setScale(0.98);
        subtitleText.setScale(0.98);
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        panel.setScale(baseScaleX, baseScaleY);
        titleText.setScale(1);
        subtitleText.setScale(1);
        this.scene.start('CharacterSelectScene', { mode });
      });

    titleText.setDepth(5);
    subtitleText.setDepth(5);
  }
}
