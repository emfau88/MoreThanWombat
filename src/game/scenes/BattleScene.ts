import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig';
import { EnemyController, type EnemyIntent } from '../ai/EnemyController';
import { getEnemyRoleContract } from '../ai/EnemyRoles';
import { CombatFeedbackController, type CombatImpact } from '../combat/CombatFeedbackController';
import { CombatImpactOrchestrator } from '../combat/CombatImpactOrchestrator';
import { CombatPresentationController } from '../combat/CombatPresentationController';
import { Fighter, type FighterBounds } from '../combat/Fighter';
import { HitboxSystem, type HitResolution } from '../combat/HitboxSystem';
import { InputBuffer } from '../combat/InputBuffer';
import { ProjectileSystem } from '../combat/ProjectileSystem';
import { PushboxSystem } from '../combat/PushboxSystem';
import type { BattleMode, BattleSceneData, FighterId } from '../core/BattleModes';
import { BattleFlowController } from '../core/BattleFlowController';
import {
  EncounterDirector,
  type EncounterDirectorEvent,
} from '../core/EncounterDirector';
import { InputController } from '../core/InputController';
import { MobileControls } from '../core/MobileControls';
import { registerCharacterAnimations } from '../core/CharacterAnimationRegistry';
import { FLAT_ARENA_VISUAL_CONTRACT } from '../core/StageVisuals';
import type { ArenaId } from '../data/arenas';
import { attacksById } from '../data/attacks';
import { fighterDefinitions } from '../data/fighters';
import { projectilesById } from '../data/projectiles';
import { defaultWaveStageId, waveStages, type StageDefinition, type StageSectionDefinition, type StageEnemySpawnDefinition, type WaveStageId } from '../data/stages';
import { canEnterNextWaveSection, getWaveTraversalBounds, type WaveTraversalPhase } from '../core/WaveTraversal';
import { findSafeWaveSpawn, isWaveActorVisible } from '../core/WaveSafety';
import { Hud } from '../ui/Hud';
import { CombatGymController } from '../debug/CombatGymController';
import {
  COMBAT_GYM_DUMMY_MODES,
  COMBAT_GYM_DUMMY_SIDES,
  COMBAT_GYM_LANE_GAPS,
  COMBAT_GYM_MANA_RATIOS,
  COMBAT_GYM_RANGES,
  createDefaultCombatGymSettings,
  getSelectedCombatGymMove,
  normalizeCombatGymSettings,
  type CombatGymSettings,
} from '../debug/CombatGymModel';

export class BattleScene extends Phaser.Scene {
  private readonly defaultArenaBounds: FighterBounds = { ...FLAT_ARENA_VISUAL_CONTRACT.combatBounds };
  private arenaBounds: FighterBounds = { ...FLAT_ARENA_VISUAL_CONTRACT.combatBounds };
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
  private readonly arenaVisuals: Phaser.GameObjects.GameObject[] = [];
  private debugEnabled = false;
  private hitboxSystem!: HitboxSystem;
  private projectileSystem!: ProjectileSystem;
  private pushboxSystem!: PushboxSystem;
  private enemyController!: EnemyController;
  private readonly waveEnemyControllers = new Map<number, EnemyController>();
  private battleFlow!: BattleFlowController;
  private combatFeedback!: CombatFeedbackController;
  private combatPresentation!: CombatPresentationController;
  private combatImpact!: CombatImpactOrchestrator;
  private readonly inputBuffer = new InputBuffer(150);
  private combatGym: CombatGymController | null = null;
  private combatGymSettings: CombatGymSettings | null = null;
  private gymMoveRequested = false;
  private gymAirAttackPending = false;
  private gymDummyAttackCooldownMs = 0;
  private mode: BattleMode = 'duel';
  private playerFighterId: FighterId = 'wombat';
  private enemyFighterId: FighterId = 'angry_pigeon';
  private arenaId: ArenaId = 'park';
  private waveStageId: WaveStageId = defaultWaveStageId;
  private waveStage!: StageDefinition;
  private waveIndex = 0;
  private waveTraversalPhase: WaveTraversalPhase = 'combat';
  private encounterDirector: EncounterDirector | null = null;
  private testDummyRegenDelayMs = 0;
  private testDummyLastHp = 0;
  private readonly spawnedProjectileAttackInstances = new Set<string>();

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

