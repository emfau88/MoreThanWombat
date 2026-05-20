import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig';
import { EnemyController } from '../ai/EnemyController';
import { Fighter, type FighterBounds } from '../combat/Fighter';
import { HitboxSystem, type HitResolution } from '../combat/HitboxSystem';
import { ProjectileSystem } from '../combat/ProjectileSystem';
import { PushboxSystem } from '../combat/PushboxSystem';
import type { BattleMode, BattleSceneData, FighterId } from '../core/BattleModes';
import { BattleFlowController } from '../core/BattleFlowController';
import { InputController } from '../core/InputController';
import { MobileControls } from '../core/MobileControls';
import type { ArenaId } from '../data/arenas';
import { fighterDefinitions } from '../data/fighters';
import { projectilesById } from '../data/projectiles';
import { defaultWaveStageId, waveStages, type StageDefinition, type StageSectionDefinition, type StageEnemySpawnDefinition, type WaveStageId } from '../data/stages';
import { Hud } from '../ui/Hud';
import { intersectsRect, type Rect } from '../utils/Rect';

type AxeRainStrike = {
  owner: Fighter;
  x: number;
  y: number;
  delayMs: number;
  activeMs: number;
  didImpact: boolean;
  warning: Phaser.GameObjects.Ellipse;
  hitTargetInstanceIds: Set<number>;
};

export class BattleScene extends Phaser.Scene {
  private readonly defaultArenaBounds: FighterBounds = {
    minX: 72,
    maxX: 888,
    minY: 248,
    maxY: 474,
  };
  private arenaBounds: FighterBounds = {
    minX: 72,
    maxX: 888,
    minY: 248,
    maxY: 474,
  };
  private inputController!: InputController;
  private mobileControls!: MobileControls;
  private player!: Fighter;
  private enemy: Fighter | null = null;
  private waveEnemies: Fighter[] = [];
  private instructionText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private debugToggleButton!: Phaser.GameObjects.Rectangle;
  private debugToggleLabel!: Phaser.GameObjects.Text;
  private hud!: Hud;
  private resultText!: Phaser.GameObjects.Text;
  private resultHintText!: Phaser.GameObjects.Text;
  private debugEnabled = false;
  private hitboxSystem!: HitboxSystem;
  private projectileSystem!: ProjectileSystem;
  private pushboxSystem!: PushboxSystem;
  private enemyController!: EnemyController;
  private readonly waveEnemyControllers = new Map<number, EnemyController>();
  private battleFlow!: BattleFlowController;
  private hitstopRemainingMs = 0;
  private mode: BattleMode = 'duel';
  private playerFighterId: FighterId = 'wombat';
  private enemyFighterId: FighterId = 'angry_pigeon';
  private arenaId: ArenaId = 'park';
  private waveStageId: WaveStageId = defaultWaveStageId;
  private waveStage!: StageDefinition;
  private waveIndex = 0;
  private waveTransitionRemainingMs = 0;
  private testDummyRegenDelayMs = 0;
  private testDummyLastHp = 0;
  private readonly spawnedProjectileAttackInstances = new Set<string>();
  private readonly axeRainStrikes: AxeRainStrike[] = [];

  constructor() {
    super('BattleScene');
  }

  init(data: BattleSceneData): void {
    this.mode = data.mode ?? 'duel';
    this.playerFighterId = data.playerFighterId ?? 'wombat';
    this.enemyFighterId = data.enemyFighterId ?? 'angry_pigeon';
    this.arenaId = data.arenaId ?? 'park';
    this.waveStageId = data.stageId ?? defaultWaveStageId;
    this.waveStage = waveStages[this.waveStageId] ?? waveStages[defaultWaveStageId];
  }

