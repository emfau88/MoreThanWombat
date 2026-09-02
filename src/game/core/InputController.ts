import Phaser from 'phaser';

export type PlayerInputState = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  specialPressed: boolean;
  ultimatePressed: boolean;
  jumpPressed: boolean;
  debugTogglePressed: boolean;
  restartPressed: boolean;
  menuPressed: boolean;
};

type TouchInputState = Omit<PlayerInputState, 'debugTogglePressed' | 'restartPressed'>;

export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasdKeys: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private readonly actionKeys: {
    attack: Phaser.Input.Keyboard.Key;
    special: Phaser.Input.Keyboard.Key;
    ultimate: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    debug: Phaser.Input.Keyboard.Key;
    restart: Phaser.Input.Keyboard.Key;
    menu: Phaser.Input.Keyboard.Key;
  };
  private touchState: TouchInputState = {
    moveX: 0,
    moveY: 0,
    attackPressed: false,
    specialPressed: false,
    ultimatePressed: false,
    jumpPressed: false,
    menuPressed: false,
  };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is required for the current development setup.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasdKeys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<
      'up' | 'down' | 'left' | 'right',
      Phaser.Input.Keyboard.Key
    >;
    this.actionKeys = keyboard.addKeys({
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      special: Phaser.Input.Keyboard.KeyCodes.K,
      ultimate: Phaser.Input.Keyboard.KeyCodes.U,
      jump: Phaser.Input.Keyboard.KeyCodes.L,
      debug: Phaser.Input.Keyboard.KeyCodes.H,
      restart: Phaser.Input.Keyboard.KeyCodes.R,
      menu: Phaser.Input.Keyboard.KeyCodes.M,
    }) as {
      attack: Phaser.Input.Keyboard.Key;
      special: Phaser.Input.Keyboard.Key;
      ultimate: Phaser.Input.Keyboard.Key;
      jump: Phaser.Input.Keyboard.Key;
      debug: Phaser.Input.Keyboard.Key;
      restart: Phaser.Input.Keyboard.Key;
      menu: Phaser.Input.Keyboard.Key;
    };
  }

  updateTouchState(touchState: TouchInputState): void {
    this.touchState = touchState;
  }

  consumePlayerInput(): PlayerInputState {
    const moveX = this.getAxis(this.cursors.left, this.cursors.right, this.wasdKeys.left, this.wasdKeys.right);
    const moveY = this.getAxis(this.cursors.up, this.cursors.down, this.wasdKeys.up, this.wasdKeys.down);
    const keyboardAttackPressed =
      Phaser.Input.Keyboard.JustDown(this.actionKeys.attack) || Phaser.Input.Keyboard.JustDown(this.cursors.space);
    const keyboardSpecialPressed =
      Phaser.Input.Keyboard.JustDown(this.actionKeys.special) || Phaser.Input.Keyboard.JustDown(this.cursors.shift);
    const keyboardUltimatePressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.ultimate);
    const keyboardJumpPressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.jump);
    const debugTogglePressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.debug);
    const restartPressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.restart);
    const keyboardMenuPressed = Phaser.Input.Keyboard.JustDown(this.actionKeys.menu);

    const inputState: PlayerInputState = {
      moveX: this.resolveAxis(moveX, this.touchState.moveX),
      moveY: this.resolveAxis(moveY, this.touchState.moveY),
      attackPressed: keyboardAttackPressed || this.touchState.attackPressed,
      specialPressed: keyboardSpecialPressed || this.touchState.specialPressed,
      ultimatePressed: keyboardUltimatePressed || this.touchState.ultimatePressed,
      jumpPressed: keyboardJumpPressed || this.touchState.jumpPressed,
      debugTogglePressed,
      restartPressed,
      menuPressed: keyboardMenuPressed || this.touchState.menuPressed,
    };

    this.touchState.attackPressed = false;
    this.touchState.specialPressed = false;
    this.touchState.ultimatePressed = false;
    this.touchState.jumpPressed = false;
    this.touchState.menuPressed = false;

    return inputState;
  }

  private getAxis(
    negativeA: Phaser.Input.Keyboard.Key | undefined,
    positiveA: Phaser.Input.Keyboard.Key | undefined,
    negativeB: Phaser.Input.Keyboard.Key | undefined,
    positiveB: Phaser.Input.Keyboard.Key | undefined,
  ): number {
    const negative = Boolean(negativeA?.isDown || negativeB?.isDown);
    const positive = Boolean(positiveA?.isDown || positiveB?.isDown);

    if (negative === positive) {
      return 0;
    }

    return positive ? 1 : -1;
  }

  private resolveAxis(keyboardAxis: number, touchAxis: number): number {
    if (keyboardAxis !== 0) {
      return keyboardAxis;
    }

    return touchAxis;
  }
}
