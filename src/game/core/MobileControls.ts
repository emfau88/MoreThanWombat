import Phaser from 'phaser';
import type { PlayerInputState } from './InputController';
import { resolveMobileControlTarget } from './MobileControlHitTest';

type ControlElements = {
  baseShadow: Phaser.GameObjects.Arc;
  base: Phaser.GameObjects.Arc;
  baseRing: Phaser.GameObjects.Arc;
  knob: Phaser.GameObjects.Arc;
  knobHighlight: Phaser.GameObjects.Arc;
  attackShadow: Phaser.GameObjects.Arc;
  attackButton: Phaser.GameObjects.Arc;
  attackRing: Phaser.GameObjects.Arc;
  specialShadow: Phaser.GameObjects.Arc;
  specialButton: Phaser.GameObjects.Arc;
  specialRing: Phaser.GameObjects.Arc;
  ultimateShadow: Phaser.GameObjects.Arc;
  ultimateButton: Phaser.GameObjects.Arc;
  ultimateRing: Phaser.GameObjects.Arc;
  jumpShadow: Phaser.GameObjects.Arc;
  jumpButton: Phaser.GameObjects.Arc;
  jumpRing: Phaser.GameObjects.Arc;
  menuShadow: Phaser.GameObjects.Rectangle;
  menuButton: Phaser.GameObjects.Rectangle;
  attackLabel: Phaser.GameObjects.Text;
  specialLabel: Phaser.GameObjects.Text;
  ultimateLabel: Phaser.GameObjects.Text;
  jumpLabel: Phaser.GameObjects.Text;
  menuLabel: Phaser.GameObjects.Text;
};

type TouchState = Omit<PlayerInputState, 'debugTogglePressed' | 'restartPressed'>;

