import Phaser from 'phaser';
import type { PlayerInputState } from './InputController';
import { resolveMobileControlTarget } from './MobileControlHitTest';
import {
  ACTION_BUTTON_RADII,
  ACTION_BUTTON_VISUAL_DIAMETERS,
  JOYSTICK_KNOB_VISUAL_DIAMETER,
  JOYSTICK_VISUAL_DIAMETER,
  getFloatingJoystickCenter,
  getMobileControlLayout,
  type MobileControlLayout,
} from './MobileControlLayout';
import { convertCssSafeAreaToGame, readBrowserSafeAreaInsets } from './SafeArea';

type ActionButtonName = 'attack' | 'special' | 'ultimate' | 'jump' | 'defend';

type ControlElements = {
  base: Phaser.GameObjects.Arc;
  baseArt: Phaser.GameObjects.Image;
  knobArt: Phaser.GameObjects.Image;
  attackButton: Phaser.GameObjects.Arc;
  attackArt: Phaser.GameObjects.Image;
  specialButton: Phaser.GameObjects.Arc;
  specialArt: Phaser.GameObjects.Image;
  ultimateButton: Phaser.GameObjects.Arc;
  ultimateArt: Phaser.GameObjects.Image;
  ultimateLabel: Phaser.GameObjects.Text;
  ultimateCost: Phaser.GameObjects.Text;
  jumpButton: Phaser.GameObjects.Arc;
  jumpArt: Phaser.GameObjects.Image;
  defendButton: Phaser.GameObjects.Arc;
  defendArt: Phaser.GameObjects.Image;
  menuButton: Phaser.GameObjects.Rectangle;
  menuArt: Phaser.GameObjects.Image;
  menuLabel: Phaser.GameObjects.Text;
};

type TouchState = Omit<PlayerInputState, 'debugTogglePressed' | 'restartPressed'>;

const JOYSTICK_DEADZONE = 10;
const JOYSTICK_MAX_TRAVEL = (JOYSTICK_VISUAL_DIAMETER - JOYSTICK_KNOB_VISUAL_DIAMETER) * 0.5;
const JOYSTICK_IDLE_BASE_ALPHA = 0.52;
const JOYSTICK_IDLE_KNOB_ALPHA = 0.72;

export class MobileControls {
  private readonly scene: Phaser.Scene;
  private readonly controls: ControlElements;
  private readonly touchState: TouchState = {
    moveX: 0,
    moveY: 0,
    attackPressed: false,
    specialPressed: false,
    ultimatePressed: false,
    jumpPressed: false,
    defendPressed: false,
    menuPressed: false,
  };
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2();
  private readonly joystickHome = new Phaser.Math.Vector2();
  private readonly activePressPointers = new Map<number, ActionButtonName | 'menu'>();
  private layout!: MobileControlLayout;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.controls = this.createControls();
    this.updateLayout(scene.scale.width, scene.scale.height);

