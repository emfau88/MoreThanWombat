import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';
import { getHudBarMetrics, HUD_LAYOUT } from './HudLayout';

type BarElements = {
  portraitBackdrop: Phaser.GameObjects.Arc;
  portraitMaskShape: Phaser.GameObjects.Arc;
  portrait: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  hpBackground: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  manaBackground: Phaser.GameObjects.Rectangle;
  manaFill: Phaser.GameObjects.Rectangle;
  manaText: Phaser.GameObjects.Text;
  side: 'left' | 'right';
  y: number;
  frameWidth: number;
  isBossFrame: boolean;
};

const LARGE_FRAME_WIDTH = 270;
const SMALL_FRAME_WIDTH = 218;
const PLAYER_FRAME_HEIGHT_RATIO = 190 / 512;
const BOSS_FRAME_HEIGHT_RATIO = 160 / 512;
const HP_BAR_HEIGHT = 12;
const MANA_BAR_HEIGHT = 8;
const PORTRAIT_ART_SIZE = 66;

export class Hud {
  private readonly playerBar: BarElements;
  private readonly enemyBar: BarElements;
  private viewportWidth: number;

  constructor(scene: Phaser.Scene, viewportWidth: number) {
    this.viewportWidth = viewportWidth;
    this.playerBar = this.createBar(scene, HUD_LAYOUT.player.x, HUD_LAYOUT.player.y, 'Wombat', 'left');
    this.enemyBar = this.createBar(scene, viewportWidth - HUD_LAYOUT.enemy.rightInset, HUD_LAYOUT.enemy.y, 'Enemy', 'right');
    this.layout(viewportWidth);
  }

  update(player: Fighter, enemy: Fighter | null, enemyLabelOverride?: string): void {
    this.updateBar(this.playerBar, player, player.label);

    if (!enemy) {
      this.setBarVisible(this.enemyBar, false);
      return;
    }

    this.setBarVisible(this.enemyBar, true);
    const isBoss = enemyLabelOverride?.startsWith('BOSS') ?? false;
    this.setFrameMode(this.enemyBar, isBoss);
    this.updateBar(this.enemyBar, enemy, enemyLabelOverride ?? enemy.label);
  }

  layout(viewportWidth: number): void {
    this.viewportWidth = viewportWidth;
    const frameWidth = viewportWidth < 720 ? SMALL_FRAME_WIDTH : LARGE_FRAME_WIDTH;
    this.layoutBar(this.playerBar, HUD_LAYOUT.player.x, frameWidth);
    this.layoutBar(this.enemyBar, viewportWidth - HUD_LAYOUT.enemy.rightInset, frameWidth);
  }

  private createBar(scene: Phaser.Scene, x: number, y: number, label: string, side: 'left' | 'right'): BarElements {
    const isLeft = side === 'left';
    const portraitBackdrop = scene.add.circle(x, y, HUD_LAYOUT.portraitRadius, 0x071019, 0.98)
      .setStrokeStyle(4, isLeft ? 0x48d9ff : 0xff4ea5, 0.9)
      .setDepth(1996).setScrollFactor(0);
    const portraitMaskShape = scene.add.circle(x, y, HUD_LAYOUT.portraitRadius - 4, 0xffffff, 0.001)
      .setDepth(1995).setScrollFactor(0);
    const portrait = scene.add.image(x, y + 2, 'wombat', 0)
      .setDisplaySize(PORTRAIT_ART_SIZE, PORTRAIT_ART_SIZE)
      .setFlipX(!isLeft).setDepth(1997).setScrollFactor(0)
      .setMask(portraitMaskShape.createGeometryMask());
    const frame = scene.add.image(x, y, isLeft ? 'ui-player-hud-frame' : 'ui-boss-hud-frame')
      .setOrigin(isLeft ? 0 : 1, 0.5).setDepth(1998).setScrollFactor(0).setAlpha(0.96);
    const text = scene.add.text(x, y + HUD_LAYOUT.labelOffsetY, label, {
      color: '#f4f8ff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: `${HUD_LAYOUT.labelFontSize}px`,
      fontStyle: 'bold',
      stroke: '#071019',
      strokeThickness: 3,
    }).setOrigin(isLeft ? 0 : 1, 0).setDepth(2002).setScrollFactor(0);
    const hpBackground = scene.add.rectangle(x, y, 1, HP_BAR_HEIGHT, 0x070b10, 0.82)
      .setOrigin(isLeft ? 0 : 1, 0.5).setDepth(1999).setScrollFactor(0);
    const hpFill = scene.add.rectangle(x, y, 1, HP_BAR_HEIGHT - 4, 0x65d46e, 0.98)
      .setOrigin(isLeft ? 0 : 1, 0.5).setDepth(2000).setScrollFactor(0);
    const hpText = this.createValueText(scene);
    const manaBackground = scene.add.rectangle(x, y + 21, 1, MANA_BAR_HEIGHT, 0x070b10, 0.82)
      .setOrigin(isLeft ? 0 : 1, 0.5).setDepth(1999).setScrollFactor(0);
    const manaFill = scene.add.rectangle(x, y + 21, 1, MANA_BAR_HEIGHT - 3, 0x35b9ff, 0.98)
      .setOrigin(isLeft ? 0 : 1, 0.5).setDepth(2000).setScrollFactor(0);
    const manaText = this.createValueText(scene).setFontSize('8px');

    return {
      portraitBackdrop,
      portraitMaskShape,
      portrait,
      frame,
      label: text,
      hpBackground,
      hpFill,
      hpText,
      manaBackground,
      manaFill,
      manaText,
      side,
      y,
      frameWidth: LARGE_FRAME_WIDTH,
      isBossFrame: !isLeft,
    };
  }

