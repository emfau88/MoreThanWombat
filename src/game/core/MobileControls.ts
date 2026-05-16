import Phaser from 'phaser';
import type { PlayerInputState } from './InputController';

type ControlElements = {
  base: Phaser.GameObjects.Arc;
  knob: Phaser.GameObjects.Arc;
  attackButton: Phaser.GameObjects.Arc;
  specialButton: Phaser.GameObjects.Arc;
  jumpButton: Phaser.GameObjects.Arc;
  attackLabel: Phaser.GameObjects.Text;
  specialLabel: Phaser.GameObjects.Text;
  jumpLabel: Phaser.GameObjects.Text;
};

type TouchState = Omit<PlayerInputState, 'debugTogglePressed' | 'restartPressed'>;

const JOYSTICK_RADIUS = 58;
const JOYSTICK_KNOB_RADIUS = 28;
const JOYSTICK_DEADZONE = 0.15;

export class MobileControls {
  private readonly scene: Phaser.Scene;
  private readonly controls: ControlElements;
  private readonly touchState: TouchState = {
    moveX: 0,
    moveY: 0,
    attackPressed: false,
    specialPressed: false,
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
    scene.input.on(Phaser.Input.Events.GAME_OUT, this.resetJoystick, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.scene.input.off(Phaser.Input.Events.GAME_OUT, this.resetJoystick, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  getState(): TouchState {
    const currentState = { ...this.touchState };
    this.touchState.attackPressed = false;
    this.touchState.specialPressed = false;
    this.touchState.jumpPressed = false;
    return currentState;
  }

  private createControls(): ControlElements {
    const base = this.scene.add.circle(0, 0, JOYSTICK_RADIUS, 0x0e141c, 0.42).setScrollFactor(0).setDepth(1000);
    const knob = this.scene.add.circle(0, 0, JOYSTICK_KNOB_RADIUS, 0xf0f3bd, 0.9).setScrollFactor(0).setDepth(1001);
    const attackButton = this.scene.add.circle(0, 0, 42, 0xd95d39, 0.9).setScrollFactor(0).setDepth(1000);
    const specialButton = this.scene.add.circle(0, 0, 34, 0x457b9d, 0.88).setScrollFactor(0).setDepth(1000);
    const jumpButton = this.scene.add.circle(0, 0, 32, 0x6f8f3a, 0.88).setScrollFactor(0).setDepth(1000);
    const attackLabel = this.scene.add
      .text(0, 0, 'ATK', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '16px',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScrollFactor(0);
    const specialLabel = this.scene.add
      .text(0, 0, 'SP', {
        color: '#f3f7fb',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScrollFactor(0);
    const jumpLabel = this.scene.add
      .text(0, 0, 'JMP', {
        color: '#f3f7fb',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
      })
      .setOrigin(0.5)
      .setDepth(1001)
      .setScrollFactor(0);

    return { base, knob, attackButton, specialButton, jumpButton, attackLabel, specialLabel, jumpLabel };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const width = this.scene.scale.width;

    if (pointer.x <= width * 0.5 && this.joystickPointerId === null) {
      this.joystickPointerId = pointer.id;
      this.updateJoystick(pointer);
      return;
    }

    if (this.containsPointer(pointer, this.controls.attackButton)) {
      this.touchState.attackPressed = true;
      this.controls.attackButton.setScale(0.94);
    }

    if (this.containsPointer(pointer, this.controls.specialButton)) {
      this.touchState.specialPressed = true;
      this.controls.specialButton.setScale(0.94);
    }

    if (this.containsPointer(pointer, this.controls.jumpButton)) {
      this.touchState.jumpPressed = true;
      this.controls.jumpButton.setScale(0.94);
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
    this.controls.specialButton.setScale(1);
    this.controls.jumpButton.setScale(1);
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const delta = new Phaser.Math.Vector2(pointer.x - this.joystickCenter.x, pointer.y - this.joystickCenter.y);
    const clamped = delta.clone().limit(JOYSTICK_RADIUS);
    const normalized = clamped.clone().scale(1 / JOYSTICK_RADIUS);

    if (normalized.length() < JOYSTICK_DEADZONE) {
      this.touchState.moveX = 0;
      this.touchState.moveY = 0;
    } else {
      this.touchState.moveX = Phaser.Math.Clamp(normalized.x, -1, 1);
      this.touchState.moveY = Phaser.Math.Clamp(normalized.y, -1, 1);
    }

    this.controls.knob.setPosition(this.joystickCenter.x + clamped.x, this.joystickCenter.y + clamped.y);
  }

  private resetJoystick(): void {
    this.joystickPointerId = null;
    this.touchState.moveX = 0;
    this.touchState.moveY = 0;
    this.controls.knob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.updateLayout(gameSize.width, gameSize.height);
  }

  private updateLayout(width: number, height: number): void {
    this.joystickCenter.set(92, height - 92);
    this.controls.base.setPosition(this.joystickCenter.x, this.joystickCenter.y);
    this.controls.knob.setPosition(this.joystickCenter.x, this.joystickCenter.y);

    const attackX = width - 96;
    const attackY = height - 86;
    const specialX = width - 170;
    const specialY = height - 146;
    const jumpX = width - 176;
    const jumpY = height - 68;

    this.controls.attackButton.setPosition(attackX, attackY);
    this.controls.specialButton.setPosition(specialX, specialY);
    this.controls.jumpButton.setPosition(jumpX, jumpY);
    this.controls.attackLabel.setPosition(attackX, attackY);
    this.controls.specialLabel.setPosition(specialX, specialY);
    this.controls.jumpLabel.setPosition(jumpX, jumpY);
  }

  private containsPointer(pointer: Phaser.Input.Pointer, target: Phaser.GameObjects.Arc): boolean {
    return Phaser.Math.Distance.Between(pointer.x, pointer.y, target.x, target.y) <= target.radius;
  }
}