  create(): void {
    this.debugEnabled = false;
    this.hitstopRemainingMs = 0;
    this.waveIndex = 0;
    this.waveTransitionRemainingMs = 0;
    this.testDummyRegenDelayMs = 0;
    this.testDummyLastHp = 0;
    this.spawnedProjectileAttackInstances.clear();
    this.clearAxeRainStrikes();
    this.clearWaveEnemies();
    this.resetArenaBounds();
    this.updateWaveArenaBoundsForCurrentSection();
    this.hitboxSystem = new HitboxSystem();
    this.projectileSystem = new ProjectileSystem(this);
    this.pushboxSystem = new PushboxSystem();
    this.enemyController = new EnemyController();
    this.battleFlow = new BattleFlowController();
    this.createCharacterAnimations();
    this.renderArena();
    this.instructionText = this.add.text(32, 28, 'WASD/Arrows move, J/Space jab, K/Shift special, U ultimate slot, L jump, H debug, R restart', {
      color: '#c9d6df',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
    });
    this.modeText = this.add.text(GAME_WIDTH - 28, 28, '', {
      color: '#f5f0d8',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '16px',
      align: 'right',
    }).setOrigin(1, 0.5);
    this.debugToggleButton = this.add
      .rectangle(GAME_WIDTH / 2, 84, 124, 30, 0x223042, 0.94)
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
      })
      .setVisible(false)
      .disableInteractive();
    this.debugToggleLabel = this.add
      .text(GAME_WIDTH / 2, 84, '', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setDepth(2101)
      .setScrollFactor(0)
      .setVisible(false);
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
      this.clearWaveEnemies();
      this.mobileControls.destroy();
      this.projectileSystem.destroy();
    });
    this.player = new Fighter(this, fighterDefinitions[this.playerFighterId], this.getPlayerSpawnPoint());
    this.enemy = null;
    if (this.mode === 'waves') {
      this.waveEnemies = this.createWaveEnemiesForCurrentSection();
      this.syncPrimaryEnemy();
    } else {
      this.enemy = this.createEnemyForCurrentMode();
    }
    this.testDummyLastHp = this.enemy?.hp ?? 0;
    if (this.mode === 'test') {
      this.player.restoreMana();
    }
    this.player.setDebugVisible(this.debugEnabled);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.setDebugVisible(this.debugEnabled);
      enemy.updateVisuals();
    }
    this.instructionText.setVisible(this.debugEnabled);
    this.syncDebugToggleUi();
    this.hud = new Hud(this);
    this.configureCameraForCurrentMode();
    this.updateModeText();
    this.hud.update(this.player, this.getHudEnemy());
    if (this.mode === 'waves') {
      this.showWaveSectionIntro();
    }
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
        inputState.ultimatePressed,
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
      for (const enemy of this.getCurrentEnemies()) {
        enemy.updateVisuals();
      }
      this.hud.update(this.player, this.getHudEnemy());
      return;
    }

    if (this.hitstopRemainingMs > 0) {
      this.hitstopRemainingMs = Math.max(0, this.hitstopRemainingMs - delta);
      this.player.updateVisuals();
      for (const enemy of this.getCurrentEnemies()) {
        enemy.updateVisuals();
      }
      this.hud.update(this.player, this.getHudEnemy());
      return;
    }

    const targetEnemy = this.getPreferredEnemyTarget();

    if (inputState.jumpPressed) {
      this.player.tryStartJump();
    }

    if (inputState.attackPressed) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      if (!this.player.isGrounded) {
        this.player.tryStartAirAttack();
      } else {
        this.tryStartAttackWithFx(this.player, 'basic');
      }
    }

    if (inputState.specialPressed) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      this.tryStartAttackWithFx(this.player, 'special');
    }

    if (inputState.ultimatePressed) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      this.tryStartAttackWithFx(this.player, 'ultimate');
    }

    const enemyIntents = new Map<number, ReturnType<EnemyController['update']>>();
    for (const enemy of this.getCurrentEnemies()) {
      const controller = this.getControllerForEnemy(enemy);
      const enemyIntent = controller.update(enemy, this.player, deltaSeconds);
      enemyIntents.set(enemy.instanceId, enemyIntent);
      enemy.setStatusNote(`AI ${enemyIntent.state}`);
      enemy.faceTarget(this.player.x);

      if (enemyIntent.attackPressed) {
        this.tryStartAttackWithFx(enemy, enemyIntent.attackKind);
      }
    }

    this.player.update(deltaSeconds, inputState.moveX, inputState.moveY, this.arenaBounds);

    if (this.mode === 'test') {
      this.player.restoreMana();
    }

    for (const enemy of this.getCurrentEnemies()) {
      const enemyIntent = enemyIntents.get(enemy.instanceId);
      if (enemyIntent) {
        enemy.update(deltaSeconds, enemyIntent.moveX, enemyIntent.moveY, this.arenaBounds);
      } else if (this.mode === 'test') {
        enemy.update(deltaSeconds, 0, 0, this.arenaBounds);
      }
    }

    this.spawnAttackProjectiles(this.player);

    for (const enemy of this.getCurrentEnemies()) {
      this.spawnAttackProjectiles(enemy);
      this.pushboxSystem.resolve(this.player, enemy, this.arenaBounds);
    }

    let playerHit: HitResolution = { didHit: false, damage: 0 };
    let enemyHit: HitResolution = { didHit: false, damage: 0 };

    for (const enemy of this.getCurrentEnemies()) {
      const playerHitAttempt = this.hitboxSystem.resolveHit(this.player, enemy);
      if (playerHitAttempt.didHit) {
        playerHit = playerHitAttempt;
        this.spawnImpactFx(playerHitAttempt.attackId, enemy);
      }

      const enemyHitAttempt = this.hitboxSystem.resolveHit(enemy, this.player);
      if (enemyHitAttempt.didHit && enemyHitAttempt.damage >= enemyHit.damage) {
        enemyHit = enemyHitAttempt;
      }
    }

    const projectileHits = this.projectileSystem.update(deltaSeconds, [this.player, ...this.getCurrentEnemies()], this.arenaBounds);
    this.spawnImpactFx(enemyHit.attackId, this.player);
    for (const projectileHit of projectileHits) {
      if (projectileHit.projectileId === 'discount_ultimate_orb_projectile') {
        this.spawnFx(projectileHit.impactAnimationKey, projectileHit.x, projectileHit.y, projectileHit.target.y + 10, false, 1.28, 'discount-wizard-ultimate-fx');
      } else {
        this.spawnFx(projectileHit.impactAnimationKey, projectileHit.x, projectileHit.y, projectileHit.target.y + 8, false, 0.96);
      }
    }
    const axeRainDamage = this.updateAxeRainStrikes(delta);
    this.updateTestDummyRegen(delta);
    const projectileDamage = projectileHits[0]?.damage ?? 0;
    const impactAttackId = playerHit.didHit ? playerHit.attackId : enemyHit.didHit ? enemyHit.attackId : undefined;
    this.applyImpactFeedback(playerHit.didHit ? playerHit.damage : enemyHit.didHit ? enemyHit.damage : projectileDamage || axeRainDamage, impactAttackId);
    this.syncPrimaryEnemy();
    this.hud.update(this.player, this.getHudEnemy());

    if (this.getCurrentEnemies().length > 0 && this.mode !== 'test') {
      this.updateBattleResult();
    }
  }

  private updateBattleResult(): void {
    const currentEnemies = this.getCurrentEnemies();
    if (currentEnemies.length === 0) {
      return;
    }

    const playerDefeated = this.player.state === 'dead';
    let battleWon = false;
    const allEnemiesDefeated = currentEnemies.every((enemy) => enemy.state === 'dead');

    if (this.mode === 'duel') {
      battleWon = allEnemiesDefeated;
    } else if (allEnemiesDefeated) {
      const lastWaveReached = this.waveIndex >= this.waveStage.sections.length - 1;

      if (lastWaveReached) {
        battleWon = true;
      } else if (this.waveTransitionRemainingMs === 0) {
        this.waveTransitionRemainingMs = 900;
        const nextSection = this.waveStage.sections[this.waveIndex + 1];
        const nextLabel = nextSection ? nextSection.title : `Wave ${this.waveIndex + 2}`;
        this.resultText.setText(`Section Clear\n${nextLabel} incoming`).setVisible(true);
        this.resultHintText.setText('Hold position').setVisible(true);
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

  private updateTestDummyRegen(deltaMs: number): void {
    if (this.mode !== 'test' || !this.enemy) {
      return;
    }

    if (this.enemy.hp < this.testDummyLastHp) {
      this.testDummyRegenDelayMs = 1400;
    }

    if (this.testDummyRegenDelayMs > 0) {
      this.testDummyRegenDelayMs = Math.max(0, this.testDummyRegenDelayMs - deltaMs);
      this.testDummyLastHp = this.enemy.hp;
      return;
    }

    if (this.enemy.hp < this.enemy.maxHp) {
      const healedHp = Math.min(this.enemy.maxHp, this.enemy.hp + Math.ceil(deltaMs * 1.8));
      this.enemy.hp = healedHp;

      if (this.enemy.state === 'dead' && healedHp > 0) {
        this.enemy.state = 'idle';
      }

      this.enemy.updateVisuals();
    }

    this.testDummyLastHp = this.enemy.hp;
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
    ultimatePressed: boolean,
  ): void {
    if (jumpPressed) {
      this.player.tryStartJump();
    }

    if (attackPressed && !this.player.isGrounded) {
      this.player.tryStartAirAttack();
    }

    if (ultimatePressed) {
      this.tryStartAttackWithFx(this.player, 'ultimate');
    }

    this.player.update(deltaSeconds, moveX, moveY, this.arenaBounds);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.updateVisuals();
    }
    this.hud.update(this.player, this.getHudEnemy());
  }

  private restartBattle(): void {
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
    this.scene.restart({
      mode: this.mode,
      playerFighterId: this.playerFighterId,
      enemyFighterId: this.enemyFighterId,
      arenaId: this.arenaId,
      stageId: this.waveStageId,
    });
  }

  private goToMenu(): void {
    this.scene.start('MainMenuScene');
  }

  private toggleDebug(): void {
    this.debugEnabled = !this.debugEnabled;
    this.player.setDebugVisible(this.debugEnabled);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.setDebugVisible(this.debugEnabled);
    }
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

  private applyImpactFeedback(damage: number, attackId?: string): void {
    if (damage <= 0) {
      return;
    }

    if (attackId === 'wombat_earthshaker') {
      this.hitstopRemainingMs = 24;
      this.cameras.main.shake(130, 0.008);
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
    this.createAnimationOnce('wombat-earthshaker-fx', 'wombat-earthshaker-fx', 0, 3, 9, 0);

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

    this.createAnimationOnce('budget-barbarian-idle', 'budget-barbarian', 0, 3, 4, -1);
    this.createAnimationFromFramesOnce('budget-barbarian-walk', 'budget-barbarian', [4, 6, 5, 7], 7, -1);
    this.createAnimationOnce('budget-barbarian-axe-swing', 'budget-barbarian', 8, 10, 11, 0);
    this.createAnimationOnce('budget-barbarian-tiny-rage', 'budget-barbarian', 12, 14, 9, 0);
    this.createAnimationOnce('budget-barbarian-hit', 'budget-barbarian', 15, 15, 8, 0);
    this.createAnimationOnce('budget-barbarian-dead', 'budget-barbarian', 16, 17, 5, 0);
    this.createAnimationOnce('budget-barbarian-jump', 'budget-barbarian', 20, 20, 8, 0);
    this.createAnimationOnce('budget-barbarian-fall', 'budget-barbarian', 21, 21, 8, 0);
    this.createAnimationOnce('budget-barbarian-landing', 'budget-barbarian', 22, 22, 8, 0);
    this.createAnimationOnce('budget-barbarian-air-bonk', 'budget-barbarian', 24, 26, 12, 0);

    this.createAnimationOnce('buster-bulldog-idle', 'buster-bulldog', 0, 3, 5, -1);
    this.createAnimationOnce('buster-bulldog-walk', 'buster-bulldog', 4, 7, 8, -1);
    this.createAnimationOnce('buster-bulldog-underbite-jab', 'buster-bulldog', 8, 11, 13, 0);
    this.createAnimationOnce('buster-bulldog-bash', 'buster-bulldog', 12, 15, 11, 0);
    this.createAnimationOnce('buster-bulldog-hit', 'buster-bulldog', 16, 17, 8, 0);
    this.createAnimationOnce('buster-bulldog-dead', 'buster-bulldog', 18, 19, 5, 0);
    this.createAnimationOnce('buster-bulldog-air-bonk', 'buster-bulldog-air-bonk', 0, 2, 12, 0);

    this.createAnimationOnce('reference-fighter-idle', 'reference-fighter', 0, 3, 6, -1);
    this.createAnimationOnce('reference-fighter-walk', 'reference-fighter', 4, 6, 10, -1);
    this.createAnimationOnce('reference-fighter-basic', 'reference-fighter', 7, 10, 15, 0);
    this.createAnimationOnce('reference-fighter-special', 'reference-fighter', 11, 13, 14, 0);
    this.createAnimationFromFramesOnce('reference-fighter-hit', 'reference-fighter', [11], 8, 0);
    this.createAnimationFromFramesOnce('reference-fighter-dead', 'reference-fighter', [11], 8, 0);
    this.createAnimationFromFramesOnce('reference-fighter-jump', 'reference-fighter', [14, 15], 10, 0);
    this.createAnimationFromFramesOnce('reference-fighter-fall', 'reference-fighter', [17], 10, 0);
    this.createAnimationFromFramesOnce('reference-fighter-landing', 'reference-fighter', [3], 8, 0);
    this.createAnimationFromFramesOnce('reference-fighter-air-bonk', 'reference-fighter', [14, 15, 16, 17], 13, 0);

    this.createAnimationOnce('discount-wizard-fx-fireball', 'discount-wizard-fx', 0, 3, 14, 0);
    this.createAnimationOnce('discount-wizard-fx-hit-puff', 'discount-wizard-fx', 4, 7, 14, 0);
    this.createAnimationOnce('discount-wizard-fx-miscast', 'discount-wizard-fx', 8, 11, 12, 0);
    this.createAnimationOnce('discount-wizard-ultimate-teleport', 'discount-wizard-ultimate-fx', 0, 3, 14, 0);
    this.createAnimationOnce('discount-wizard-ultimate-orb', 'discount-wizard-ultimate-fx', 4, 7, 12, -1);
    this.createAnimationOnce('discount-wizard-ultimate-impact', 'discount-wizard-ultimate-fx', 8, 11, 14, 0);
    this.createAnimationOnce('budget-barbarian-axe-fall', 'budget-barbarian-ultimate-fx', 0, 3, 16, 0);
    this.createAnimationOnce('budget-barbarian-axe-impact', 'budget-barbarian-ultimate-fx', 4, 7, 14, 0);
    this.createAnimationOnce('budget-barbarian-axe-stuck', 'budget-barbarian-ultimate-fx', 8, 11, 7, 0);
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

  private createAnimationFromFramesOnce(
    key: string,
    textureKey: string,
    frameNumbers: number[],
    frameRate: number,
    repeat: number,
  ): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: frameNumbers.map((frame) => ({ key: textureKey, frame })),
      frameRate,
      repeat,
    });
  }

  private createEnemyForCurrentMode(): Fighter | null {
    if (this.mode === 'test') {
      const trainingDummyDefinition = {
        ...fighterDefinitions.angry_pigeon,
        label: 'Training Dummy',
        moveSpeed: 0,
      };
      const dummy = new Fighter(this, trainingDummyDefinition, { x: 650, y: 340 });
      dummy.facing = 'left';
      return dummy;
    }

    if (this.mode === 'duel') {
      const enemy = new Fighter(this, fighterDefinitions[this.enemyFighterId], { x: 650, y: 330 });
      enemy.facing = 'left';
      return enemy;
    }

    return null;
  }

  private advanceWave(): void {
    if (this.mode !== 'waves') {
      return;
    }

    this.waveIndex += 1;
    this.updateWaveArenaBoundsForCurrentSection();
    this.projectileSystem.destroy();
    this.spawnedProjectileAttackInstances.clear();
    this.clearAxeRainStrikes();
    this.clearWaveEnemies();
    this.waveEnemies = this.createWaveEnemiesForCurrentSection();
    const waveStartX = this.arenaBounds.minX + 140;
    this.player.nudge(waveStartX - this.player.x, 0, this.arenaBounds);
    this.syncPrimaryEnemy();
    for (const enemy of this.waveEnemies) {
      enemy.setDebugVisible(this.debugEnabled);
      enemy.updateVisuals();
      enemy.setStatusNote('AI idle');
    }
    this.testDummyLastHp = this.enemy?.hp ?? 0;
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
    this.updateModeText();
    this.hud.update(this.player, this.getHudEnemy());
    this.showWaveSectionIntro();
  }

  private updateModeText(): void {
    const arenaLabel = this.getArenaLabel();

    if (this.mode === 'duel') {
      this.modeText.setText(`Duel | ${arenaLabel}`);
      return;
    }

    if (this.mode === 'test') {
      this.modeText.setText(`Test | ${arenaLabel}`);
      return;
    }

    const sectionTitle = this.waveStage.sections[this.waveIndex]?.title ?? `Wave ${this.waveIndex + 1}`;
    this.modeText.setText(`${this.waveStage.title} ${this.waveIndex + 1}/${this.waveStage.sections.length} | ${sectionTitle}`);
  }

  private renderArena(): void {
    if (this.mode === 'waves') {
      const backgroundKey = this.waveStage.backgroundKey;
      this.add.tileSprite(this.waveStage.worldWidth / 2, GAME_HEIGHT / 2, this.waveStage.worldWidth, GAME_HEIGHT, backgroundKey).setDepth(-100);
      this.add.rectangle(this.waveStage.worldWidth / 2, 230, this.waveStage.worldWidth - 120, 10, 0xffd08a, 0.12).setDepth(-90);
      this.add.rectangle(this.waveStage.worldWidth / 2, 468, this.waveStage.worldWidth - 120, 10, 0x0a0b0f, 0.22).setDepth(-90);
      return;
    }

    if (this.arenaId === 'park') {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'duel-park-background').setDepth(-100);
      this.add.rectangle(GAME_WIDTH / 2, 232, 820, 8, 0xf5f0d8, 0.16).setDepth(-90);
      this.add.rectangle(GAME_WIDTH / 2, 468, 820, 8, 0x141821, 0.18).setDepth(-90);
      return;
    }

    const backgroundKey = this.arenaId === 'rooftop' ? 'rooftop-background' : 'scrapyard-background';
    const laneColor = this.arenaId === 'rooftop' ? 0xcfe8ff : 0xffd08a;
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, backgroundKey).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-100);
    this.add.rectangle(GAME_WIDTH / 2, 230, 820, 10, laneColor, 0.12).setDepth(-90);
    this.add.rectangle(GAME_WIDTH / 2, 468, 820, 10, 0x0a0b0f, 0.22).setDepth(-90);
  }

  private getArenaLabel(): string {
    if (this.arenaId === 'park') {
      return 'Park';
    }

    if (this.arenaId === 'rooftop') {
      return 'Rooftop';
    }

    return 'Scrapyard';
  }

  private getWaveRuntimeSpawn(_section: StageSectionDefinition, spawn: StageEnemySpawnDefinition): { x: number; y: number } {
    return {
      x: spawn.spawnX,
      y: spawn.spawnY,
    };
  }

  private resetArenaBounds(): void {
    this.setArenaBounds(this.defaultArenaBounds);
  }

  private setArenaBounds(bounds: FighterBounds): void {
    this.arenaBounds.minX = bounds.minX;
    this.arenaBounds.maxX = bounds.maxX;
    this.arenaBounds.minY = bounds.minY;
    this.arenaBounds.maxY = bounds.maxY;
  }

  private updateWaveArenaBoundsForCurrentSection(): void {
    if (this.mode !== 'waves') {
      this.resetArenaBounds();
      return;
    }

    const section = this.waveStage.sections[this.waveIndex];
    if (!section) {
      this.resetArenaBounds();
      return;
    }

    this.setArenaBounds(section.bounds);
  }

  private showWaveSectionIntro(): void {
    if (this.mode !== 'waves') {
      return;
    }

    const section = this.waveStage.sections[this.waveIndex];
    if (!section) {
      return;
    }

    this.resultText.setText(`${this.waveStage.title}\n${section.title}`).setVisible(true);
    this.resultHintText.setText(this.describeSectionEncounter(section)).setVisible(true);
    this.time.delayedCall(850, () => {
      if (this.scene.isActive() && this.battleFlow.getResult() === 'running' && this.waveTransitionRemainingMs === 0) {
        this.resultText.setVisible(false);
        this.resultHintText.setVisible(false);
      }
    });
  }

  private describeSectionEncounter(section: StageSectionDefinition): string {
    const enemyCount = section.enemies.length;
    if (enemyCount <= 1) {
      return 'Single enemy encounter';
    }

    return `${enemyCount} enemy encounter`;
  }

  private createWaveEnemiesForCurrentSection(): Fighter[] {
    const section = this.waveStage.sections[this.waveIndex];

    if (!section) {
      return [];
    }

    return section.enemies.map((spawn, index) => {
      const runtimeSpawn = this.getWaveRuntimeSpawn(section, spawn);
      const waveDefinition = {
        ...fighterDefinitions[spawn.fighterId],
        label: section.enemies.length > 1 ? `${section.title} ${index + 1}` : section.title,
        maxHp: spawn.hpOverride ?? fighterDefinitions[spawn.fighterId].maxHp,
        moveSpeed: spawn.moveSpeedOverride ?? fighterDefinitions[spawn.fighterId].moveSpeed,
      };
      const enemy = new Fighter(this, waveDefinition, runtimeSpawn);
      enemy.facing = 'left';
      this.waveEnemyControllers.set(enemy.instanceId, new EnemyController());
      return enemy;
    });
  }

  private getPlayerSpawnPoint(): { x: number; y: number } {
    if (this.mode !== 'waves') {
      return { x: 280, y: 340 };
    }

    const section = this.waveStage.sections[this.waveIndex];
    if (!section) {
      return { x: 280, y: 340 };
    }

    return {
      x: section.bounds.minX + 140,
      y: Phaser.Math.Clamp(340, section.bounds.minY + 48, section.bounds.maxY - 48),
    };
  }

  private configureCameraForCurrentMode(): void {
    const camera = this.cameras.main;

    if (this.mode !== 'waves') {
      camera.stopFollow();
      camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
      camera.setScroll(0, 0);
      return;
    }

    camera.setBounds(0, 0, this.waveStage.worldWidth, GAME_HEIGHT);
    camera.setDeadzone(GAME_WIDTH * 0.28, GAME_HEIGHT * 0.42);
    camera.startFollow(this.player.container, true, 0.12, 0.1);
    camera.centerOn(this.player.x, GAME_HEIGHT / 2);
  }

  private clearWaveEnemies(): void {
    for (const enemy of this.waveEnemies) {
      enemy.destroy();
    }

    this.waveEnemies = [];
    this.waveEnemyControllers.clear();
  }

  private getCurrentEnemies(): Fighter[] {
    if (this.mode === 'waves') {
      return this.waveEnemies;
    }

    return this.enemy ? [this.enemy] : [];
  }

  private getLivingEnemies(): Fighter[] {
    return this.getCurrentEnemies().filter((enemy) => enemy.state !== 'dead');
  }

  private syncPrimaryEnemy(): void {
    this.enemy = this.getPreferredEnemyTarget() ?? this.getCurrentEnemies()[0] ?? null;
  }

  private getPreferredEnemyTarget(): Fighter | null {
    const livingEnemies = this.getLivingEnemies();

    if (livingEnemies.length === 0) {
      return null;
    }

    let closestEnemy = livingEnemies[0];
    let closestDistanceSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, closestEnemy.x, closestEnemy.y);

    for (let index = 1; index < livingEnemies.length; index += 1) {
      const candidate = livingEnemies[index];
      const distanceSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, candidate.x, candidate.y);

      if (distanceSq < closestDistanceSq) {
        closestEnemy = candidate;
        closestDistanceSq = distanceSq;
      }
    }

    return closestEnemy;
  }

  private getHudEnemy(): Fighter | null {
    return this.getPreferredEnemyTarget() ?? this.enemy;
  }

  private getControllerForEnemy(enemy: Fighter): EnemyController {
    if (this.mode !== 'waves') {
      return this.enemyController;
    }

    const controller = this.waveEnemyControllers.get(enemy.instanceId);

    if (controller) {
      return controller;
    }

    const createdController = new EnemyController();
    this.waveEnemyControllers.set(enemy.instanceId, createdController);
    return createdController;
  }

  private tryStartAttackWithFx(fighter: Fighter, kind: 'basic' | 'special' | 'ultimate'): void {
    const attackId =
      fighter.id === 'discount_wizard' && kind === 'special'
        ? Phaser.Math.RND.pick(['discount_fireball_cast', 'discount_miscast'])
        : undefined;
    const didStart = attackId ? fighter.tryStartAttackById(attackId, kind) : fighter.tryStartAttack(kind);

    if (!didStart) {
      return;
    }

    const attack = fighter.getCurrentAttack();

    if (!attack) {
      return;
    }

    if (attack.id === 'wombat_earthshaker') {
      this.spawnFx('wombat-earthshaker-fx', fighter.x, fighter.y - 178, fighter.y - 6, false, 1.72, 'wombat-earthshaker-fx');
      this.cameras.main.shake(150, 0.008);
      return;
    }

    if (attack.id === 'budget_axe_rain') {
      this.startBudgetBarbarianUltimate(fighter);
      this.cameras.main.shake(100, 0.005);
      return;
    }

    if (attack.id === 'buster_underbite_bulldozer') {
      this.startBusterBulldogUltimate(fighter);
      return;
    }

    if (fighter.id !== 'discount_wizard') {
      return;
    }

    if (attack.id === 'discount_fireball_cast') {
      this.spawnCastFx('discount-wizard-fx-fireball', fighter, 66, -52, 1.08);
      return;
    }

    if (attack.id === 'discount_miscast') {
      this.spawnCastFx('discount-wizard-fx-miscast', fighter, 42, -58, 1.18);
      return;
    }

    if (attack.id === 'discount_clearance_orb') {
      this.startDiscountWizardUltimate(fighter);
    }
  }

  private startDiscountWizardUltimate(fighter: Fighter): void {
    const target = fighter === this.player ? this.getPreferredEnemyTarget() : this.player;
    const startX = fighter.x;
    const startY = fighter.y;
    const safeMargin = 56;
    const visibleCenterX = this.mode === 'waves' ? this.cameras.main.worldView.centerX : GAME_WIDTH / 2;
    const targetX = target?.x ?? visibleCenterX;
    const destinationX = targetX < visibleCenterX ? this.arenaBounds.maxX - safeMargin : this.arenaBounds.minX + safeMargin;

    this.spawnFx('discount-wizard-ultimate-teleport', startX, startY - 70, startY + 14, false, 1.18, 'discount-wizard-ultimate-fx');
    fighter.nudge(destinationX - fighter.x, 0, this.arenaBounds);

    if (target) {
      fighter.faceTarget(target.x);
    } else {
      fighter.facing = fighter.x < visibleCenterX ? 'right' : 'left';
      fighter.updateVisuals();
    }

    this.spawnFx('discount-wizard-ultimate-teleport', fighter.x, fighter.y - 70, fighter.y + 14, false, 1.28, 'discount-wizard-ultimate-fx');
    this.cameras.main.shake(90, 0.004);
  }

  private startBudgetBarbarianUltimate(fighter: Fighter): void {
    const direction = fighter.facing === 'right' ? 1 : -1;
    const offsets = [78, 148, 218];

    for (let index = 0; index < offsets.length; index += 1) {
      const x = Phaser.Math.Clamp(fighter.x + offsets[index] * direction, this.arenaBounds.minX + 24, this.arenaBounds.maxX - 24);
      const y = Phaser.Math.Clamp(fighter.y + (index - 1) * 10, this.arenaBounds.minY + 12, this.arenaBounds.maxY - 12);
      const warning = this.add
        .ellipse(x, y - 8, 88, 34, 0xff3f1f, 0.16)
        .setStrokeStyle(2, 0xffd166, 0.72)
        .setDepth(y + 6);

      this.axeRainStrikes.push({
        owner: fighter,
        x,
        y,
        delayMs: 190 + index * 150,
        activeMs: 120,
        didImpact: false,
        warning,
        hitTargetInstanceIds: new Set<number>(),
      });
    }
  }

  private startBusterBulldogUltimate(fighter: Fighter): void {
    const direction = fighter.facing === 'right' ? 1 : -1;
    const dashDistance = 94;
    const startX = fighter.x;
    const targetX = Phaser.Math.Clamp(fighter.x + dashDistance * direction, this.arenaBounds.minX + 24, this.arenaBounds.maxX - 24);
    const actualDistance = targetX - fighter.x;

    fighter.nudge(actualDistance, 0, this.arenaBounds);
    this.cameras.main.shake(120, 0.006);

    for (let index = 0; index < 4; index += 1) {
      const progress = index / 3;
      const x = startX + actualDistance * progress - 18 * direction;
      const y = fighter.y + 6 + (index % 2) * 4;
      const dust = this.add
        .ellipse(x, y, 34 + index * 8, 14 + index * 2, 0xd8c2a2, 0.28 - index * 0.04)
        .setDepth(fighter.y - 2)
        .setRotation(direction * -0.12);

      this.tweens.add({
        targets: dust,
        alpha: 0,
        scaleX: 1.45,
        scaleY: 0.72,
        x: x - direction * (18 + index * 5),
        duration: 220 + index * 35,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      });
    }

    const ring = this.add
      .ellipse(fighter.x + 48 * direction, fighter.y - 44, 92, 52, 0xffe39a, 0.18)
      .setStrokeStyle(3, 0xffd166, 0.72)
      .setDepth(fighter.y + 16)
      .setRotation(direction * 0.08);

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.55,
      scaleY: 1.2,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private updateAxeRainStrikes(deltaMs: number): number {
    let highestDamage = 0;

    for (let index = this.axeRainStrikes.length - 1; index >= 0; index -= 1) {
      const strike = this.axeRainStrikes[index];
      strike.delayMs -= deltaMs;

      if (strike.delayMs > 0) {
        const pulse = 0.82 + Math.sin(this.time.now / 55) * 0.08;
        strike.warning.setScale(pulse, pulse);
        continue;
      }

      if (!strike.didImpact) {
        strike.didImpact = true;
        strike.warning.destroy();
        this.spawnAxeRainFx(strike.x, strike.y);
        this.cameras.main.shake(70, 0.004);
      }

      strike.activeMs -= deltaMs;
      highestDamage = Math.max(highestDamage, this.resolveAxeRainStrike(strike));

      if (strike.activeMs <= 0) {
        this.axeRainStrikes.splice(index, 1);
      }
    }

    return highestDamage;
  }

  private resolveAxeRainStrike(strike: AxeRainStrike): number {
    const hitbox: Rect = {
      x: strike.x - 48,
      y: strike.y - 82,
      width: 96,
      height: 96,
    };
    const targets = [this.player, ...this.getCurrentEnemies()];
    let highestDamage = 0;

    for (const target of targets) {
      if (target.instanceId === strike.owner.instanceId || target.state === 'dead' || strike.hitTargetInstanceIds.has(target.instanceId)) {
        continue;
      }

      const hurtbox = target.getHurtbox();

      if (!hurtbox || !intersectsRect(hitbox, hurtbox)) {
        continue;
      }

      strike.hitTargetInstanceIds.add(target.instanceId);
      target.receiveHit({
        damage: 13,
        hitstunMs: 300,
        knockbackX: 135,
        knockbackY: 58,
        sourceFacing: strike.owner.facing,
      });
      highestDamage = Math.max(highestDamage, 13);
    }

    return highestDamage;
  }

  private spawnAxeRainFx(x: number, y: number): void {
    const sprite = this.add
      .sprite(x, y - 168, 'budget-barbarian-ultimate-fx')
      .setOrigin(0.5)
      .setDepth(y + 18)
      .setScale(1.08);

    sprite.play('budget-barbarian-axe-fall');
    this.tweens.add({
      targets: sprite,
      y: y - 62,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        sprite.play('budget-barbarian-axe-impact');
        sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          sprite.play('budget-barbarian-axe-stuck');
          this.time.delayedCall(720, () => {
            sprite.destroy();
          });
        });
      },
    });
  }

  private clearAxeRainStrikes(): void {
    for (const strike of this.axeRainStrikes) {
      strike.warning.destroy();
    }

    this.axeRainStrikes.length = 0;
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

    if (attackId === 'discount_clearance_orb') {
      this.spawnFx('discount-wizard-ultimate-impact', target.x, target.y - 54, target.y + 10, false, 1.28, 'discount-wizard-ultimate-fx');
      return;
    }

    if (attackId === 'wombat_earthshaker') {
      this.spawnFx('wombat-earthshaker-fx', target.x, target.y - 130, target.y + 8, false, 1.35, 'wombat-earthshaker-fx');
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

  private spawnFx(
    animationKey: string,
    x: number,
    y: number,
    depth: number,
    flipX: boolean,
    scale: number,
    textureKey = 'discount-wizard-fx',
  ): void {
    const sprite = this.add.sprite(x, y, textureKey).setOrigin(0.5).setDepth(depth).setFlipX(flipX).setScale(scale);
    sprite.play(animationKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      sprite.destroy();
    });
  }
}