  private createValueText(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '', {
      color: '#ffffff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      stroke: '#080b10',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2002).setScrollFactor(0);
  }

  private layoutBar(bar: BarElements, x: number, frameWidth: number): void {
    const isLeft = bar.side === 'left';
    const direction = isLeft ? 1 : -1;
    const { inset, width: barWidth } = getHudBarMetrics(frameWidth);
    const insetX = x + direction * inset;
    const centerX = insetX + direction * barWidth * 0.5;
    const frameHeight = frameWidth * (bar.isBossFrame ? BOSS_FRAME_HEIGHT_RATIO : PLAYER_FRAME_HEIGHT_RATIO);

    bar.frameWidth = frameWidth;
    bar.portraitBackdrop.setPosition(x, bar.y);
    bar.portraitMaskShape.setPosition(x, bar.y);
    bar.portrait.setPosition(x, bar.y + 2);
    bar.frame.setPosition(x, bar.y).setDisplaySize(frameWidth, frameHeight);
    bar.label.setPosition(insetX + direction * 4, bar.y + HUD_LAYOUT.labelOffsetY);
    bar.label.setFontSize(frameWidth === SMALL_FRAME_WIDTH ? '9px' : `${HUD_LAYOUT.labelFontSize}px`);
    bar.hpBackground.setPosition(insetX, bar.y).setSize(barWidth, HP_BAR_HEIGHT).setDisplaySize(barWidth, HP_BAR_HEIGHT);
    bar.hpFill.setPosition(insetX, bar.y);
    bar.hpText.setPosition(centerX, bar.y);
    bar.manaBackground.setPosition(insetX, bar.y + 21).setSize(barWidth, MANA_BAR_HEIGHT).setDisplaySize(barWidth, MANA_BAR_HEIGHT);
    bar.manaFill.setPosition(insetX, bar.y + 21);
    bar.manaText.setPosition(centerX, bar.y + 21);
  }

  private updateBar(bar: BarElements, fighter: Fighter, label: string): void {
    const { hp, maxHp, mana, maxMana } = fighter;
    const hpRatio = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 0;
    const manaRatio = maxMana > 0 ? Phaser.Math.Clamp(mana / maxMana, 0, 1) : 0;
    const { width: barWidth } = getHudBarMetrics(bar.frameWidth);

    if (fighter.sprite) {
      bar.portrait.setTexture(fighter.sprite.texture.key, 0).setVisible(true);
    } else {
      bar.portrait.setVisible(false);
    }
    bar.label.setText(label);
    bar.hpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
    bar.manaText.setText(`${Math.floor(mana)} / ${maxMana}`);
    bar.hpFill.displayWidth = barWidth * hpRatio;
    bar.manaFill.displayWidth = barWidth * manaRatio;

    if (hpRatio <= 0.25) bar.hpFill.setFillStyle(0xf04455, 0.98);
    else if (hpRatio <= 0.5) bar.hpFill.setFillStyle(0xffa33c, 0.98);
    else bar.hpFill.setFillStyle(0x65d46e, 0.98);
  }

  private setBarVisible(bar: BarElements, visible: boolean): void {
    for (const element of [bar.portraitBackdrop, bar.portrait, bar.frame, bar.label, bar.hpBackground, bar.hpFill, bar.hpText,
      bar.manaBackground, bar.manaFill, bar.manaText]) {
      element.setVisible(visible);
    }
  }

  private setFrameMode(bar: BarElements, isBoss: boolean): void {
    if (bar.isBossFrame === isBoss) return;

    bar.isBossFrame = isBoss;
    bar.frame.setTexture(isBoss ? 'ui-boss-hud-frame' : 'ui-player-hud-frame').setFlipX(!isBoss);
    bar.portraitBackdrop.setStrokeStyle(4, isBoss ? 0xff4ea5 : 0x48d9ff, 0.9);
    this.layoutBar(bar, this.viewportWidth - HUD_LAYOUT.enemy.rightInset, bar.frameWidth);
  }
}