    if (this.mode === 'test') {
      this.combatGymSettings = normalizeCombatGymSettings(
        data.combatGym ?? createDefaultCombatGymSettings(this.playerFighterId, this.enemyFighterId),
      );
      this.playerFighterId = this.combatGymSettings.playerId;
      this.enemyFighterId = this.combatGymSettings.dummyId;
    } else {
      this.combatGymSettings = null;
    }
  }

  create(): void {
    this.debugEnabled = false;
    this.inputBuffer.clear();
    this.combatGym = null;
    this.gymMoveRequested = false;
    this.gymAirAttackPending = false;
    this.gymDummyAttackCooldownMs = 0;
    this.waveIndex = 0;
    this.waveTraversalPhase = 'combat';
    this.encounterDirector = this.mode === 'waves'
      ? new EncounterDirector({
        sectionCount: this.waveStage.sections.length,
        pressureProfiles: this.waveStage.sections.map((section) => section.pressureBudget),
      })
      : null;
    this.testDummyRegenDelayMs = 0;
    this.testDummyLastHp = 0;
    this.spawnedProjectileAttackInstances.clear();
    this.clearWaveEnemies();
    this.resetArenaBounds();
    this.updateWaveArenaBoundsForCurrentSection();
    this.hitboxSystem = new HitboxSystem();
    this.projectileSystem = new ProjectileSystem(this);
    this.pushboxSystem = new PushboxSystem();
    this.enemyController = new EnemyController();
    this.battleFlow = new BattleFlowController();
    this.combatFeedback = new CombatFeedbackController(this.cameras.main);
    this.combatPresentation = new CombatPresentationController(this, {
      getArenaBounds: () => this.arenaBounds,
      getCurrentTargets: () => [this.player, ...this.getCurrentEnemies()],
      getTargetFor: (fighter) => fighter === this.player ? this.getPreferredEnemyTarget() : this.player,
      getVisibleCenterX: () => this.mode === 'waves' ? this.cameras.main.worldView.centerX : this.getViewportWidth() / 2,
      getShakeScale: () => this.combatFeedback.getAccessibilityScale(),
    });
    this.combatImpact = new CombatImpactOrchestrator(this, this.combatFeedback, this.combatPresentation);
    registerCharacterAnimations(this);
    this.renderArena();
    this.instructionText = this.add.text(32, 28, 'WASD/Arrows move, J/Space jab, K/Shift special, U ultimate slot, L jump, H debug, R restart', {
      color: '#c9d6df',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
    });
    this.modeText = this.add.text(this.getViewportWidth() - 28, 28, '', {
      color: '#f5f0d8',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '16px',
      align: 'right',
    }).setOrigin(1, 0.5);
    this.debugToggleButton = this.add
      .rectangle(this.getViewportWidth() / 2, 84, 124, 30, 0x223042, 0.94)
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
      .text(this.getViewportWidth() / 2, 84, '', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setDepth(2101)
      .setScrollFactor(0)
      .setVisible(false);
    this.resultText = this.add
      .text(this.getViewportWidth() / 2, 112, '', {
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
        if (this.battleFlow.getResult() !== 'running') this.restartBattle();
      });
    this.resultHintText = this.add
      .text(this.getViewportWidth() / 2, 170, '', {
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
        if (this.battleFlow.getResult() !== 'running') this.goToMenu();
    });
    this.inputController = new InputController(this);
    this.mobileControls = new MobileControls(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleViewportResize, this);
      this.clearWaveEnemies();
      this.clearArenaVisuals();
      this.mobileControls.destroy();
      this.projectileSystem.destroy();
      this.combatPresentation.destroy();
      this.combatGym?.destroy();
    });
    this.player = new Fighter(this, fighterDefinitions[this.playerFighterId], this.getPlayerSpawnPoint(), 'player');
    this.enemy = null;
    if (this.mode === 'waves') {
      this.waveEnemies = [];
      this.syncPrimaryEnemy();
    } else {
      this.enemy = this.createEnemyForCurrentMode();
    }
    this.testDummyLastHp = this.enemy?.hp ?? 0;
    this.applyCombatGymFighterSettings();
    this.player.setDebugVisible(this.debugEnabled);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.setDebugVisible(this.debugEnabled);
      enemy.updateVisuals();
    }
    this.instructionText.setVisible(this.debugEnabled && this.mode !== 'test');
    this.syncDebugToggleUi();
    this.hud = new Hud(this, this.getViewportWidth());
    this.configureCameraForCurrentMode();
    this.updateModeText();
    this.updateCombatHud();
    this.createCombatGymIfNeeded();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleViewportResize, this);
    if (this.mode === 'waves') {
      this.showWaveSectionIntro();
    }
  }

  update(_time: number, delta: number): void {
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

    this.combatGym?.update(this.player, this.enemy, this.combatFeedback, this.debugEnabled);
    this.inputBuffer.capture(inputState);
    const clockStep = this.combatGym?.clock.consume(delta) ?? { shouldAdvance: true, deltaMs: delta };

    if (!clockStep.shouldAdvance) {
      this.renderFrozenFrame();
      return;
    }

    const simulationDeltaMs = this.mode === 'waves' ? Math.min(50, clockStep.deltaMs) : clockStep.deltaMs;
    const deltaSeconds = simulationDeltaMs / 1000;
    const wasHitstopActive = this.combatFeedback.isHitstopActive();
    this.inputBuffer.advance(simulationDeltaMs, wasHitstopActive);
    this.combatFeedback.advance(simulationDeltaMs);
    this.player.advancePresentation(simulationDeltaMs);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.advancePresentation(simulationDeltaMs);
    }
    this.combatPresentation.advancePresentation(simulationDeltaMs);

    if (this.shouldAllowDuelVictoryFreeRoam()) {
      this.updateDuelVictoryFreeRoam(
        deltaSeconds,
        inputState.moveX,
        inputState.moveY,
        this.inputBuffer.has('jump'),
        this.inputBuffer.has('attack'),
        this.inputBuffer.has('ultimate'),
      );
      this.inputBuffer.clear();
      return;
    }

    if (this.battleFlow.getResult() !== 'running') {
      return;
    }

    if (this.mode === 'waves') {
      // Defeat wins even if the final enemy dies in the same simulation step.
      if (this.player.state === 'dead') {
        this.updateBattleResult();
        return;
      }
      if (wasHitstopActive) {
        this.renderFrozenFrame();
        return;
      }
      const previousPhase = this.encounterDirector?.getPhase();
      this.advanceWaveDirector(simulationDeltaMs);

      if (this.battleFlow.getResult() !== 'running') {
        return;
      }

      const wavePhase = this.encounterDirector?.getPhase();
      if (previousPhase !== wavePhase) {
        this.inputBuffer.clear();
        this.renderFrozenFrame();
        return;
      }
      if (wavePhase === 'travel') {
        this.updateWaveTravel(deltaSeconds, inputState.moveX, inputState.moveY);
        return;
      }

      if (wavePhase && wavePhase !== 'active') {
        this.updateWaveNonCombatPhase(deltaSeconds, inputState.moveX, inputState.moveY);
        return;
      }
    }

    if (wasHitstopActive) {
      this.renderFrozenFrame();
      return;
    }

    const targetEnemy = this.getPreferredEnemyTarget();

    if (this.gymMoveRequested) {
      this.gymMoveRequested = false;
      this.tryStartSelectedCombatGymMove();
    }

    if (this.gymAirAttackPending && !this.player.isGrounded) {
      this.gymAirAttackPending = !this.player.tryStartAirAttack();
    }

    if (this.inputBuffer.has('jump') && this.player.tryStartJump()) {
      this.inputBuffer.consume('jump');
    }

    if (this.inputBuffer.has('attack')) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      const didStart = !this.player.isGrounded
        ? this.player.tryStartAirAttack()
        : this.tryStartAttackWithFx(this.player, 'basic');
      if (didStart) {
        this.inputBuffer.consume('attack');
      }
    }

    if (this.inputBuffer.has('special')) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      if (this.tryStartAttackWithFx(this.player, 'special')) {
        this.inputBuffer.consume('special');
      }
    }

    if (this.inputBuffer.has('ultimate')) {
      if (targetEnemy) {
        this.player.faceTarget(targetEnemy.x);
      }
      if (this.tryStartAttackWithFx(this.player, 'ultimate')) {
        this.inputBuffer.consume('ultimate');
      }
    }

    this.reconcileWaveAttackTokens();
    const enemyIntents = new Map<number, EnemyIntent>();
    for (const enemy of this.getCurrentEnemies()) {
      const controller = this.getControllerForEnemy(enemy);
      const enemyIntent = this.mode === 'test'
        ? this.getCombatGymDummyIntent(enemy, simulationDeltaMs)
        : controller.update(
          enemy,
          this.player,
          deltaSeconds,
          (attackKind) => this.requestEnemyAttack(enemy, attackKind, controller),
        );
      enemyIntents.set(enemy.instanceId, enemyIntent);
      const dummyMode = this.combatGymSettings
        ? COMBAT_GYM_DUMMY_MODES[this.combatGymSettings.dummyModeIndex]
        : null;
      enemy.setStatusNote(dummyMode ? `GYM ${dummyMode}` : `AI ${enemyIntent.state}`);
      if (this.mode === 'waves') {
        enemy.setCombatResponse(controller.getCombatResponse(enemy));
        this.applyEnemyRolePresentation(enemy, controller);
      }
      enemy.faceTarget(this.player.x);

      if (enemyIntent.attackPressed) {
        const didStart = enemyIntent.attackId
          ? this.tryStartAttackByIdWithFx(enemy, enemyIntent.attackId, enemyIntent.attackKind)
          : this.tryStartAttackWithFx(enemy, enemyIntent.attackKind);
        if (!didStart && this.mode === 'waves') {
          this.encounterDirector?.releaseAttack(enemy.instanceId);
        }
      }
    }

    const allowManaRegen = this.shouldAllowManaRegen();
    this.player.update(deltaSeconds, inputState.moveX, inputState.moveY, this.arenaBounds, { allowManaRegen });

    for (const enemy of this.getCurrentEnemies()) {
      const enemyIntent = enemyIntents.get(enemy.instanceId);
      if (enemyIntent) {
        enemy.update(deltaSeconds, enemyIntent.moveX, enemyIntent.moveY, this.arenaBounds, { allowManaRegen });
      } else if (this.mode === 'test') {
        enemy.update(deltaSeconds, 0, 0, this.arenaBounds, { allowManaRegen });
      }
    }

    this.spawnAttackProjectiles(this.player);

    for (const enemy of this.getCurrentEnemies()) {
      this.spawnAttackProjectiles(enemy);
    }

    const pushboxActors = [this.player, ...this.getCurrentEnemies()];
    for (let actorIndex = 0; actorIndex < pushboxActors.length; actorIndex += 1) {
      for (let otherIndex = actorIndex + 1; otherIndex < pushboxActors.length; otherIndex += 1) {
        this.pushboxSystem.resolve(pushboxActors[actorIndex], pushboxActors[otherIndex], this.arenaBounds);
      }
    }

    const impacts: CombatImpact[] = [];

    for (const enemy of this.getCurrentEnemies()) {
      const playerHitAttempt = this.hitboxSystem.resolveHit(this.player, enemy);
      if (playerHitAttempt.didConnect) {
        impacts.push(this.createCombatImpact(playerHitAttempt));
      }

      if (this.mode === 'waves' && !this.isEnemyVisibleForAttack(enemy)) enemy.cancelAttack();
      const enemyHitAttempt = this.hitboxSystem.resolveHit(enemy, this.player);
      if (enemyHitAttempt.didConnect) {
        impacts.push(this.createCombatImpact(enemyHitAttempt));
      }
    }

    const projectileHits = this.projectileSystem.update(deltaSeconds, [this.player, ...this.getCurrentEnemies()], this.arenaBounds,
      this.mode === 'waves' ? this.cameras.main.worldView : undefined);
    for (const projectileHit of projectileHits) {
      impacts.push({
        damage: projectileHit.damage,
        attackId: projectileHit.sourceAttackId,
        outcome: projectileHit.outcome,
        timeline: attacksById[projectileHit.sourceAttackId]?.timeline,
        contactX: projectileHit.x,
        contactY: projectileHit.y,
        attacker: projectileHit.attacker,
        defender: projectileHit.target,
      });
    }
    impacts.push(...this.combatPresentation.update(simulationDeltaMs));
    this.updateTestDummyRegen(simulationDeltaMs);
    this.handleEnemyRoleImpacts(impacts);
    this.combatImpact.apply(impacts);
    this.reconcileWaveAttackTokens();
    this.syncPrimaryEnemy();
    this.updateCombatHud();

    if ((this.mode === 'waves' || this.getCurrentEnemies().length > 0) && this.mode !== 'test') {
      this.updateBattleResult();
    }
  }

  private updateBattleResult(): void {
    const currentEnemies = this.getCurrentEnemies();
    if (currentEnemies.length === 0 && this.player.state !== 'dead') {
      return;
    }

    const playerDefeated = this.player.state === 'dead';
    let battleWon = false;
    const allEnemiesDefeated = currentEnemies.every((enemy) => enemy.state === 'dead');

    if (this.mode === 'duel') {
      battleWon = allEnemiesDefeated;
    } else if (this.mode === 'waves') {
      // The EncounterDirector owns Wave clear, travel, transition, and victory.
      battleWon = false;
    }

    const result = this.battleFlow.update(playerDefeated, battleWon);

    if (result === 'running') {
      return;
    }

    if (this.mode === 'waves') {
      this.encounterDirector?.finishDefeat();
      this.clearWaveCombatArtifacts();
      this.clearWaveEnemies();
      this.syncPrimaryEnemy();
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
    this.updateCombatHud();
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
      combatGym: this.combatGymSettings ?? undefined,
    });
  }

  private restartCombatGym(settings: CombatGymSettings): void {
    this.combatGymSettings = normalizeCombatGymSettings(settings);
    this.playerFighterId = this.combatGymSettings.playerId;
    this.enemyFighterId = this.combatGymSettings.dummyId;
    this.restartBattle();
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
    this.instructionText.setVisible(this.debugEnabled && this.mode !== 'test');
    this.syncDebugToggleUi();
  }

  private syncDebugToggleUi(): void {
    if (!this.debugToggleButton || !this.debugToggleLabel) {
      return;
    }

    this.debugToggleButton.setFillStyle(this.debugEnabled ? 0x34526b : 0x223042, this.debugEnabled ? 0.98 : 0.94);
    this.debugToggleLabel.setText(`Debug: ${this.debugEnabled ? 'On' : 'Off'}`);
  }

  private renderFrozenFrame(): void {
    this.player.updateVisuals();
    for (const enemy of this.getCurrentEnemies()) {
      enemy.updateVisuals();
    }
    this.updateCombatHud();
  }

  private createCombatImpact(hit: HitResolution): CombatImpact {
    const attack = hit.attackId ? attacksById[hit.attackId] : undefined;
    return {
      damage: hit.damage,
      attackId: hit.attackId,
      outcome: hit.outcome,
      timeline: attack?.timeline,
      contactX: hit.contactX,
      contactY: hit.contactY,
      attacker: hit.attacker,
      defender: hit.defender,
    };
  }

  private createEnemyForCurrentMode(): Fighter | null {
    if (this.mode === 'test') {
      const settings = this.combatGymSettings
        ?? createDefaultCombatGymSettings(this.playerFighterId, this.enemyFighterId);
      const playerSpawn = this.getPlayerSpawnPoint();
      const range = COMBAT_GYM_RANGES[settings.rangeIndex];
      const laneGap = COMBAT_GYM_LANE_GAPS[settings.laneIndex];
      const dummySide = COMBAT_GYM_DUMMY_SIDES[settings.dummySideIndex];
      const direction = dummySide === 'left' ? -1 : 1;
      const sourceDefinition = fighterDefinitions[settings.dummyId];
      const trainingDummyDefinition = {
        ...sourceDefinition,
        label: `Training ${sourceDefinition.label}`,
        moveSpeed: 0,
      };
      const dummy = new Fighter(this, trainingDummyDefinition, {
        x: Phaser.Math.Clamp(playerSpawn.x + range * direction, this.arenaBounds.minX, this.arenaBounds.maxX),
        y: Phaser.Math.Clamp(playerSpawn.y + laneGap, this.arenaBounds.minY, this.arenaBounds.maxY),
      }, 'enemy');
      dummy.facing = direction === 1 ? 'left' : 'right';
      return dummy;
    }

    if (this.mode === 'duel') {
      const enemy = new Fighter(this, fighterDefinitions[this.enemyFighterId], { x: 650, y: 330 }, 'enemy');
      enemy.facing = 'left';
      return enemy;
    }

    return null;
  }

  private applyCombatGymFighterSettings(): void {
    if (this.mode !== 'test' || !this.combatGymSettings) {
      return;
    }

    const manaRatio = COMBAT_GYM_MANA_RATIOS[this.combatGymSettings.manaIndex];
    const dummyMode = COMBAT_GYM_DUMMY_MODES[this.combatGymSettings.dummyModeIndex];
    this.player.setManaForDebug(this.player.maxMana * manaRatio);
    this.player.setCombatResponse('normal');
    this.enemy?.setCombatResponse(
      dummyMode === 'guard'
        ? 'guard'
        : dummyMode === 'armor'
          ? 'armor'
          : dummyMode === 'invulnerable'
            ? 'invulnerable'
            : 'normal',
    );
  }

  private createCombatGymIfNeeded(): void {
    if (this.mode !== 'test' || !this.combatGymSettings) {
      return;
    }

    this.combatGym = new CombatGymController(this, this.combatGymSettings, {
      onSettingsChanged: (settings) => this.restartCombatGym(settings),
      onFireMove: () => {
        this.gymMoveRequested = true;
      },
      onReset: () => this.restartBattle(),
      onToggleDebug: () => this.toggleDebug(),
      onCycleShakeMode: () => this.combatFeedback.cycleShakeMode(),
      onCycleVfxLabRecipe: () => this.combatPresentation.cycleVfxLabRecipe(),
      getVfxLabRecipe: () => this.combatPresentation.getVfxLabRecipeId(),
      onCycleVfxQuality: () => this.combatPresentation.cycleVfxQuality(),
      getVfxQuality: () => this.combatPresentation.getVfxQuality(),
      getVfxDiagnostics: () => this.combatPresentation.getVfxDiagnostics(),
    });
  }

  private getCombatGymDummyIntent(enemy: Fighter, deltaMs: number): EnemyIntent {
    const dummyMode = this.combatGymSettings
      ? COMBAT_GYM_DUMMY_MODES[this.combatGymSettings.dummyModeIndex]
      : 'idle';
    const idleIntent: EnemyIntent = {
      moveX: 0,
      moveY: 0,
      attackPressed: false,
      attackKind: 'basic',
      state: enemy.getCurrentAttack() ? 'attack' : 'idle',
    };

    if (dummyMode !== 'attack-loop' || enemy.state === 'dead' || enemy.getCurrentAttack()) {
      return idleIntent;
    }

    this.gymDummyAttackCooldownMs = Math.max(0, this.gymDummyAttackCooldownMs - deltaMs);
    if (this.gymDummyAttackCooldownMs > 0) {
      return { ...idleIntent, state: 'recover' };
    }

    this.gymDummyAttackCooldownMs = 900;
    return { ...idleIntent, attackPressed: true, state: 'attack' };
  }

  private advanceWave(): void {
    if (this.mode !== 'waves' || !this.encounterDirector) {
      return;
    }

    this.waveIndex = this.encounterDirector.getSectionIndex();
    this.waveTraversalPhase = 'combat';
    this.updateWaveArenaBoundsForCurrentSection();
    this.clearWaveCombatArtifacts();
    this.player.nudge(0, 0, this.arenaBounds);
    this.syncPrimaryEnemy();
    this.testDummyLastHp = this.enemy?.hp ?? 0;
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
    this.updateModeText();
    this.updateCombatHud();
  }

  private advanceWaveDirector(deltaMs: number): void {
    const director = this.encounterDirector;
    if (!director) {
      return;
    }

    const allSpawnedEnemiesDefeated = this.waveEnemies.length > 0
      && this.waveEnemies.every((enemy) => enemy.state === 'dead');
    const events = director.advance(deltaMs, allSpawnedEnemiesDefeated);
    for (const event of events) {
      this.handleEncounterDirectorEvent(event);
    }
  }

  private handleEncounterDirectorEvent(event: EncounterDirectorEvent): void {
    if (event.type === 'spawning') {
      this.clearWaveEnemies();
      this.waveEnemies = this.createWaveEnemiesForCurrentSection();
      this.syncPrimaryEnemy();
      for (const enemy of this.waveEnemies) {
        enemy.setDebugVisible(this.debugEnabled);
        enemy.updateVisuals();
      }
      this.resultText.setText('Enemies entering').setVisible(true);
      this.resultHintText.setText('Get ready').setVisible(true);
      this.updateModeText();
      this.updateCombatHud();
      return;
    }

    if (event.type === 'active') {
      for (const enemy of this.waveEnemies) {
        const controller = this.getControllerForEnemy(enemy);
        enemy.setCombatResponse(controller.getCombatResponse(enemy));
        this.applyEnemyRolePresentation(enemy, controller);
        enemy.setStatusNote('AI idle');
      }
      this.resultText.setVisible(false);
      this.resultHintText.setVisible(false);
      this.updateModeText();
      this.updateCombatHud();
      return;
    }

    if (event.type === 'clear_delay') {
      this.clearWaveCombatArtifacts();
      this.resultText.setText('Section Clear').setVisible(true);
      this.resultHintText.setText('Path unlocks shortly').setVisible(true);
      this.updateModeText();
      return;
    }

    if (event.type === 'travel') {
      this.beginWaveTravel();
      return;
    }

    if (event.type === 'next_section') {
      this.advanceWave();
      return;
    }

    if (event.type === 'section_intro') {
      this.showWaveSectionIntro();
      this.updateModeText();
      return;
    }

    if (event.type === 'victory') {
      this.resolveWaveVictory();
    }
  }

  private updateWaveNonCombatPhase(deltaSeconds: number, moveX: number, moveY: number): void {
    const phase = this.encounterDirector?.getPhase();
    this.inputBuffer.clear();

    if (phase === 'transition' || phase === 'section_intro' || phase === 'spawning') {
      this.renderFrozenFrame();
      return;
    }

    this.player.update(deltaSeconds, moveX, moveY, this.arenaBounds, { allowManaRegen: false });
    for (const enemy of this.waveEnemies) {
      enemy.update(deltaSeconds, 0, 0, this.arenaBounds, { allowManaRegen: false });
    }
    this.updateCombatHud();
  }

  private requestEnemyAttack(
    enemy: Fighter,
    kind: 'basic' | 'special',
    controller = this.getControllerForEnemy(enemy),
  ): boolean {
    if (this.mode !== 'waves') {
      return true;
    }

    if (!this.encounterDirector || !enemy.canStartAttack(kind) || !this.isEnemyVisibleForAttack(enemy)) {
      return false;
    }

    const channel = controller.getPressureChannel(kind, enemy);
    return this.encounterDirector.requestAttack(enemy.instanceId, channel);
  }

  private handleEnemyRoleImpacts(impacts: CombatImpact[]): void {
    if (this.mode !== 'waves') return;

    for (const impact of impacts) {
      const attacker = impact.attacker;
      if (attacker?.faction === 'enemy' && impact.outcome && impact.outcome !== 'miss') {
        this.waveEnemyControllers.get(attacker.instanceId)?.notifyAttackConnected();
      }

      const defender = impact.defender;
      if (defender?.faction !== 'enemy' || impact.outcome !== 'armored') continue;
      const controller = this.waveEnemyControllers.get(defender.instanceId);
      if (!controller?.notifyArmoredContact(defender)) continue;
      defender.cancelAttack();
      defender.setCombatResponse(controller.getCombatResponse(defender));
      this.projectileSystem.removeByOwner(defender.instanceId);
      this.encounterDirector?.releaseAttack(defender.instanceId);
      this.applyEnemyRolePresentation(defender, controller);
    }
  }

  private applyEnemyRolePresentation(enemy: Fighter, controller: EnemyController): void {
    const presentation = controller.getPresentation(enemy);
    enemy.setRolePresentation(presentation.cue, presentation.tint);
  }

  private isEnemyVisibleForAttack(enemy: Fighter): boolean {
    return isWaveActorVisible(enemy, this.cameras.main.worldView);
  }

  private reconcileWaveAttackTokens(): void {
    if (this.mode !== 'waves' || !this.encounterDirector) {
      return;
    }

    for (const enemy of this.waveEnemies) {
      if (enemy.state === 'dead' || enemy.state === 'hitstun') {
        this.projectileSystem.removeByOwner(enemy.instanceId);
      }
      if (!this.isEnemyVisibleForAttack(enemy)) enemy.cancelAttack();
    }
    const activeEnemyInstanceIds = new Set([
      ...this.projectileSystem.getActiveOwnerIds(),
      ...this.waveEnemies
        .filter((enemy) => enemy.state !== 'dead' && (enemy.getAttackPhase() === 'startup' || enemy.getAttackPhase() === 'active'))
        .map((enemy) => enemy.instanceId),
    ]);
    this.encounterDirector.reconcileAttackTokens(activeEnemyInstanceIds);
  }

  private shouldAllowManaRegen(): boolean {
    return this.mode !== 'waves' || this.encounterDirector?.canRegenerateMana() === true;
  }

  private clearWaveCombatArtifacts(): void {
    this.player.cancelAttack();
    this.encounterDirector?.releaseAllTokens();
    this.projectileSystem.destroy();
    this.spawnedProjectileAttackInstances.clear();
    this.combatPresentation.clearTransientEffects();
  }

  private resolveWaveVictory(): void {
    const result = this.battleFlow.update(false, true);
    if (result === 'running') {
      return;
    }

    this.encounterDirector?.releaseAllTokens();
    this.clearWaveCombatArtifacts();
    this.clearWaveEnemies();
    this.syncPrimaryEnemy();
    this.resultText.setText('Victory\nPress R to restart').setVisible(true);
    this.resultHintText.setText('Press M for menu').setVisible(true);
    this.updateCombatHud();
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

    const sectionTitle = this.waveTraversalPhase === 'travel'
      ? `Path to ${this.waveStage.sections[this.waveIndex + 1]?.title ?? 'exit'}`
      : this.waveStage.sections[this.waveIndex]?.title ?? `Wave ${this.waveIndex + 1}`;
    const debugText = this.debugEnabled && this.encounterDirector
      ? `\n${this.encounterDirector.getDebugLabel()}`
      : '';
    this.modeText.setText(`${this.waveStage.title} ${this.waveIndex + 1}/${this.waveStage.sections.length} | ${sectionTitle}${debugText}`);
  }

  private renderArena(): void {
    this.clearArenaVisuals();

    if (this.mode === 'waves') {
      for (const zone of this.waveStage.zones) {
        this.trackArenaVisual(this.add
          .image((zone.minX + zone.maxX) / 2, GAME_HEIGHT / 2, zone.backgroundKey)
          .setDisplaySize(zone.maxX - zone.minX, GAME_HEIGHT)
          .setDepth(-100));
      }
      for (let index = 0; index < this.waveStage.zones.length - 1; index += 1) {
        const currentZone = this.waveStage.zones[index];
        const nextZone = this.waveStage.zones[index + 1];
        const boundary = currentZone.maxX;
        this.trackArenaVisual(this.add.rectangle(boundary, GAME_HEIGHT / 2, 92, GAME_HEIGHT, 0x07101b, 0.3).setDepth(-96));
        this.trackArenaVisual(this.add.rectangle(boundary - 38, GAME_HEIGHT / 2, 5, GAME_HEIGHT, currentZone.transitionColor, 0.42).setDepth(-95));
        this.trackArenaVisual(this.add.rectangle(boundary + 38, GAME_HEIGHT / 2, 5, GAME_HEIGHT, nextZone.transitionColor, 0.42).setDepth(-95));
        this.trackArenaVisual(this.add.rectangle(boundary, 230, 72, 10, 0xf5f0d8, 0.12).setDepth(-94));
        this.trackArenaVisual(this.add.rectangle(boundary, 468, 72, 10, 0x10151e, 0.3).setDepth(-94));
      }
      this.trackArenaVisual(this.add.rectangle(this.waveStage.worldWidth / 2, 230, this.waveStage.worldWidth - 120, 10, 0xffd08a, 0.12).setDepth(-90));
      this.trackArenaVisual(this.add.rectangle(this.waveStage.worldWidth / 2, 468, this.waveStage.worldWidth - 120, 10, 0x0a0b0f, 0.22).setDepth(-90));
      return;
    }

    if (this.arenaId === 'park') {
      this.trackArenaVisual(this.add.image(this.getViewportWidth() / 2, GAME_HEIGHT / 2, 'duel-park-background').setDisplaySize(this.getViewportWidth(), GAME_HEIGHT).setDepth(-100));
      this.trackArenaVisual(this.add.rectangle(this.getViewportWidth() / 2, 232, this.getViewportWidth() - 140, 8, 0xf5f0d8, 0.16).setDepth(-90));
      this.trackArenaVisual(this.add.rectangle(this.getViewportWidth() / 2, 468, this.getViewportWidth() - 140, 8, 0x141821, 0.18).setDepth(-90));
      return;
    }

    const backgroundKey = this.arenaId === 'rooftop' ? 'rooftop-background' : 'scrapyard-background';
    const laneColor = this.arenaId === 'rooftop' ? 0xcfe8ff : 0xffd08a;
    this.trackArenaVisual(this.add.image(this.getViewportWidth() / 2, GAME_HEIGHT / 2, backgroundKey).setDisplaySize(this.getViewportWidth(), GAME_HEIGHT).setDepth(-100));
    this.trackArenaVisual(this.add.rectangle(this.getViewportWidth() / 2, 230, this.getViewportWidth() - 140, 10, laneColor, 0.12).setDepth(-90));
    this.trackArenaVisual(this.add.rectangle(this.getViewportWidth() / 2, 468, this.getViewportWidth() - 140, 10, 0x0a0b0f, 0.22).setDepth(-90));
  }

  private trackArenaVisual<T extends Phaser.GameObjects.GameObject>(visual: T): T {
    this.arenaVisuals.push(visual);
    return visual;
  }

  private clearArenaVisuals(): void {
    for (const visual of this.arenaVisuals) {
      visual.destroy();
    }
    this.arenaVisuals.length = 0;
  }

  private handleViewportResize(): void {
    if (!this.player || !this.hud) {
      return;
    }

    this.renderArena();
    this.updateWaveArenaBoundsForCurrentSection();
    this.player.nudge(0, 0, this.arenaBounds);
    for (const enemy of this.getCurrentEnemies()) {
      enemy.nudge(0, 0, this.arenaBounds);
    }

    const viewportWidth = this.getViewportWidth();
    this.modeText.setPosition(viewportWidth - 28, 28);
    this.debugToggleButton.setPosition(viewportWidth / 2, 84);
    this.debugToggleLabel.setPosition(viewportWidth / 2, 84);
    this.resultText.setPosition(viewportWidth / 2, 112);
    this.resultHintText.setPosition(viewportWidth / 2, 170);
    this.hud.layout(viewportWidth);
    this.combatGym?.layout(viewportWidth);
    this.configureCameraForCurrentMode();
    this.updateCombatHud();
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

  private getWaveRuntimeSpawn(
    section: StageSectionDefinition,
    spawn: StageEnemySpawnDefinition,
    occupiedPositions: ReadonlyArray<{ x: number; y: number }>,
  ): { x: number; y: number } {
    const position = findSafeWaveSpawn({ x: spawn.spawnX, y: spawn.spawnY }, section.bounds,
      this.cameras.main.worldView, occupiedPositions);
    if (!position) throw new Error(`No safe visible spawn in ${section.id}`);
    return position;
  }

  private resetArenaBounds(): void {
    this.setArenaBounds({
      minX: this.defaultArenaBounds.minX,
      maxX: this.getViewportWidth() - this.defaultArenaBounds.minX,
      minY: this.defaultArenaBounds.minY,
      maxY: this.defaultArenaBounds.maxY,
    });
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

    const bounds = getWaveTraversalBounds(this.waveStage, this.waveIndex, this.waveTraversalPhase);
    this.setArenaBounds(bounds ?? section.bounds);
  }

  private beginWaveTravel(): void {
    const currentSection = this.waveStage.sections[this.waveIndex];
    const nextSection = this.waveStage.sections[this.waveIndex + 1];
    if (!currentSection || !nextSection || !currentSection.travelBounds || currentSection.arrivalTriggerX === undefined) {
      return;
    }

    this.waveTraversalPhase = 'travel';
    this.clearWaveCombatArtifacts();
    this.clearWaveEnemies();
    this.updateWaveArenaBoundsForCurrentSection();
    this.syncPrimaryEnemy();
    this.resultText.setText(`Section Clear\nWalk to ${nextSection.title}`).setVisible(true);
    this.resultHintText.setText('Path clear — move right').setVisible(true);
    this.updateModeText();
  }

  private updateWaveTravel(deltaSeconds: number, moveX: number, moveY: number): void {
    this.inputBuffer.clear();
    this.player.update(deltaSeconds, moveX, moveY, this.arenaBounds, { allowManaRegen: false });
    this.updateCombatHud();

    if (!canEnterNextWaveSection(this.waveStage, this.waveIndex, this.player.x)) {
      return;
    }

    const nextSection = this.waveStage.sections[this.waveIndex + 1];
    if (!nextSection) {
      return;
    }

    if (!this.encounterDirector?.beginTransition()) {
      return;
    }

    this.waveTraversalPhase = 'transition';
    this.resultText.setText(`Entering\n${nextSection.title}`).setVisible(true);
    this.resultHintText.setText(this.describeSectionEncounter(nextSection)).setVisible(true);
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
    this.resultHintText.setText(`Brace — ${this.describeSectionEncounter(section)}`).setVisible(true);
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

    const occupiedPositions: Array<{ x: number; y: number }> = [{ x: this.player.x, y: this.player.y }];

    return section.enemies.map((spawn, index) => {
      const runtimeSpawn = this.getWaveRuntimeSpawn(section, spawn, occupiedPositions);
      occupiedPositions.push(runtimeSpawn);
      const waveDefinition = {
        ...fighterDefinitions[spawn.fighterId],
        label: section.enemies.length > 1
          ? `${fighterDefinitions[spawn.fighterId].label} ${index + 1}`
          : fighterDefinitions[spawn.fighterId].label,
        maxHp: spawn.hpOverride ?? fighterDefinitions[spawn.fighterId].maxHp,
        moveSpeed: spawn.moveSpeedOverride ?? fighterDefinitions[spawn.fighterId].moveSpeed,
      };
      const enemy = new Fighter(this, waveDefinition, runtimeSpawn, 'enemy');
      enemy.facing = 'left';
      enemy.setCombatResponse('invulnerable');
      enemy.setStatusNote('ENTRY');
      const controller = new EnemyController(spawn.roleId, enemy.instanceId);
      this.waveEnemyControllers.set(enemy.instanceId, controller);
      const role = getEnemyRoleContract(spawn.roleId);
      enemy.setRolePresentation(role.label.toUpperCase());
      return enemy;
    });
  }

  private getPlayerSpawnPoint(): { x: number; y: number } {
    if (this.mode === 'test') {
      return { x: 380, y: 340 };
    }

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
      camera.setBounds(0, 0, this.getViewportWidth(), GAME_HEIGHT);
      camera.setScroll(0, 0);
      return;
    }

    camera.setBounds(0, 0, this.waveStage.worldWidth, GAME_HEIGHT);
    camera.setDeadzone(this.getViewportWidth() * 0.28, GAME_HEIGHT * 0.42);
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

  private getViewportWidth(): number {
    return Math.max(GAME_WIDTH, this.scale.width);
  }

  private updateCombatHud(): void {
    if (this.mode === 'waves') this.updateModeText();
    this.hud.update(this.player, this.getHudEnemy());
    this.mobileControls.setUltimateAvailability(
      this.player.canStartAttack('ultimate'),
      this.player.getAttackManaCost('ultimate'),
    );
  }

  private getControllerForEnemy(enemy: Fighter): EnemyController {
    if (this.mode !== 'waves') {
      return this.enemyController;
    }

    const controller = this.waveEnemyControllers.get(enemy.instanceId);

    if (controller) {
      return controller;
    }

    const createdController = new EnemyController(undefined, enemy.instanceId);
    this.waveEnemyControllers.set(enemy.instanceId, createdController);
    return createdController;
  }

  private tryStartAttackWithFx(fighter: Fighter, kind: 'basic' | 'special' | 'ultimate'): boolean {
    const attackId =
      fighter.id === 'discount_wizard' && kind === 'special'
        ? Phaser.Math.RND.pick(['discount_fireball_cast', 'discount_miscast'])
        : undefined;
    const didStart = attackId ? fighter.tryStartAttackById(attackId, kind) : fighter.tryStartAttack(kind);

    if (!didStart) {
      return false;
    }

    const attack = fighter.getCurrentAttack();

    if (!attack) {
      return false;
    }

    this.combatPresentation.handleAttackStarted(fighter, attack);
    return true;
  }

  private tryStartAttackByIdWithFx(
    fighter: Fighter,
    attackId: string,
    kind: 'basic' | 'special' | 'ultimate',
  ): boolean {
    if (!fighter.tryStartAttackById(attackId, kind)) {
      return false;
    }

    const attack = fighter.getCurrentAttack();
    if (!attack) {
      return false;
    }

    this.combatPresentation.handleAttackStarted(fighter, attack);
    return true;
  }

  private tryStartSelectedCombatGymMove(): void {
    if (!this.combatGymSettings) {
      return;
    }

    const selectedMove = getSelectedCombatGymMove(this.combatGymSettings);
    const target = this.getPreferredEnemyTarget();
    if (target) {
      this.player.faceTarget(target.x);
    }

    if (selectedMove.kind === 'air') {
      if (this.player.isGrounded) {
        this.gymAirAttackPending = this.player.tryStartJump();
      } else {
        this.player.tryStartAirAttack();
      }
      return;
    }

    this.tryStartAttackByIdWithFx(this.player, selectedMove.attack.id, selectedMove.kind);
  }

  private spawnAttackProjectiles(fighter: Fighter): void {
    if (this.mode === 'waves' && fighter !== this.player
      && (this.encounterDirector?.getPhase() !== 'active' || !this.isEnemyVisibleForAttack(fighter))) {
      fighter.cancelAttack();
      return;
    }
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

}