    scene.input.addPointer(2);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);
    scene.input.on(Phaser.Input.Events.GAME_OUT, this.resetAllInput, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.handlePointerUp, this);
    this.scene.input.off(Phaser.Input.Events.GAME_OUT, this.resetAllInput, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  getState(): TouchState {
    const currentState = { ...this.touchState };
    this.touchState.attackPressed = false;
    this.touchState.specialPressed = false;
    this.touchState.ultimatePressed = false;
    this.touchState.jumpPressed = false;
    this.touchState.defendPressed = false;
    this.touchState.menuPressed = false;
    return currentState;
  }

  setUltimateAvailability(available: boolean, manaCost: number | null): void {
    this.controls.ultimateCost.setText(manaCost === null ? '—' : `${manaCost}`);
    this.controls.ultimateArt.setAlpha(available ? 0.96 : 0.48);
    this.controls.ultimateCost.setAlpha(available ? 1 : 0.58);
  }

  private createControls(): ControlElements {
    const hitCircle = (radius: number) => this.scene.add.circle(0, 0, radius, 0xffffff, 0.001)
      .setScrollFactor(0).setDepth(995);
    const art = (texture: string) => this.scene.add.image(0, 0, texture).setScrollFactor(0).setDepth(1000);

    const base = hitCircle(JOYSTICK_VISUAL_DIAMETER * 0.5);
    const baseArt = art('ui-joystick-base').setAlpha(JOYSTICK_IDLE_BASE_ALPHA);
    const knobArt = art('ui-joystick-knob').setDepth(1002).setAlpha(JOYSTICK_IDLE_KNOB_ALPHA);
    const attackButton = hitCircle(ACTION_BUTTON_RADII.attack);
    const attackArt = art('ui-button-attack');
    const specialButton = hitCircle(ACTION_BUTTON_RADII.special);
    const specialArt = art('ui-button-special');
    const ultimateButton = hitCircle(ACTION_BUTTON_RADII.ultimate);
    const ultimateArt = art('ui-button-ultimate');
    const jumpButton = hitCircle(ACTION_BUTTON_RADII.jump);
    const jumpArt = art('ui-button-jump');
    const defendButton = hitCircle(ACTION_BUTTON_RADII.defend);
    const defendArt = art('ui-button-defend');
    const menuButton = this.scene.add.rectangle(0, 0, 70, 24, 0xffffff, 0.001)
      .setScrollFactor(0).setDepth(995);
    const menuArt = art('ui-button-compact').setDisplaySize(82, 34).setAlpha(0.94);
    const ultimateCost = this.scene.add.text(0, 0, '—', {
      color: '#fff7ff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      stroke: '#34114a',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1004).setScrollFactor(0);
    const ultimateLabel = this.scene.add.text(0, 0, 'ULT', {
      color: '#fff7ff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '8px',
      fontStyle: 'bold',
      letterSpacing: 1,
      stroke: '#34114a',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1004).setScrollFactor(0);
    const menuLabel = this.scene.add.text(0, 0, 'MENU', {
      color: '#f7fbff',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      letterSpacing: 1,
      stroke: '#07131d',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1004).setScrollFactor(0);

    return {
      base,
      baseArt,
      knobArt,
      attackButton,
      attackArt,
      specialButton,
      specialArt,
      ultimateButton,
      ultimateArt,
      ultimateLabel,
      ultimateCost,
      jumpButton,
      jumpArt,
      defendButton,
      defendArt,
      menuButton,
      menuArt,
      menuLabel,
    };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const target = resolveMobileControlTarget(pointer, {
      menu: this.layout.menu,
      attack: this.layout.attack,
      special: this.layout.special,
      ultimate: this.layout.ultimate,
      jump: this.layout.jump,
      defend: this.layout.defend,
      joystickRegion: this.layout.joystickRegion,
      joystickAvailable: this.joystickPointerId === null,
    });

    if (target === 'menu') {
      this.touchState.menuPressed = true;
      this.activePressPointers.set(pointer.id, target);
      this.setMenuPressed(true);
      return;
    }
    if (target === 'joystick') {
      this.joystickPointerId = pointer.id;
      const center = getFloatingJoystickCenter(pointer, this.layout);
      this.setJoystickVisualCenter(center.x, center.y, true);
      this.updateJoystick(pointer);
      return;
    }
    if (target === 'none') return;

    this.touchState[`${target}Pressed`] = true;
    this.activePressPointers.set(pointer.id, target);
    this.setButtonPressed(target, true);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointerId) this.updateJoystick(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointerId) this.resetJoystick();
    const pressedTarget = this.activePressPointers.get(pointer.id);
    if (!pressedTarget) return;
    this.activePressPointers.delete(pointer.id);

    if (pressedTarget === 'menu') {
      const menuStillPressed = [...this.activePressPointers.values()].includes('menu');
      this.setMenuPressed(menuStillPressed);
      return;
    }

    const actionStillPressed = [...this.activePressPointers.values()].includes(pressedTarget);
    this.setButtonPressed(pressedTarget, actionStillPressed);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const delta = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
    const clampedVisual = delta.clone().limit(JOYSTICK_MAX_TRAVEL);

    if (delta.length() < JOYSTICK_DEADZONE) {
      this.touchState.moveX = 0;
      this.touchState.moveY = 0;
    } else {
      const strongInput = delta.normalize();
      this.touchState.moveX = Phaser.Math.Clamp(strongInput.x, -1, 1);
      this.touchState.moveY = Phaser.Math.Clamp(strongInput.y, -1, 1);
    }
    this.controls.knobArt.setPosition(this.joystickCenter.x + clampedVisual.x, this.joystickCenter.y + clampedVisual.y);
  }

  private resetJoystick(): void {
    this.joystickPointerId = null;
    this.touchState.moveX = 0;
    this.touchState.moveY = 0;
    this.setJoystickVisualCenter(this.joystickHome.x, this.joystickHome.y, false);
  }

  private resetAllInput(): void {
    if (this.joystickPointerId !== null) this.resetJoystick();
    this.activePressPointers.clear();
    for (const button of ['attack', 'special', 'ultimate', 'jump', 'defend'] as const) {
      this.setButtonPressed(button, false);
    }
    this.setMenuPressed(false);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.updateLayout(gameSize.width, gameSize.height);
  }

  private updateLayout(width: number, height: number): void {
    const displayWidth = this.scene.scale.displaySize.width || width;
    const displayHeight = this.scene.scale.displaySize.height || height;
    const safeArea = convertCssSafeAreaToGame(
      readBrowserSafeAreaInsets(),
      width,
      height,
      displayWidth,
      displayHeight,
    );
    const cssPixelsPerGameUnit = Math.min(displayWidth / width, displayHeight / height);
    const layout = getMobileControlLayout(width, height, { safeArea, cssPixelsPerGameUnit });
    this.layout = layout;
    this.joystickHome.set(layout.joystick.x, layout.joystick.y);
    this.joystickCenter.set(layout.joystick.x, layout.joystick.y);
    this.controls.base.setPosition(layout.joystick.x, layout.joystick.y).setRadius(layout.joystick.radius);
    this.controls.baseArt.setPosition(layout.joystick.x, layout.joystick.y)
      .setDisplaySize(JOYSTICK_VISUAL_DIAMETER, JOYSTICK_VISUAL_DIAMETER)
      .setAlpha(JOYSTICK_IDLE_BASE_ALPHA);
    this.controls.knobArt.setPosition(layout.joystick.x, layout.joystick.y)
      .setDisplaySize(JOYSTICK_KNOB_VISUAL_DIAMETER, JOYSTICK_KNOB_VISUAL_DIAMETER)
      .setAlpha(JOYSTICK_IDLE_KNOB_ALPHA);

    for (const button of ['attack', 'special', 'ultimate', 'jump', 'defend'] as const) {
      const target = layout[button];
      this.controls[`${button}Button`].setPosition(target.x, target.y).setRadius(target.radius);
      this.controls[`${button}Art`].setPosition(target.x, target.y);
      this.setButtonPressed(button, false);
    }
    this.controls.ultimateCost.setPosition(layout.ultimate.x, layout.ultimate.y + 14);
    this.controls.ultimateLabel.setPosition(layout.ultimate.x, layout.ultimate.y - 14);
    this.controls.menuButton.setPosition(layout.menu.x, layout.menu.y);
    this.controls.menuArt.setPosition(layout.menu.x, layout.menu.y);
    this.controls.menuLabel.setPosition(layout.menu.x, layout.menu.y);
  }

  private setButtonPressed(button: ActionButtonName, pressed: boolean): void {
    const diameter = ACTION_BUTTON_VISUAL_DIAMETERS[button];
    const size = diameter * (pressed ? 0.91 : 1);
    const visual = this.controls[`${button}Art`];
    visual.setDisplaySize(size, size);
    if (button !== 'ultimate' || visual.alpha >= 0.7) visual.setAlpha(pressed ? 0.84 : 0.96);
    if (button === 'ultimate') {
      this.controls.ultimateLabel.setScale(pressed ? 0.91 : 1);
      this.controls.ultimateCost.setScale(pressed ? 0.91 : 1);
    }
  }

  private setMenuPressed(pressed: boolean): void {
    this.controls.menuArt.setDisplaySize(pressed ? 76 : 82, pressed ? 31 : 34);
    this.controls.menuLabel.setScale(pressed ? 0.94 : 1);
  }

  private setJoystickVisualCenter(x: number, y: number, active: boolean): void {
    this.joystickCenter.set(x, y);
    this.controls.base.setPosition(x, y);
    this.controls.baseArt.setPosition(x, y).setAlpha(active ? 0.82 : JOYSTICK_IDLE_BASE_ALPHA);
    this.controls.knobArt.setPosition(x, y).setAlpha(active ? 0.96 : JOYSTICK_IDLE_KNOB_ALPHA);
  }
}
