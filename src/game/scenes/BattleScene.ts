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
import { JUNKYARD_WALKABLE_BAND, defaultWaveStageId, waveStages, type StageDefinition, type StageSectionDefinition, type StageEnemySpawnDefinition, type WaveStageId } from '../data/stages';
import { canEnterNextWaveSection, getWaveTraversalBounds, type WaveTraversalPhase } from '../core/WaveTraversal';
import { findSafeWaveSpawn, isWaveActorVisible } from '../core/WaveSafety';
import { WaveStageInteractionController, type WaveStageInteractionEvent } from '../core/WaveStageInteractionController';
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

type WaveEnemyEntryRuntime = {
  spawnId: string;
  delayRemainingMs: number;
  entryRemainingMs: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  combatActive: boolean;
};

const WAVE_ENEMY_ENTRY_DURATION_MS = 420;

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
  private resultCard!: Phaser.GameObjects.Rectangle;
  private resultKickerText!: Phaser.GameObjects.Text;
  private resultText!: Phaser.GameObjects.Text;
  private resultHintText!: Phaser.GameObjects.Text;
  private readonly arenaVisuals: Phaser.GameObjects.GameObject[] = [];
  private debugEnabled = false;
  private hitboxSystem!: HitboxSystem;
  private projectileSystem!: ProjectileSystem;
  private pushboxSystem!: PushboxSystem;
  private enemyController!: EnemyController;
  private readonly waveEnemyControllers = new Map<number, EnemyController>();
  private readonly waveEnemyEntries = new Map<number, WaveEnemyEntryRuntime>();
  private battleFlow!: BattleFlowController;
  private combatFeedback!: CombatFeedbackController;
  private combatPresentation!: CombatPresentationController;
  private combatImpact!: CombatImpactOrchestrator;
  private stageInteractions!: WaveStageInteractionController;
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
      getCurrentTargets: () => [this.player, ...this.getCombatEnemies()],
      getTargetFor: (fighter) => fighter === this.player ? this.getPreferredEnemyTarget() : this.player,
      getVisibleCenterX: () => this.mode === 'waves' ? this.cameras.main.worldView.centerX : this.getViewportWidth() / 2,
      getShakeScale: () => this.combatFeedback.getAccessibilityScale(),
    });
    this.combatImpact = new CombatImpactOrchestrator(this, this.combatFeedback, this.combatPresentation);
    this.stageInteractions = new WaveStageInteractionController(this);
    registerCharacterAnimations(this);
    this.renderArena();
    this.instructionText = this.add.text(32, 28, 'Hold direction to run; repeat J/Space for 3-hit chain; Run + ATK dash; L jump; F defend', {
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
    this.resultCard = this.add
      .rectangle(this.getViewportWidth() / 2, 120, Math.min(660, this.getViewportWidth() - 56), 150, 0x07111c, 0.94)
      .setStrokeStyle(3, 0xffb259, 0.9)
      .setDepth(2199)
      .setScrollFactor(0)
      .setVisible(false);
    this.resultKickerText = this.add
      .text(this.getViewportWidth() / 2, 66, '', {
        color: '#ffca7a',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        letterSpacing: 2,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(2200)
      .setScrollFactor(0)
      .setVisible(false);
    this.resultText = this.add
      .text(this.getViewportWidth() / 2, 112, '', {
        color: '#fff7e6',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
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
      .text(this.getViewportWidth() / 2, 164, '', {
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
      this.stageInteractions.destroy();
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

    if (this.mode === 'waves') {
      this.updateWaveEnemyEntries(simulationDeltaMs);
      this.updateWaveCombatCamera(simulationDeltaMs);
    }

    const targetEnemy = this.getPreferredEnemyTarget();

    if (this.gymMoveRequested) {
      this.gymMoveRequested = false;
      this.tryStartSelectedCombatGymMove();
    }

    if (this.gymAirAttackPending && !this.player.isGrounded) {
      this.gymAirAttackPending = !this.player.tryStartAirAttack();
    }

    if (this.inputBuffer.has('defend')) {
      const defense = this.player.tryStartDefense(inputState.moveX, inputState.moveY);
      if (defense) this.inputBuffer.consume('defend');
    }

    if (this.inputBuffer.has('jump') && this.player.tryStartJump()) {
      this.inputBuffer.consume('jump');
    }

    if (this.inputBuffer.has('attack')) {
      if (this.player.tryBufferBasicChain()) {
        this.inputBuffer.consume('attack');
      } else {
        if (targetEnemy && this.player.state !== 'run') {
          this.player.faceTarget(targetEnemy.x);
        }
        const didStart = !this.player.isGrounded
          ? this.player.tryStartAirAttack()
          : this.tryStartAttackWithFx(this.player, 'basic');
        if (didStart) {
          this.inputBuffer.consume('attack');
        }
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
      const enemyIntent = this.mode === 'waves' && !this.isWaveEnemyCombatActive(enemy)
        ? { moveX: 0, moveY: 0, attackPressed: false, attackKind: 'basic', state: 'idle' } as EnemyIntent
        : this.mode === 'test'
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
      enemy.setStatusNote(this.mode === 'waves' && !this.isWaveEnemyCombatActive(enemy)
        ? 'ENTRY'
        : dummyMode ? `GYM ${dummyMode}` : `AI ${enemyIntent.state}`);
      if (this.mode === 'waves' && this.isWaveEnemyCombatActive(enemy)) {
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
        } else if (didStart) {
          const triggerIds = enemyIntent.stageInteractionTriggerIds
            ?? (enemyIntent.stageInteractionTriggerId ? [enemyIntent.stageInteractionTriggerId] : []);
          for (const interactionId of triggerIds) this.stageInteractions.trigger(interactionId);
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

    if (this.mode === 'waves') {
      this.handleStageInteractionEvents(this.stageInteractions.update(
        simulationDeltaMs,
        this.encounterDirector?.getPhase() === 'active',
        this.player,
        [this.player, ...this.getCombatEnemies()],
        this.cameras.main.worldView,
      ));
    }

    this.presentPendingAttackStart(this.player);
    for (const enemy of this.getCurrentEnemies()) {
      this.presentPendingAttackStart(enemy);
    }

    this.spawnAttackProjectiles(this.player);

    for (const enemy of this.getCurrentEnemies()) {
      this.spawnAttackProjectiles(enemy);
    }

    const pushboxActors = [this.player, ...this.getCombatEnemies()];
    for (let actorIndex = 0; actorIndex < pushboxActors.length; actorIndex += 1) {
      for (let otherIndex = actorIndex + 1; otherIndex < pushboxActors.length; otherIndex += 1) {
        this.pushboxSystem.resolve(pushboxActors[actorIndex], pushboxActors[otherIndex], this.arenaBounds);
      }
    }

    const impacts: CombatImpact[] = [];

    for (const enemy of this.getCombatEnemies()) {
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

    const projectileHits = this.projectileSystem.update(deltaSeconds, [this.player, ...this.getCombatEnemies()], this.arenaBounds,
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
    this.showResultCard('RUN COMPLETE', `${message}\nPress R to restart`, 'Press M for menu');
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
    this.hideResultCard();
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
      dummyMode === 'armor'
          ? 'armor'
          : dummyMode === 'invulnerable'
            ? 'invulnerable'
            : 'normal',
    );
    if (dummyMode === 'guard' || dummyMode === 'evade' || dummyMode === 'launched'
      || dummyMode === 'knockdown' || dummyMode === 'wake-up') {
      this.enemy?.setDefensePhaseForDebug(dummyMode === 'wake-up' ? 'wake_up' : dummyMode);
    }
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
    this.hideResultCard();
    this.updateModeText();
    this.updateCombatHud();
  }

  private advanceWaveDirector(deltaMs: number): void {
    const director = this.encounterDirector;
    if (!director) {
      return;
    }

    const events = director.advance(deltaMs, this.isCurrentEncounterComplete());
    for (const event of events) {
      this.handleEncounterDirectorEvent(event);
    }
  }

  private isCurrentEncounterComplete(): boolean {
    const section = this.waveStage.sections[this.waveIndex];
    if (!section || this.waveEnemies.length === 0) return false;
    if (section.completionRule.type === 'defeat_all') {
      return this.waveEnemies.every((enemy) => enemy.state === 'dead');
    }
    const prioritySpawnId = section.completionRule.prioritySpawnId;
    const priority = [...this.waveEnemyEntries.entries()]
      .find(([, entry]) => entry.spawnId === prioritySpawnId);
    const priorityEnemy = priority
      ? this.waveEnemies.find((enemy) => enemy.instanceId === priority[0])
      : undefined;
    return priorityEnemy?.state === 'dead';
  }

  private handleEncounterDirectorEvent(event: EncounterDirectorEvent): void {
    if (event.type === 'spawning') {
      const section = this.waveStage.sections[this.waveIndex];
      if (section) this.focusWaveCamera(section, 0);
      this.clearWaveEnemies();
      if (section) this.stageInteractions.loadSection(section);
      this.waveEnemies = this.createWaveEnemiesForCurrentSection();
      this.syncPrimaryEnemy();
      for (const enemy of this.waveEnemies) {
        enemy.setDebugVisible(this.debugEnabled);
        enemy.updateVisuals();
      }
      this.showResultCard(
        `ENCOUNTER ${this.waveIndex + 1} / ${this.waveStage.sections.length}`,
        'Trouble Incoming',
        section ? this.describeSectionEncounter(section) : 'Get ready',
        section?.zoneId,
      );
      this.updateModeText();
      this.updateCombatHud();
      return;
    }

    if (event.type === 'active') {
      this.updateWaveEnemyEntries(0);
      this.hideResultCard();
      this.updateWaveCombatCamera(0);
      this.updateModeText();
      this.updateCombatHud();
      return;
    }

    if (event.type === 'clear_delay') {
      this.clearWaveCombatArtifacts();
      const currentSection = this.waveStage.sections[this.waveIndex];
      if (currentSection?.completionRule.type === 'defeat_priority') {
        this.clearWaveEnemies();
        this.syncPrimaryEnemy();
      }
      const nextSection = this.waveStage.sections[this.waveIndex + 1];
      const staysInZone = currentSection && nextSection && currentSection.zoneId === nextSection.zoneId;
      const reward = currentSection?.clearReward;
      const restoredHealth = reward
        ? this.player.restoreHealth(Math.ceil(this.player.maxHp * reward.healthRatio))
        : 0;
      const rewardLine = reward
        ? `${reward.label} · ${restoredHealth > 0 ? `+${restoredHealth} HP` : 'HP already full'}`
        : null;
      const zoneTitle = this.waveStage.zones.find((zone) => zone.id === currentSection?.zoneId)?.title ?? 'Junkyard';
      this.showResultCard(
        staysInZone ? `ENCOUNTER ${this.waveIndex + 1} CLEARED` : `${zoneTitle.toUpperCase()} SECURED`,
        staysInZone ? 'Scrap Settled' : 'Zone Clear',
        rewardLine ?? (staysInZone ? 'More trouble incoming' : 'Path unlocks shortly'),
        currentSection?.zoneId,
      );
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
      if (phase === 'spawning') this.updateWaveEnemyEntries(deltaSeconds * 1000);
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

    if (!this.encounterDirector || !this.isWaveEnemyCombatActive(enemy)
      || !enemy.canStartAttack(kind) || !this.isEnemyVisibleForAttack(enemy)) {
      return false;
    }

    const channel = controller.getPressureChannel(kind, enemy);
    return this.encounterDirector.requestAttack(enemy.instanceId, channel);
  }

  private handleEnemyRoleImpacts(impacts: CombatImpact[]): void {
    if (this.mode !== 'waves') return;

    for (const impact of impacts) {
      const attacker = impact.attacker;
      if (attacker?.faction === 'enemy' && (impact.outcome === 'hit' || impact.outcome === 'armored'
        || impact.outcome === 'guard_broken')) {
        this.waveEnemyControllers.get(attacker.instanceId)?.notifyAttackConnected();
      } else if (attacker?.faction === 'enemy'
        && (impact.outcome === 'blocked' || impact.outcome === 'invulnerable')) {
        this.waveEnemyControllers.get(attacker.instanceId)?.notifyDefenseOutcome(impact.outcome);
      }

      const defender = impact.defender;
      if (defender?.faction === 'enemy' && (defender.state === 'launched' || defender.state === 'knockdown')) {
        const controller = this.waveEnemyControllers.get(defender.instanceId);
        controller?.notifyKnockdown(defender);
        this.projectileSystem.removeByOwner(defender.instanceId);
        this.encounterDirector?.releaseAttack(defender.instanceId);
      }
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

  private handleStageInteractionEvents(events: readonly WaveStageInteractionEvent[]): void {
    for (const event of events) {
      if (event.type === 'pickup_collected') {
        this.player.restoreHealth(Math.ceil(this.player.maxHp * event.definition.healthRatio));
        this.player.restoreMana(Math.ceil(this.player.maxMana * event.definition.manaRatio));
        continue;
      }

      const actor = event.actor;
      const aiProfile = this.getWaveSpawnForEnemy(actor)?.aiProfile;
      if (aiProfile === 'junkyard_boss') continue;
      const isForeman = aiProfile === 'scrap_foreman';
      const sourceFacing = actor.x >= event.definition.x ? 'right' : 'left';
      actor.receiveHit({
        damage: isForeman ? Math.ceil(event.definition.damage * 1.5) : event.definition.damage,
        hitstunMs: isForeman ? 0 : 360,
        knockbackX: event.definition.knockback,
        knockbackY: Math.sign(actor.y - event.definition.y || 1) * event.definition.knockback * 0.45,
        sourceFacing,
        hitReaction: isForeman ? 'knockdown' : 'hitstun',
      });
      if (actor.faction === 'enemy') {
        const controller = this.getControllerForEnemy(actor);
        controller.notifyStageHazardHit();
        this.projectileSystem.removeByOwner(actor.instanceId);
        this.encounterDirector?.releaseAttack(actor.instanceId);
        this.applyEnemyRolePresentation(actor, controller);
      }
    }
  }

  private isEnemyVisibleForAttack(enemy: Fighter): boolean {
    return this.isWaveEnemyCombatActive(enemy) && isWaveActorVisible(enemy, this.cameras.main.worldView);
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
        .filter((enemy) => this.isWaveEnemyCombatActive(enemy) && enemy.state !== 'dead'
          && (enemy.getAttackPhase() === 'startup' || enemy.getAttackPhase() === 'active'))
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
    this.stageInteractions.clear();
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
    this.showResultCard('JUNKYARD RUN COMPLETE', 'Victory\nPress R to restart', 'Press M for menu');
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
    const boss = this.waveEnemies.find((enemy) => this.getWaveSpawnForEnemy(enemy)?.aiProfile === 'junkyard_boss');
    const bossPhase = boss ? this.getControllerForEnemy(boss).getDebugSnapshot(boss).junkyardBossPhase : null;
    const encounterTag = bossPhase
      ? `BOSS · PHASE ${bossPhase}/2 · `
      : this.waveStage.sections[this.waveIndex]?.enemies.some((spawn) => spawn.aiProfile === 'scrap_foreman')
        ? 'MIDBOSS · '
        : '';
    this.modeText.setText(`${this.waveStage.title} ${this.waveIndex + 1}/${this.waveStage.sections.length} | ${encounterTag}${sectionTitle}${debugText}`);
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
        this.trackArenaVisual(this.add.rectangle(boundary, JUNKYARD_WALKABLE_BAND.minY, 72, 10, 0xf5f0d8, 0.15).setDepth(-94));
        this.trackArenaVisual(this.add.rectangle(boundary, JUNKYARD_WALKABLE_BAND.maxY, 72, 10, 0x10151e, 0.3).setDepth(-94));
      }
      this.trackArenaVisual(this.add.rectangle(this.waveStage.worldWidth / 2, JUNKYARD_WALKABLE_BAND.minY,
        this.waveStage.worldWidth - 120, 6, 0xffd08a, 0.16).setDepth(-90));
      this.trackArenaVisual(this.add.rectangle(this.waveStage.worldWidth / 2, JUNKYARD_WALKABLE_BAND.maxY,
        this.waveStage.worldWidth - 120, 8, 0x0a0b0f, 0.24).setDepth(-90));
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
    this.resultCard.setPosition(viewportWidth / 2, 120).setSize(Math.min(660, viewportWidth - 56), 150);
    this.resultKickerText.setPosition(viewportWidth / 2, 66);
    this.resultText.setPosition(viewportWidth / 2, 112);
    this.resultHintText.setPosition(viewportWidth / 2, 164);
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

  private getWaveEntryStart(
    spawn: StageEnemySpawnDefinition,
    target: Readonly<{ x: number; y: number }>,
    bounds: FighterBounds,
  ): { x: number; y: number } {
    const distance = 72;
    return {
      x: Phaser.Math.Clamp(target.x + (spawn.entryDirection === 'right' ? distance
        : spawn.entryDirection === 'left' ? -distance : 0), bounds.minX, bounds.maxX),
      y: Phaser.Math.Clamp(target.y + (spawn.entryDirection === 'lower_lane' ? distance
        : spawn.entryDirection === 'upper_lane' ? -distance : 0), bounds.minY, bounds.maxY),
    };
  }

  private updateWaveEnemyEntries(deltaMs: number): void {
    const phase = this.encounterDirector?.getPhase();
    for (const enemy of this.waveEnemies) {
      const entry = this.waveEnemyEntries.get(enemy.instanceId);
      if (!entry || entry.combatActive || enemy.state === 'dead') continue;
      let remainingMs = Math.max(0, deltaMs);
      if (entry.delayRemainingMs > 0) {
        const consumed = Math.min(entry.delayRemainingMs, remainingMs);
        entry.delayRemainingMs -= consumed;
        remainingMs -= consumed;
        if (entry.delayRemainingMs > 0) continue;
        enemy.container.setVisible(true);
      }
      if (entry.entryRemainingMs > 0) {
        entry.entryRemainingMs = Math.max(0, entry.entryRemainingMs - remainingMs);
        const progress = 1 - entry.entryRemainingMs / WAVE_ENEMY_ENTRY_DURATION_MS;
        enemy.x = Phaser.Math.Linear(entry.startX, entry.targetX, progress);
        enemy.y = Phaser.Math.Linear(entry.startY, entry.targetY, progress);
        enemy.updateVisuals();
      }
      if (entry.entryRemainingMs > 0 || phase !== 'active') continue;
      entry.combatActive = true;
      const controller = this.getControllerForEnemy(enemy);
      enemy.setCombatResponse(controller.getCombatResponse(enemy));
      this.applyEnemyRolePresentation(enemy, controller);
      enemy.setStatusNote('AI idle');
    }
  }

  private isWaveEnemyCombatActive(enemy: Fighter): boolean {
    return this.mode !== 'waves' || this.waveEnemyEntries.get(enemy.instanceId)?.combatActive === true;
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
    if (!currentSection || !nextSection) {
      return;
    }

    this.clearWaveCombatArtifacts();
    this.clearWaveEnemies();
    this.syncPrimaryEnemy();

    if (currentSection.zoneId === nextSection.zoneId) {
      if (!this.encounterDirector?.beginTransition()) return;
      this.waveTraversalPhase = 'transition';
      this.showResultCard(
        `ENCOUNTER ${this.waveIndex + 2} / ${this.waveStage.sections.length}`,
        nextSection.title,
        nextSection.objective,
        nextSection.zoneId,
      );
      this.focusWaveCamera(nextSection);
      this.updateModeText();
      return;
    }

    if (!currentSection.travelBounds || currentSection.arrivalTriggerX === undefined) return;
    this.waveTraversalPhase = 'travel';
    this.updateWaveArenaBoundsForCurrentSection();
    this.showResultCard(
      'ROUTE OPEN',
      `Move to ${nextSection.title}`,
      'Follow the lit path →',
      nextSection.zoneId,
    );
    this.resumeWaveCameraFollow();
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
    this.showResultCard(
      'NEW AREA',
      nextSection.title,
      this.describeSectionEncounter(nextSection),
      nextSection.zoneId,
    );
    this.focusWaveCamera(nextSection);
  }

  private showWaveSectionIntro(): void {
    if (this.mode !== 'waves') {
      return;
    }

    const section = this.waveStage.sections[this.waveIndex];
    if (!section) {
      return;
    }

    const zoneTitle = this.waveStage.zones.find((zone) => zone.id === section.zoneId)?.title ?? this.waveStage.title;
    this.showResultCard(
      `${zoneTitle.toUpperCase()} · ${this.waveIndex + 1} / ${this.waveStage.sections.length}`,
      section.title,
      section.objective,
      section.zoneId,
    );
    this.focusWaveCamera(section);
  }

  private showResultCard(
    kicker: string,
    title: string,
    hint: string,
    zoneId?: string,
  ): void {
    const zone = this.waveStage?.zones?.find((candidate) => candidate.id === zoneId);
    this.resultCard.setStrokeStyle(3, zone?.transitionColor ?? 0xffb259, 0.9).setVisible(true);
    this.resultKickerText.setText(kicker).setVisible(true);
    this.resultText.setText(title).setVisible(true);
    this.resultHintText.setText(hint).setVisible(true);
  }

  private hideResultCard(): void {
    this.resultCard.setVisible(false);
    this.resultKickerText.setVisible(false);
    this.resultText.setVisible(false);
    this.resultHintText.setVisible(false);
  }

  private describeSectionEncounter(section: StageSectionDefinition): string {
    const boss = section.enemies.find((spawn) => spawn.aiProfile === 'junkyard_boss');
    if (boss) return `BOSS · ${boss.labelOverride ?? 'Overtime Supervisor'} · TWO PHASES`;
    const midboss = section.enemies.find((spawn) => spawn.aiProfile === 'scrap_foreman');
    if (midboss) return `MIDBOSS · ${midboss.labelOverride ?? 'Acting Foreman'}`;
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
        label: spawn.labelOverride ?? (section.enemies.length > 1
          ? `${fighterDefinitions[spawn.fighterId].label} ${index + 1}`
          : fighterDefinitions[spawn.fighterId].label),
        maxHp: spawn.hpOverride ?? fighterDefinitions[spawn.fighterId].maxHp,
        moveSpeed: spawn.moveSpeedOverride ?? fighterDefinitions[spawn.fighterId].moveSpeed,
      };
      const enemy = new Fighter(this, waveDefinition, runtimeSpawn, 'enemy');
      const entryStart = this.getWaveEntryStart(spawn, runtimeSpawn, section.bounds);
      enemy.x = entryStart.x;
      enemy.y = entryStart.y;
      enemy.facing = spawn.entryDirection === 'left' ? 'right' : 'left';
      enemy.setCombatResponse('invulnerable');
      enemy.setStatusNote('ENTRY');
      enemy.container.setVisible(spawn.entryDelayMs === 0);
      const controller = new EnemyController(
        spawn.roleId,
        enemy.instanceId,
        spawn.aiProfile,
        spawn.stageInteractionIds ?? spawn.stageInteractionId,
      );
      this.waveEnemyControllers.set(enemy.instanceId, controller);
      const role = getEnemyRoleContract(spawn.roleId);
      enemy.setRolePresentation(role.label.toUpperCase());
      this.waveEnemyEntries.set(enemy.instanceId, {
        spawnId: spawn.id,
        delayRemainingMs: spawn.entryDelayMs,
        entryRemainingMs: WAVE_ENEMY_ENTRY_DURATION_MS,
        startX: entryStart.x,
        startY: entryStart.y,
        targetX: runtimeSpawn.x,
        targetY: runtimeSpawn.y,
        combatActive: false,
      });
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
    const phase = this.encounterDirector?.getPhase();
    if (phase === 'active') {
      this.updateWaveCombatCamera(0);
    } else if (phase === 'travel') {
      this.resumeWaveCameraFollow();
    } else {
      const section = this.waveStage.sections[this.waveIndex];
      if (section) this.focusWaveCamera(section, 0);
    }
  }

  private focusWaveCamera(section: StageSectionDefinition, durationMs = 520): void {
    if (this.mode !== 'waves') return;
    const camera = this.cameras.main;
    const enemyCenterX = section.enemies.reduce((sum, spawn) => sum + spawn.spawnX, 0)
      / Math.max(1, section.enemies.length);
    const desiredX = this.player.x * 0.38 + enemyCenterX * 0.62;
    const halfViewport = this.getViewportWidth() / 2;
    const focusX = Phaser.Math.Clamp(desiredX, halfViewport, this.waveStage.worldWidth - halfViewport);
    camera.stopFollow();
    camera.setDeadzone(this.getViewportWidth() * 0.16, GAME_HEIGHT * 0.24);
    if (durationMs <= 0) {
      camera.centerOn(focusX, GAME_HEIGHT / 2);
      camera.preRender();
      return;
    }
    camera.pan(focusX, GAME_HEIGHT / 2, durationMs, 'Sine.easeInOut', true);
  }

  private resumeWaveCameraFollow(): void {
    if (this.mode !== 'waves') return;
    const camera = this.cameras.main;
    camera.setDeadzone(this.getViewportWidth() * 0.16, GAME_HEIGHT * 0.24);
    camera.startFollow(this.player.container, true, 0.2, 0.16);
  }

  private updateWaveCombatCamera(deltaMs: number): void {
    if (this.mode !== 'waves' || this.encounterDirector?.getPhase() !== 'active') return;
    const camera = this.cameras.main;
    const actors = [this.player, ...this.waveEnemies.filter((enemy) => enemy.state !== 'dead')];
    const minX = Math.min(...actors.map((fighter) => fighter.x));
    const maxX = Math.max(...actors.map((fighter) => fighter.x));
    const halfViewport = this.getViewportWidth() / 2;
    const targetX = Phaser.Math.Clamp((minX + maxX) / 2, halfViewport,
      this.waveStage.worldWidth - halfViewport);
    const currentX = camera.worldView.centerX;
    const blend = deltaMs <= 0 ? 1 : 1 - Math.exp(-deltaMs / 180);
    camera.stopFollow();
    camera.centerOn(Phaser.Math.Linear(currentX, targetX, blend), GAME_HEIGHT / 2);
    camera.preRender();
  }

  private clearWaveEnemies(): void {
    for (const enemy of this.waveEnemies) {
      enemy.destroy();
    }

    this.waveEnemies = [];
    this.waveEnemyControllers.clear();
    this.waveEnemyEntries.clear();
  }

  private getCurrentEnemies(): Fighter[] {
    if (this.mode === 'waves') {
      return this.waveEnemies;
    }

    return this.enemy ? [this.enemy] : [];
  }

  private getLivingEnemies(): Fighter[] {
    return this.getCombatEnemies().filter((enemy) => enemy.state !== 'dead');
  }

  private getCombatEnemies(): Fighter[] {
    return this.getCurrentEnemies().filter((enemy) => this.mode !== 'waves' || this.isWaveEnemyCombatActive(enemy));
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
    const priorityEnemy = this.waveEnemies.find((enemy) => (
      this.getWaveSpawnForEnemy(enemy)?.aiProfile !== undefined && enemy.state !== 'dead'
    ));
    if (priorityEnemy) return priorityEnemy;
    return this.getPreferredEnemyTarget() ?? this.enemy;
  }

  private getWaveSpawnForEnemy(enemy: Fighter): StageEnemySpawnDefinition | undefined {
    const spawnId = this.waveEnemyEntries.get(enemy.instanceId)?.spawnId;
    return this.waveStage.sections[this.waveIndex]?.enemies.find((spawn) => spawn.id === spawnId);
  }

  private getViewportWidth(): number {
    return Math.max(GAME_WIDTH, this.scale.width);
  }

  private updateCombatHud(): void {
    if (this.mode === 'waves') this.updateModeText();
    const hudEnemy = this.getHudEnemy();
    const spawn = hudEnemy ? this.getWaveSpawnForEnemy(hudEnemy) : undefined;
    const enemyLabel = hudEnemy && spawn?.aiProfile === 'junkyard_boss'
      ? `BOSS · PHASE ${this.getControllerForEnemy(hudEnemy).getDebugSnapshot(hudEnemy).junkyardBossPhase}/2 · ${hudEnemy.label}`
      : hudEnemy && spawn?.aiProfile === 'scrap_foreman' ? `MIDBOSS · ${hudEnemy.label}` : undefined;
    this.hud.update(this.player, hudEnemy, enemyLabel);
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

    const attack = fighter.consumePendingAttackStart() ?? fighter.getCurrentAttack();

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

    const attack = fighter.consumePendingAttackStart() ?? fighter.getCurrentAttack();
    if (!attack) {
      return false;
    }

    this.combatPresentation.handleAttackStarted(fighter, attack);
    return true;
  }

  private presentPendingAttackStart(fighter: Fighter): void {
    const attack = fighter.consumePendingAttackStart();
    if (attack) this.combatPresentation.handleAttackStarted(fighter, attack);
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
