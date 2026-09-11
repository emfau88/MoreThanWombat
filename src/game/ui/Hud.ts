import Phaser from 'phaser';
import type { Fighter } from '../combat/Fighter';
import {
  getHudFrameAnchor,
  getHudResourceFillRect,
  getHudWorldX,
  HUD_LAYOUT,
  type HudResourceSlot,
  type HudSide,
} from './HudLayout';

export type HudEnemyPresentation = {
  fighter: Fighter;
  kind: 'duel' | 'midboss' | 'boss';
  label?: string;
  phase?: number;
  phaseCount?: number;
};

type BarElements = {
  portraitBackdrop: Phaser.GameObjects.Arc;
  portrait: Phaser.GameObjects.Image;
  frame: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  hpBackground: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  manaBackground: Phaser.GameObjects.Rectangle;
  manaFill: Phaser.GameObjects.Rectangle;
  manaText: Phaser.GameObjects.Text;
  side: HudSide;
  anchorX: number;
  top: number;
  accent: 'normal' | 'midboss' | 'boss';
};

const TRACK_STROKES = {
  normal: 0x66869a,
  midboss: 0xffaa55,
  boss: 0xff4ea5,
} as const;

export class Hud {
  private readonly playerBar: BarElements;
  private readonly opponentBar: BarElements;
  private readonly priorityBar: BarElements;

  constructor(scene: Phaser.Scene, viewportWidth: number) {
    this.playerBar = this.createBar(scene, 'Wombat', 'left');
    this.opponentBar = this.createBar(scene, 'Enemy', 'right');
    this.priorityBar = this.createBar(scene, 'Priority Target', 'left');
    this.layout(viewportWidth);
    this.setBarVisible(this.opponentBar, false);
    this.setBarVisible(this.priorityBar, false);
  }

  update(player: Fighter, enemy: HudEnemyPresentation | null): void {
    this.updateFighterBar(this.playerBar, player, player.label, true);
    this.setBarVisible(this.opponentBar, false);
    this.setBarVisible(this.priorityBar, false);

    if (!enemy) return;

    const bar = enemy.kind === 'duel' ? this.opponentBar : this.priorityBar;
    this.setBarVisible(bar, true);
    this.setAccent(bar, enemy.kind === 'duel' ? 'normal' : enemy.kind);
    this.updateFighterBar(bar, enemy.fighter, enemy.label ?? enemy.fighter.label, enemy.kind === 'duel');

    if (enemy.kind === 'boss') {
      const phaseCount = Math.max(1, enemy.phaseCount ?? 2);
      const phase = Phaser.Math.Clamp(enemy.phase ?? 1, 1, phaseCount);
      const phaseFill = getHudResourceFillRect(HUD_LAYOUT.mana, phase / phaseCount);
      bar.manaBackground.setVisible(true);
      bar.manaFill.setVisible(true).setFillStyle(0xff4ea5, 0.98).setDisplaySize(phaseFill.width, phaseFill.height);
      bar.manaText.setVisible(true).setText(`PHASE ${phase} / ${phaseCount}`);
    }
  }

  layout(viewportWidth: number): void {
    this.layoutBar(this.playerBar, getHudFrameAnchor(viewportWidth, 'left'), HUD_LAYOUT.frame.top);
    this.layoutBar(this.opponentBar, getHudFrameAnchor(viewportWidth, 'right'), HUD_LAYOUT.frame.top);
    this.layoutBar(this.priorityBar, viewportWidth * 0.5 - HUD_LAYOUT.frame.width * 0.5, HUD_LAYOUT.frame.top);
  }

  private createBar(scene: Phaser.Scene, label: string, side: HudSide): BarElements {
    const isLeft = side === 'left';
    const frame = scene.add.image(0, 0, 'ui-hud-chassis-neutral')
      .setOrigin(isLeft ? 0 : 1, 0)
      .setFlipX(!isLeft)
      .setDepth(1996)
      .setScrollFactor(0)
      .setAlpha(0.97);
    const portraitBackdrop = scene.add.circle(0, 0, HUD_LAYOUT.portrait.radius, 0x071019, 1)
      .setDepth(1997)
      .setScrollFactor(0);
    const portrait = scene.add.image(0, 0, 'hud-portrait-wombat')
      .setDisplaySize(HUD_LAYOUT.portrait.artSize, HUD_LAYOUT.portrait.artSize)
      .setFlipX(!isLeft)
      .setDepth(1998)
      .setScrollFactor(0);
    const text = scene.add.text(0, 0, label, {
      color: '#f4f8ff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: `${HUD_LAYOUT.label.fontSize}px`,
      fontStyle: 'bold',
      stroke: '#071019',
      strokeThickness: 3,
    }).setOrigin(isLeft ? 0 : 1, 0).setDepth(2002).setScrollFactor(0);
    const hpBackground = this.createTrack(scene, side, HUD_LAYOUT.hp);
    const hpFill = this.createFill(scene, side, 0x65d46e);
    const hpText = this.createValueText(scene, '8px');
    const manaBackground = this.createTrack(scene, side, HUD_LAYOUT.mana);
    const manaFill = this.createFill(scene, side, 0x35b9ff);
    const manaText = this.createValueText(scene, '7px');

    return {
      portraitBackdrop, portrait, frame, label: text, hpBackground, hpFill, hpText,
      manaBackground, manaFill, manaText, side, anchorX: 0, top: HUD_LAYOUT.frame.top, accent: 'normal',
    };
  }

