import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig';
import { EnemyController } from '../ai/EnemyController';
import { Fighter, type FighterBounds } from '../combat/Fighter';
import { HitboxSystem } from '../combat/HitboxSystem';
import { ProjectileSystem } from '../combat/ProjectileSystem';
import { PushboxSystem } from '../combat/PushboxSystem';
import type { BattleMode, BattleSceneData, FighterId } from '../core/BattleModes';
import { BattleFlowController } from '../core/BattleFlowController';
import { InputController } from '../core/InputController';
import { MobileControls } from '../core/MobileControls';
import { fighterDefinitions } from '../data/fighters';
import { projectilesById } from '../data/projectiles';
import { Hud } from '../ui/Hud';

type WaveConfig = {
  hp: number;
  spawnX: number;
  spawnY: number;
  moveSpeed: number;
};

export class BattleScene extends Phaser.Scene {
  private readonly arenaBounds: FighterBounds = {
    minX: 120,
    maxX: 840,
    minY: 240,
    maxY: 460,
  };
  private inputController!: InputController;
  private mobileControls!: MobileControls;
  private player!: Fighter;
  private enemy!: Fighter;
  private instructionText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private debugToggleButton!: Phaser.GameObjects.Rectangle;
  private debugToggleLabel!: Phaser.GameObjects.Text;
  private hud!: Hud;
  private resultText!: Phaser.GameObjects.Text;
  private resultHintText!: Phaser.GameObjects.Text;
  private debugEnabled = true;
  private hitboxSystem!: HitboxSystem;
  private projectileSystem!: ProjectileSystem;
  private pushboxSystem!: PushboxSystem;
  private enemyController!: EnemyController;
  private battleFlow!: BattleFlowController;
  private hitstopRemainingMs = 0;
  private mode: BattleMode = 'duel';
  private playerFighterId: FighterId = 'wombat';
  private enemyFighterId: FighterId = 'angry_pigeon';
  private waveIndex = 0;
  private waveTransitionRemainingMs = 0;
  private readonly spawnedProjectileAttackInstances = new Set<string>();
  private readonly waveConfigs: WaveConfig[] = [
    { hp: 56, spawnX: 650, spawnY: 330, moveSpeed: 120 },
    { hp: 72, spawnX: 700, spawnY: 360, moveSpeed: 132 },
    { hp: 90, spawnX: 660, spawnY: 300, moveSpeed: 144 },
  ];

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.mode = data.mode ?? 'duel';
    this.playerFighterId = data.playerFighterId ?? 'wombat';
    this.enemyFighterId = data.enemyFighterId ?? 'angry_pigeon';
  }

  create(): void {
    this.debugEnabled = true;
    this.hitstopRemainingMs = 0;
    this.waveIndex = 0;
    this.waveTransitionRemainingMs = 0;
    this.spawnedProjectileAttackInstances.clear();
    this.hitboxSystem = new HitboxSystem();
    this.projectileSystem = new ProjectileSystem(this);
    this.pushboxSystem = new PushboxSystem();
    this.enemyController = new EnemyController();
    this.battleFlow = new BattleFlowController();
    this.createCharacterAnimations();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'duel-park-background').setDepth(-100);
    this.add.rectangle(GAME_WIDTH / 2, 232, 820, 8, 0xf5f0d8, 0.16).setDepth(-90);
    this.add.rectangle(GAME_WIDTH / 2, 468, 820, 8, 0x141821, 0.18).setDepth(-90);
    this.add.text(32, 28, 'More Than Wombat - Combat Sandbox', {
      color: '#f5f0d8',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '22px',
    });
    this.instructionText = this.add.text(32, 58, 'WASD/Arrows move, J/Space jab, K/Shift special, L jump, H debug, R restart', {
      color: '#c9d6df',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
    });
    this.modeText = this.add.text(GAME_WIDTH - 28, 36, '', {
      color: '#f5f0d8',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '16px',
      align: 'right',
    }).setOrigin(1, 0.5);
    this.debugToggleButton = this.add
      .rectangle(GAME_WIDTH - 92, 74, 124, 34, 0x223042, 0.94)
      .setStrokeStyle(2, 0xe9c46a, 0.86)
      .setDepth(2100)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        this.debugToggleButton.setFillStyle(0x2d4057, 0.98);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        this.syncDebugToggleUi();
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        this.toggleDebug();
      });
    this.debugToggleLabel = this.add
      .text(GAME_WIDTH - 92, 74, '', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(2101)
      .setScrollFactor(0);
    this.resultText = this.add
      .text(GAME_WIDTH / 2, 112, '', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '30px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2200)
      .setScrollFactor(0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.restartBattle();
      });
    this.resultHintText = this.add
      .text(GAME_WIDTH / 2, 170, '', {
        color: '#c9d6df',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '15px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2200)
      .setScrollFactor(0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.goToMenu();
      });
    this.inputController = new InputController(this);
    this.mobileControls = new MobileControls(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.mobileControls.destroy();
      this.projectileSystem.destroy();
    });
    this.player = new Fighter(this, fighterDefinitions[this.playerFighterId], { x: 280, y: 340 });
    this.enemy = this.createEnemyForCurrentMode();
    this.player.setDebugVisible(this.debugEnabled);
    this.enemy.setDebugVisible(this.debugEnabled);
    this.enemy.updateVisuals();
    this.syncDebugToggleUi();
    this.hud = new Hud(this);
    this.updateModeText();
    this.hud.update(this.player, this.enemy);
  }

  update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    this.inputController.updateTouchState(this.mobileControls.getState());
    const inputState = this.inputController.consumePlayerInput();

    if (inputState.restartPressed) {
      this.restartBattle();
      return;
    }

    if (inputState.menuPressed) {
      this.goToMenu();
      return;
    }

    if (inputState.debugTogglePressed) {
      this.toggleDebug();
    }

    if (this.shouldAllowDuelVictoryFreeRoam()) {
      this.updateDuelVictoryFreeRoam(
        deltaSeconds,
        inputState.moveX,
        inputState.moveY,
        inputState.jumpPressed,
        inputState.attackPressed,
      );
      return;
    }

    if (this.battleFlow.getResult() !== 'running') {
      return;
    }

    if (this.waveTransitionRemainingMs > 0) {
      this.waveTransitionRemainingMs = Math.max(0, this.waveTransitionRemainingMs - delta);

      if (this.waveTransitionRemainingMs === 0) {
        this.advanceWave();
      }

      this.player.updateVisuals();
      this.enemy.updateVisuals();
      this.hud.update(this.player, this.enemy);
      return;
    }

    if (this.hitstopRemainingMs > 0) {
      this.hitstopRemainingMs = Math.max(0, this.hitstopRemainingMs - delta);
      this.player.updateVisuals();
      this.enemy.updateVisuals();
      this.hud.update(this.player, this.enemy);
      return;
    }

    if (inputState.jumpPressed) {
      this.player.tryStartJump();
    }

    if (inputState.attackPressed) {
      this.player.faceTarget(this.enemy.x);
      if (!this.player.isGrounded) {
        this.player.tryStartAirAttack();
      } else {
        this.tryStartAttackWithFx(this.player, 'basic');
      }
    }

    if (inputState.specialPressed) {
      this.player.faceTarget(this.enemy.x);
      this.tryStartAttackWithFx(this.player, 'special');
    }

    const enemyIntent = this.enemyController.update(this.enemy, this.player, deltaSeconds);
    this.enemy.setStatusNote(`AI ${enemyIntent.state}`);
    this.enemy.faceTarget(this.player.x);

    if (enemyIntent.attackPressed) {
      this.tryStartAttackWithFx(this.enemy, 'basic');
    }

    this.player.update(deltaSeconds, inputState.moveX, inputState.moveY, this.arenaBounds);
    this.enemy.update(deltaSeconds, enemyIntent.moveX, enemyIntent.moveY, this.arenaBounds);
    this.spawnAttackProjectiles(this.player);
    this.spawnAttackProjectiles(this.enemy);
    this.pushboxSystem.resolve(this.player, this.enemy, this.arenaBounds);
    const playerHit = this.hitboxSystem.resolveHit(this.player, this.enemy);
    const enemyHit = this.hitboxSystem.resolveHit(this.enemy, this.player);
    const projectileHits = this.projectileSystem.update(deltaSeconds, [this.player, this.enemy], this.arenaBounds);
    this.spawnImpactFx(playerHit.attackId, this.enemy);
    this.spawnImpactFx(enemyHit.attackId, this.player);
    for (const projectileHit of projectileHits) {
      this.spawnFx(projectileHit.impactAnimationKey, projectileHit.x, projectileHit.y, projectileHit.target.y + 8, false, 0.96);
    }
    const projectileDamage = projectileHits[0]?.damage ?? 0;
    this.applyImpactFeedback(playerHit.didHit ? playerHit.damage : enemyHit.didHit ? enemyHit.damage : projectileDamage);
    this.hud.update(this.player, this.enemy);
    this.updateBattleResult();
  }

  private updateBattleResult(): void {
    const playerDefeated = this.player.state === 'dead';
    let battleWon = false;

    if (this.mode === 'duel') {
      battleWon = this.enemy.state === 'dead';
    } else if (this.enemy.state === 'dead') {
      const lastWaveReached = this.waveIndex >= this.waveConfigs.length - 1;

      if (lastWaveReached) {
        battleWon = true;
      } else if (this.waveTransitionRemainingMs === 0) {
        this.waveTransitionRemainingMs = 900;
        this.resultText.setText(`Wave ${this.waveIndex + 2}\nIncoming...`).setVisible(true);
      }
    }

    const result = this.battleFlow.update(playerDefeated, battleWon);

    if (result === 'running') {
      return;
    }

    const message = result === 'victory' ? 'Victory' : 'Defeat';
    this.resultText.setText(`${message}\nPress R to restart`).setVisible(true);
    this.resultHintText.setText('Press M for menu').setVisible(true);
  }

  private shouldAllowDuelVictoryFreeRoam(): boolean {
    return this.mode === 'duel' && this.battleFlow.getResult() === 'victory' && this.player.state !== 'dead';
  }

  private updateDuelVictoryFreeRoam(
    deltaSeconds: number,
    moveX: number,
    moveY: number,
    jumpPressed: boolean,
    attackPressed: boolean,
  ): void {
    if (jumpPressed) {
      this.player.tryStartJump();
    }

    if (attackPressed && !this.player.isGrounded) {
      this.player.tryStartAirAttack();
    }

    this.player.update(deltaSeconds, moveX, moveY, this.arenaBounds);
    this.enemy.updateVisuals();
    this.hud.update(this.player, this.enemy);
  }

  private restartBattle(): void {
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
    this.scene.restart({ mode: this.mode, playerFighterId: this.playerFighterId, enemyFighterId: this.enemyFighterId });
  }

  private goToMenu(): void {
    this.scene.start('MainMenuScene');
  }

  private toggleDebug(): void {
    this.debugEnabled = !this.debugEnabled;
    this.player.setDebugVisible(this.debugEnabled);
    this.enemy.setDebugVisible(this.debugEnabled);
    this.instructionText.setVisible(this.debugEnabled);
    this.syncDebugToggleUi();
  }

  private syncDebugToggleUi(): void {
    if (!this.debugToggleButton || !this.debugToggleLabel) {
      return;
    }

    this.debugToggleButton.setFillStyle(this.debugEnabled ? 0x34526b : 0x223042, this.debugEnabled ? 0.98 : 0.94);
    this.debugToggleLabel.setText(`Debug: ${this.debugEnabled ? 'On' : 'Off'}`);
  }

  private applyImpactFeedback(damage: number): void {
    if (damage <= 0) {
      return;
    }

    this.hitstopRemainingMs = damage >= 18 ? 100 : 50;
    this.cameras.main.shake(damage >= 18 ? 90 : 60, damage >= 18 ? 0.006 : 0.0035);
  }

  private createCharacterAnimations(): void {
    this.createAnimationOnce('wombat-idle', 'wombat', 0, 3, 5, -1);
    this.createAnimationOnce('wombat-walk', 'wombat', 4, 7, 8, -1);
    this.createAnimationOnce('wombat-jab', 'wombat', 8, 11, 14, 0);
    this.createAnimationOnce('wombat-belly-slam', 'wombat', 12, 15, 10, 0);
    this.createAnimationOnce('wombat-hit', 'wombat', 16, 17, 8, 0);
    this.createAnimationOnce('wombat-dead', 'wombat', 18, 19, 5, 0);
    this.createAnimationOnce('wombat-air-bonk', 'wombat-air-bonk', 0, 2, 12, 0);

    this.createAnimationOnce('angry-pigeon-idle', 'angry-pigeon', 0, 3, 5, -1);
    this.createAnimationOnce('angry-pigeon-walk', 'angry-pigeon', 4, 7, 8, -1);
    this.createAnimationOnce('angry-pigeon-peck', 'angry-pigeon', 8, 11, 14, 0);
    this.createAnimationOnce('angry-pigeon-hit', 'angry-pigeon', 12, 15, 9, 0);
    this.createAnimationOnce('angry-pigeon-dead', 'angry-pigeon', 16, 19, 7, 0);

    this.createAnimationOnce('discount-wizard-idle', 'discount-wizard', 0, 3, 5, -1);
    this.createAnimationOnce('discount-wizard-walk', 'discount-wizard', 4, 7, 8, -1);
    this.createAnimationOnce('discount-wizard-fireball', 'discount-wizard', 8, 11, 11, 0);
    this.createAnimationOnce('discount-wizard-miscast', 'discount-wizard', 12, 15, 9, 0);
    this.createAnimationOnce('discount-wizard-hit', 'discount-wizard', 16, 17, 8, 0);
    this.createAnimationOnce('discount-wizard-dead', 'discount-wizard', 18, 19, 5, 0);

    this.createAnimationOnce('budget-barbarian-idle', 'budget-barbarian', 0, 1, 4, -1);
    this.createAnimationOnce('budget-barbarian-walk', 'budget-barbarian', 4, 7, 8, -1);
    this.createAnimationOnce('budget-barbarian-axe-swing', 'budget-barbarian', 8, 10, 11, 0);
    this.createAnimationOnce('budget-barbarian-tiny-rage', 'budget-barbarian', 12, 14, 9, 0);
    this.createAnimationOnce('budget-barbarian-hit', 'budget-barbarian', 15, 15, 8, 0);
    this.createAnimationOnce('budget-barbarian-dead', 'budget-barbarian', 16, 17, 5, 0);

    this.createAnimationOnce('buster-bulldog-idle', 'buster-bulldog', 0, 3, 5, -1);
    this.createAnimationOnce('buster-bulldog-walk', 'buster-bulldog', 4, 7, 8, -1);
    this.createAnimationOnce('buster-bulldog-underbite-jab', 'buster-bulldog', 8, 11, 13, 0);
    this.createAnimationOnce('buster-bulldog-bash', 'buster-bulldog', 12, 15, 11, 0);
    this.createAnimationOnce('buster-bulldog-hit', 'buster-bulldog', 16, 17, 8, 0);
    this.createAnimationOnce('buster-bulldog-dead', 'buster-bulldog', 18, 19, 5, 0);
    this.createAnimationOnce('buster-bulldog-air-bonk', 'buster-bulldog-air-bonk', 0, 2, 12, 0);

    this.createAnimationOnce('discount-wizard-fx-fireball', 'discount-wizard-fx', 0, 3, 14, 0);
    this.createAnimationOnce('discount-wizard-fx-hit-puff', 'discount-wizard-fx', 4, 7, 14, 0);
    this.createAnimationOnce('discount-wizard-fx-miscast', 'discount-wizard-fx', 8, 11, 12, 0);
  }

  private createAnimationOnce(
    key: string,
    textureKey: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number,
  ): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate,
      repeat,
    });
  }

  private createEnemyForCurrentMode(): Fighter {
    if (this.mode === 'duel') {
      const enemy = new Fighter(this, fighterDefinitions[this.enemyFighterId], { x: 650, y: 330 });
      enemy.facing = 'left';
      return enemy;
    }

    const wave = this.waveConfigs[this.waveIndex];
    const waveDefinition = {
      ...fighterDefinitions[this.enemyFighterId],
      label: `Wave ${this.waveIndex + 1} Enemy`,
      maxHp: wave.hp,
      moveSpeed: wave.moveSpeed,
    };
    const enemy = new Fighter(this, waveDefinition, { x: wave.spawnX, y: wave.spawnY });
    enemy.facing = 'left';
    return enemy;
  }

  private advanceWave(): void {
    if (this.mode !== 'waves') {
      return;
    }

    this.waveIndex += 1;
    this.enemyController = new EnemyController();
    this.projectileSystem.destroy();
    this.spawnedProjectileAttackInstances.clear();
    this.enemy.destroy();
    this.enemy = this.createEnemyForCurrentMode();
    this.enemy.setDebugVisible(this.debugEnabled);
    this.enemy.updateVisuals();
    this.enemy.setStatusNote('AI idle');
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
    this.updateModeText();
    this.hud.update(this.player, this.enemy);
  }

  private updateModeText(): void {
    if (this.mode === 'duel') {
      this.modeText.setText('Mode: Duel');
      return;
    }

    this.modeText.setText(`Mode: Waves ${this.waveIndex + 1}/${this.waveConfigs.length}`);
  }

  private tryStartAttackWithFx(fighter: Fighter, kind: 'basic' | 'special'): void {
    const attackId =
      fighter.id === 'discount_wizard' && kind === 'special'
        ? Phaser.Math.RND.pick(['discount_fireball_cast', 'discount_miscast'])
        : undefined;
    const didStart = attackId ? fighter.tryStartAttackById(attackId, kind) : fighter.tryStartAttack(kind);

    if (!didStart || fighter.id !== 'discount_wizard') {
      return;
    }

    const attack = fighter.getCurrentAttack();

    if (!attack) {
      return;
    }

    if (attack.id === 'discount_fireball_cast') {
      this.spawnCastFx('discount-wizard-fx-fireball', fighter, 66, -52, 1.08);
      return;
    }

    if (attack.id === 'discount_miscast') {
      this.spawnCastFx('discount-wizard-fx-miscast', fighter, 42, -58, 1.18);
    }
  }

  private spawnAttackProjectiles(fighter: Fighter): void {
    const attack = fighter.getCurrentAttack();

    if (!attack?.projectileId || fighter.getAttackPhase() !== 'active') {
      return;
    }

    const attackInstanceId = `${fighter.instanceId}:${fighter.getAttackInstanceId()}`;

    if (this.spawnedProjectileAttackInstances.has(attackInstanceId)) {
      return;
    }

    const projectile = projectilesById[attack.projectileId];

    if (!projectile) {
      return;
    }

    this.spawnedProjectileAttackInstances.add(attackInstanceId);
    this.projectileSystem.spawn(fighter, projectile);
  }

  private spawnImpactFx(attackId: string | undefined, target: Fighter): void {
    if (!attackId) {
      return;
    }

    if (attackId === 'discount_miscast') {
      this.spawnFx('discount-wizard-fx-miscast', target.x, target.y - 44, target.y + 8, false, 1.08);
      return;
    }

    if (attackId === 'discount_wand_smack' || attackId === 'discount_fireball_cast') {
      this.spawnFx('discount-wizard-fx-hit-puff', target.x, target.y - 42, target.y + 8, false, 0.96);
    }
  }

  private spawnCastFx(
    animationKey: string,
    caster: Fighter,
    offsetX: number,
    offsetY: number,
    scale: number,
  ): void {
    const direction = caster.facing === 'right' ? 1 : -1;
    this.spawnFx(animationKey, caster.x + offsetX * direction, caster.y + offsetY, caster.y + 12, caster.facing === 'left', scale);
  }

  private spawnFx(animationKey: string, x: number, y: number, depth: number, flipX: boolean, scale: number): void {
    const sprite = this.add.sprite(x, y, 'discount-wizard-fx').setOrigin(0.5).setDepth(depth).setFlipX(flipX).setScale(scale);
    sprite.play(animationKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.destroy();
    });
  }
}