const JOYSTICK_RADIUS = 58;
const JOYSTICK_KNOB_RADIUS = 28;
const JOYSTICK_DEADZONE = 0.15;
const JOYSTICK_CAPTURE_RADIUS = 180;

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
    menuPressed: false,
  };
  private joystickPointerId: number | null = null;
  private readonly joystickCenter = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.controls = this.createControls();
    this.updateLayout(scene.scale.width, scene.scale.height);

    scene.input.addPointer(2);
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  getState(): TouchState {
    const currentState = { ...this.touchState };
    this.touchState.attackPressed = false;
    this.touchState.specialPressed = false;
    this.touchState.ultimatePressed = false;
    this.touchState.jumpPressed = false;
    this.touchState.menuPressed = false;
    return currentState;
  }

  private createControls(): ControlElements {
    const baseShadow = this.scene.add.circle(0, 0, JOYSTICK_RADIUS + 6, 0x02060b, 0.28).setScrollFactor(0).setDepth(996);
    const base = this.scene.add
      .circle(0, 0, JOYSTICK_RADIUS, 0x10202d, 0.58)
      .setStrokeStyle(3, 0x89c2d9, 0.28)
      .setScrollFactor(0)
      .setDepth(1000);
    const baseRing = this.scene.add
      .circle(0, 0, JOYSTICK_RADIUS - 13, 0x193445, 0.22)
      .setStrokeStyle(2, 0xd8f3dc, 0.14)
      .setScrollFactor(0)
      .setDepth(1001);
    const knob = this.scene.add
      .circle(0, 0, JOYSTICK_KNOB_RADIUS, 0xf1faee, 0.95)
      .setStrokeStyle(3, 0x89c2d9, 0.35)
      .setScrollFactor(0)
      .setDepth(1002);
    const knobHighlight = this.scene.add.circle(0, 0, JOYSTICK_KNOB_RADIUS * 0.48, 0xffffff, 0.22).setScrollFactor(0).setDepth(1003);

    const attackShadow = this.scene.add.circle(0, 0, 46, 0x1d0803, 0.26).setScrollFactor(0).setDepth(996);
    const attackButton = this.scene.add
      .circle(0, 0, 42, 0xd4572f, 0.94)
      .setStrokeStyle(3, 0xffe8c2, 0.4)
      .setScrollFactor(0)
      .setDepth(1000);
    const attackRing = this.scene.add.circle(0, 0, 31, 0xff9f68, 0.18).setScrollFactor(0).setDepth(1001);

    const specialShadow = this.scene.add.circle(0, 0, 38, 0x061019, 0.26).setScrollFactor(0).setDepth(996);
    const specialButton = this.scene.add
      .circle(0, 0, 34, 0x3d6f96, 0.93)
      .setStrokeStyle(3, 0xd6ecff, 0.34)
      .setScrollFactor(0)
      .setDepth(1000);
    const specialRing = this.scene.add.circle(0, 0, 24, 0x78a8c8, 0.18).setScrollFactor(0).setDepth(1001);

    const ultimateShadow = this.scene.add.circle(0, 0, 36, 0x1f0a19, 0.28).setScrollFactor(0).setDepth(996);
    const ultimateButton = this.scene.add
      .circle(0, 0, 32, 0xa23bd6, 0.94)
      .setStrokeStyle(3, 0xf7dcff, 0.38)
      .setScrollFactor(0)
      .setDepth(1000);
    const ultimateRing = this.scene.add.circle(0, 0, 23, 0xdf8cff, 0.2).setScrollFactor(0).setDepth(1001);

    const jumpShadow = this.scene.add.circle(0, 0, 36, 0x081105, 0.26).setScrollFactor(0).setDepth(996);
    const jumpButton = this.scene.add
      .circle(0, 0, 32, 0x698f36, 0.93)
      .setStrokeStyle(3, 0xe7ffd1, 0.34)
      .setScrollFactor(0)
      .setDepth(1000);
    const jumpRing = this.scene.add.circle(0, 0, 23, 0xa8cf62, 0.18).setScrollFactor(0).setDepth(1001);
    const menuShadow = this.scene.add.rectangle(0, 0, 74, 28, 0x02060b, 0.24).setScrollFactor(0).setDepth(996);
    const menuButton = this.scene.add
      .rectangle(0, 0, 70, 24, 0x172333, 0.78)
      .setStrokeStyle(2, 0xf5f0d8, 0.34)
      .setScrollFactor(0)
      .setDepth(1000);
    const attackLabel = this.scene.add
      .text(0, 0, 'ATK', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1004)
      .setScrollFactor(0);
    const specialLabel = this.scene.add
      .text(0, 0, 'SP', {
        color: '#f3f7fb',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1004)
      .setScrollFactor(0);
    const ultimateLabel = this.scene.add
      .text(0, 0, 'ULT', {
        color: '#fff2ff',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1004)
      .setScrollFactor(0);
    const jumpLabel = this.scene.add
      .text(0, 0, 'JMP', {
        color: '#f3f7fb',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1004)
      .setScrollFactor(0);
    const menuLabel = this.scene.add
      .text(0, 0, 'MENU', {
        color: '#f5f0d8',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(1004)
      .setScrollFactor(0);

    return {
      baseShadow,
      base,
      baseRing,
      knob,
      knobHighlight,
      attackShadow,
      attackButton,
      attackRing,
      specialShadow,
      specialButton,
      specialRing,
      ultimateShadow,
      ultimateButton,
      ultimateRing,
      jumpShadow,
      jumpButton,
      jumpRing,
      menuShadow,
      menuButton,
      attackLabel,
      specialLabel,
      ultimateLabel,
      jumpLabel,
      menuLabel,
    };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const width = this.scene.scale.width;
    const target = resolveMobileControlTarget(pointer, {
      screenWidth: width,
      menu: this.controls.menuButton,
      attack: this.controls.attackButton,
      special: this.controls.specialButton,
      ultimate: this.controls.ultimateButton,
      jump: this.controls.jumpButton,
      joystickAvailable: this.joystickPointerId === null,
    });

    if (target === 'menu') {
      this.touchState.menuPressed = true;
      this.controls.menuButton.setScale(0.96);
      return;
    }

    if (target === 'joystick') {
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
      return;
    }

    if (target === 'attack') {
      this.touchState.attackPressed = true;
      this.setButtonScale('attack', 0.92);
      return;
    }

    if (target === 'special') {
      this.touchState.specialPressed = true;
      this.setButtonScale('special', 0.92);
      return;
    }

    if (target === 'ultimate') {
      this.touchState.ultimatePressed = true;
      this.setButtonScale('ultimate', 0.92);
      return;
    }

    if (target === 'jump') {
      this.touchState.jumpPressed = true;
      this.setButtonScale('jump', 0.92);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickPointerId) {
      return;
    }

    this.updateJoystick(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointerId) {
      this.resetJoystick();
    }

    this.controls.attackButton.setScale(1);
    this.controls.attackRing.setScale(1);
    this.controls.specialButton.setScale(1);
    this.controls.specialRing.setScale(1);
    this.controls.ultimateButton.setScale(1);
    this.controls.ultimateRing.setScale(1);
    this.controls.jumpButton.setScale(1);
    this.controls.jumpRing.setScale(1);
    this.controls.menuButton.setScale(1);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const delta = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
    const clampedVisual = delta.clone().limit(JOYSTICK_RADIUS);
    const clampedInput = delta.clone().limit(JOYSTICK_CAPTURE_RADIUS);
    const normalized = clampedInput.clone().scale(1 / JOYSTICK_CAPTURE_RADIUS);

    if (normalized.length() < JOYSTICK_DEADZONE) {
      this.touchState.moveX = 0;
      this.touchState.moveY = 0;
    } else {
      const strongInput = normalized.clone().normalize();
      this.touchState.moveX = Phaser.Math.Clamp(strongInput.x, -1, 1);
      this.touchState.moveY = Phaser.Math.Clamp(strongInput.y, -1, 1);
    }

    this.controls.knob.setPosition(this.joystickCenter.x + clampedVisual.x, this.joystickCenter.y + clampedVisual.y);
    this.controls.knobHighlight.setPosition(this.joystickCenter.x + clampedVisual.x - 6, this.joystickCenter.y + clampedVisual.y - 8);
  }

  private resetJoystick(): void {
    this.joystickPointerId = null;
    this.touchState.moveX = 0;
    this.touchState.moveY = 0;
    this.controls.knob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.controls.knobHighlight.setPosition(this.joystickCenter.x - 6, this.joystickCenter.y - 8);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.updateLayout(gameSize.width, gameSize.height);
  }

  private updateLayout(width: number, height: number): void {
    this.joystickCenter.set(92, height - 92);
    this.controls.baseShadow.setPosition(this.joystickCenter.x + 2, this.joystickCenter.y + 4);
    this.controls.base.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.controls.baseRing.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.controls.knob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.controls.knobHighlight.setPosition(this.joystickCenter.x - 6, this.joystickCenter.y - 8);

    const attackX = width - 96;
    const attackY = height - 86;
    const specialX = width - 170;
    const specialY = height - 146;
    const ultimateX = width - 98;
    const ultimateY = height - 178;
    const jumpX = width - 176;
    const jumpY = height - 68;
    const menuX = 52;
    const menuY = 30;

    this.controls.attackShadow.setPosition(attackX + 2, attackY + 4);
    this.controls.attackButton.setPosition(attackX, attackY);
    this.controls.attackRing.setPosition(attackX, attackY);
    this.controls.specialShadow.setPosition(specialX + 2, specialY + 4);
    this.controls.specialButton.setPosition(specialX, specialY);
    this.controls.specialRing.setPosition(specialX, specialY);
    this.controls.ultimateShadow.setPosition(ultimateX + 2, ultimateY + 4);
    this.controls.ultimateButton.setPosition(ultimateX, ultimateY);
    this.controls.ultimateRing.setPosition(ultimateX, ultimateY);
    this.controls.jumpShadow.setPosition(jumpX + 2, jumpY + 4);
    this.controls.jumpButton.setPosition(jumpX, jumpY);
    this.controls.jumpRing.setPosition(jumpX, jumpY);
    this.controls.menuShadow.setPosition(menuX + 2, menuY + 3);
    this.controls.menuButton.setPosition(menuX, menuY);
    this.controls.attackLabel.setPosition(attackX, attackY);
    this.controls.specialLabel.setPosition(specialX, specialY);
    this.controls.ultimateLabel.setPosition(ultimateX, ultimateY);
    this.controls.jumpLabel.setPosition(jumpX, jumpY);
    this.controls.menuLabel.setPosition(menuX, menuY);
  }

  private setButtonScale(button: 'attack' | 'special' | 'ultimate' | 'jump', scale: number): void {
    if (button === 'attack') {
      this.controls.attackButton.setScale(scale);
      this.controls.attackRing.setScale(scale);
      return;
    }

    if (button === 'special') {
      this.controls.specialButton.setScale(scale);
      this.controls.specialRing.setScale(scale);
      return;
    }

    if (button === 'ultimate') {
      this.controls.ultimateButton.setScale(scale);
      this.controls.ultimateRing.setScale(scale);
      return;
    }

    this.controls.jumpButton.setScale(scale);
    this.controls.jumpRing.setScale(scale);
  }

}