  private createTrack(scene: Phaser.Scene, side: HudSide, slot: HudResourceSlot): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(0, 0, slot.width, slot.height, 0x05090e, 0.92)
      .setOrigin(side === 'left' ? 0 : 1, 0.5)
      .setStrokeStyle(1, TRACK_STROKES.normal, 0.95)
      .setDepth(1998)
      .setScrollFactor(0);
  }

  private createFill(scene: Phaser.Scene, side: HudSide, color: number): Phaser.GameObjects.Rectangle {
    return scene.add.rectangle(0, 0, 1, 1, color, 0.98)
      .setOrigin(side === 'left' ? 0 : 1, 0.5)
      .setDepth(1999)
      .setScrollFactor(0);
  }

  private createValueText(scene: Phaser.Scene, fontSize: string): Phaser.GameObjects.Text {
    return scene.add.text(0, 0, '', {
      color: '#ffffff', fontFamily: 'Verdana, Geneva, sans-serif', fontSize, fontStyle: 'bold',
      stroke: '#080b10', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(2002).setScrollFactor(0);
  }

  private layoutBar(bar: BarElements, anchorX: number, top: number): void {
    const portraitX = getHudWorldX(anchorX, HUD_LAYOUT.portrait.x, bar.side);
    const portraitY = top + HUD_LAYOUT.portrait.y;
    bar.anchorX = anchorX;
    bar.top = top;
    bar.frame.setPosition(anchorX, top).setDisplaySize(HUD_LAYOUT.frame.width, HUD_LAYOUT.frame.height);
    bar.portraitBackdrop.setPosition(portraitX, portraitY);
    bar.portrait.setPosition(portraitX, portraitY + 1);
    bar.label.setPosition(getHudWorldX(anchorX, HUD_LAYOUT.label.x, bar.side), top + HUD_LAYOUT.label.y);
    this.layoutResource(bar, 'hp', HUD_LAYOUT.hp);
    this.layoutResource(bar, 'mana', HUD_LAYOUT.mana);
  }

  private layoutResource(bar: BarElements, resource: 'hp' | 'mana', slot: HudResourceSlot): void {
    const track = resource === 'hp' ? bar.hpBackground : bar.manaBackground;
    const fill = resource === 'hp' ? bar.hpFill : bar.manaFill;
    const text = resource === 'hp' ? bar.hpText : bar.manaText;
    const fillRect = getHudResourceFillRect(slot, 1);
    const centerY = bar.top + slot.y + slot.height * 0.5;
    track.setPosition(getHudWorldX(bar.anchorX, slot.x, bar.side), centerY)
      .setSize(slot.width, slot.height).setDisplaySize(slot.width, slot.height);
    fill.setPosition(getHudWorldX(bar.anchorX, fillRect.x, bar.side), centerY)
      .setSize(1, fillRect.height).setDisplaySize(fillRect.width, fillRect.height);
    text.setPosition(getHudWorldX(bar.anchorX, slot.x + slot.width * 0.5, bar.side), centerY);
  }

  private updateFighterBar(bar: BarElements, fighter: Fighter, label: string, showMana: boolean): void {
    const hpRatio = fighter.maxHp > 0 ? Phaser.Math.Clamp(fighter.hp / fighter.maxHp, 0, 1) : 0;
    const manaRatio = fighter.maxMana > 0 ? Phaser.Math.Clamp(fighter.mana / fighter.maxMana, 0, 1) : 0;
    const hpFill = getHudResourceFillRect(HUD_LAYOUT.hp, hpRatio);
    const manaFill = getHudResourceFillRect(HUD_LAYOUT.mana, manaRatio);

    bar.portrait.setTexture(fighter.hudPortraitKey).setVisible(true);
    bar.label.setText(label.toUpperCase());
    bar.hpText.setText(`${Math.ceil(fighter.hp)} / ${fighter.maxHp}`);
    bar.manaText.setText(`${Math.floor(fighter.mana)} / ${fighter.maxMana}`);
    bar.hpFill.setDisplaySize(hpFill.width, hpFill.height);
    bar.manaFill.setFillStyle(0x35b9ff, 0.98).setDisplaySize(manaFill.width, manaFill.height);
    this.setSecondaryResourceVisible(bar, showMana);

    if (hpRatio <= 0.25) bar.hpFill.setFillStyle(0xf04455, 0.98);
    else if (hpRatio <= 0.5) bar.hpFill.setFillStyle(0xffa33c, 0.98);
    else bar.hpFill.setFillStyle(0x65d46e, 0.98);
  }

  private setSecondaryResourceVisible(bar: BarElements, visible: boolean): void {
    bar.manaBackground.setVisible(visible);
    bar.manaFill.setVisible(visible);
    bar.manaText.setVisible(visible);
  }

  private setBarVisible(bar: BarElements, visible: boolean): void {
    for (const element of [bar.portraitBackdrop, bar.portrait, bar.frame, bar.label, bar.hpBackground, bar.hpFill,
      bar.hpText, bar.manaBackground, bar.manaFill, bar.manaText]) element.setVisible(visible);
  }

  private setAccent(bar: BarElements, accent: BarElements['accent']): void {
    if (bar.accent === accent) return;
    bar.accent = accent;
    const stroke = TRACK_STROKES[accent];
    bar.hpBackground.setStrokeStyle(1, stroke, 0.95);
    bar.manaBackground.setStrokeStyle(1, stroke, 0.95);
    bar.label.setColor(accent === 'boss' ? '#ffd6ef' : accent === 'midboss' ? '#ffe0b0' : '#f4f8ff');
  }
}
