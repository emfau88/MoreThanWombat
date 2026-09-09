// Development-only G7 harness. Exercises the two-phase final boss in a real Phaser scene.
import '../../src/main.ts';
import { EnemyController } from '../../src/game/ai/EnemyController.ts';
import { projectilesById } from '../../src/game/data/projectiles.ts';

const output = document.querySelector('#results');
const checks = [];
function check(condition, label) {
  if (!condition) throw new Error(label);
  checks.push(label);
  output.textContent = `RUNNING — ${checks.length} checks\n${checks.join('\n')}`;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const game = window.__MORE_THAN_WOMBAT_GAME__;
let input = { moveX: 0, moveY: 0 };

function tick(battle, count = 1) {
  for (let i = 0; i < count; i++) {
    battle.update(0, 50);
    battle.cameras.main.preRender();
  }
}

function until(battle, predicate, label, maximumTicks = 500) {
  for (let i = 0; i < maximumTicks && !predicate(); i++) tick(battle);
  check(predicate(), label);
}

function kill(fighter) {
  fighter.receiveHit({ damage: 10000, hitstunMs: 1, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' });
}

function configure(battle) {
  input = { moveX: 0, moveY: 0 };
  battle.inputController.consumePlayerInput = () => input;
  battle.player.setCombatResponse('invulnerable');
}

function reachActive(battle, encounter) {
  until(battle, () => battle.waveIndex === encounter && battle.encounterDirector.getPhase() === 'active',
    `Encounter ${encounter + 1} reaches active combat`);
}

function advanceEncounter(battle) {
  const previousIndex = battle.waveIndex;
  const current = battle.waveStage.sections[previousIndex];
  const next = battle.waveStage.sections[previousIndex + 1];
  battle.waveEnemies.forEach(kill);
  tick(battle);
  until(battle, () => battle.encounterDirector.getPhase() === (current.zoneId === next.zoneId ? 'transition' : 'travel'),
    `Encounter ${previousIndex + 1} reaches its release beat`);
  if (current.zoneId !== next.zoneId) {
    input = { moveX: 1, moveY: 0 };
    until(battle, () => battle.encounterDirector.getPhase() === 'transition',
      `Zone route after Encounter ${previousIndex + 1} is traversable`);
    input = { moveX: 0, moveY: 0 };
  }
  reachActive(battle, previousIndex + 1);
}

async function startWaveRun() {
  game.loop.start(game.step.bind(game));
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('BattleScene', { mode: 'waves', playerFighterId: 'wombat' });
  for (let i = 0; i < 200 && !game.scene.isActive('BattleScene'); i++) await sleep(10);
  const battle = game.scene.getScene('BattleScene');
  game.loop.stop();
  configure(battle);
  return battle;
}

async function restartWaveRun(battle) {
  game.loop.start(game.step.bind(game));
  battle.restartBattle();
  await sleep(150);
  const restarted = game.scene.getScene('BattleScene');
  game.loop.stop();
  configure(restarted);
  return restarted;
}

function advanceToBoss(battle) {
  reachActive(battle, 0);
  while (battle.waveIndex < 6) advanceEncounter(battle);
}

function isolateBossPattern(battle) {
  const section = battle.waveStage.sections[6];
  const boss = battle.waveEnemies.find((enemy) => battle.getWaveSpawnForEnemy(enemy)?.aiProfile === 'junkyard_boss');
  const add = battle.waveEnemies.find((enemy) => enemy !== boss);
  const controller = new EnemyController('heavy', boss.instanceId, 'junkyard_boss', section.enemies[0].stageInteractionIds);
  battle.waveEnemyControllers.set(boss.instanceId, controller);
  battle.waveEnemyControllers.get(add.instanceId).update = () => ({
    moveX: 0, moveY: 0, attackPressed: false, attackKind: 'basic', state: 'idle',
  });
  boss.cancelAttack();
  add.cancelAttack();
  battle.encounterDirector.releaseAllTokens();
  return { section, boss, add, controller };
}

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');
  let battle = await startWaveRun();
  advanceToBoss(battle);

  const { section, boss, add, controller } = isolateBossPattern(battle);
  const vents = section.interactions;
  check(section.completionRule.type === 'defeat_priority'
    && section.completionRule.prioritySpawnId === 'overtime-supervisor',
  'Encounter 7 clears through its authored boss priority target');
  check(section.enemies.length === 2 && boss.label === 'Overtime Supervisor' && add.state !== 'dead',
    'Finale creates the named boss plus one controlled add');
  check(vents.length === 2 && vents.every((vent) => vent.trigger === 'midboss_command'),
    'Finale owns two command-triggered lane hazards');
  check(battle.modeText.text.includes('BOSS · PHASE 1/2')
    && battle.hud.enemyBar.label.text.includes('BOSS · PHASE 1/2 · Overtime Supervisor'),
  'Boss has a dedicated phase-aware HUD');

  battle.player.x = 2200;
  battle.player.y = 390;
  boss.x = battle.player.x + 80;
  boss.y = battle.player.y;
  boss.updateVisuals();
  battle.player.updateVisuals();
  until(battle, () => boss.getCurrentAttack()?.id === 'overtime_timecard_swipe',
    'Phase 1 opens with its quick punishable melee action');
  tick(battle);
  check(boss.roleCueText.text === 'TIMECARD!', 'Melee startup has a visible callout');
  check(battle.encounterDirector.getTokenUsage().melee === 1
    && !battle.encounterDirector.requestAttack(add.instanceId, 'melee'),
  'Boss and add share the Director melee budget');
  until(battle, () => boss.getCurrentAttack() === null, 'Timecard Swipe reaches its long punishable recovery end');

  boss.x = battle.player.x + 210;
  boss.y = battle.player.y;
  boss.updateVisuals();
  until(battle, () => boss.getCurrentAttack()?.id === 'overtime_lane_lockdown',
    'Phase 1 escalates into lane denial');
  tick(battle);
  check(boss.roleCueText.text === 'LANE LOCK!', 'Lane denial has a visible boss startup callout');
  check(vents.filter((vent) => battle.stageInteractions.getSnapshot(vent.id).phase === 'telegraph').length === 1,
    'Phase 1 claims one lane and leaves the other lane as the learned answer');
  until(battle, () => boss.getCurrentAttack() === null, 'Lane Lock reaches recovery end');
  until(battle, () => controller.getDebugSnapshot(boss).state === 'boss_reposition',
    'Phase 1 completes with a distinct reposition action');
  const beforeReposition = { x: boss.x, y: boss.y };
  tick(battle, 4);
  check(boss.roleCueText.text === 'SHIFT CHANGE!'
    && (boss.x !== beforeReposition.x || boss.y !== beforeReposition.y),
  'Shift Change is visible and moves the boss to a new lane position');
  until(battle, () => controller.getDebugSnapshot(boss).state !== 'boss_reposition',
    'Phase 1 reposition completes');

  boss.cancelAttack();
  battle.encounterDirector.releaseAllTokens();
  boss.hp = boss.maxHp / 2;
  tick(battle);
  check(controller.getDebugSnapshot(boss).junkyardBossPhase === 2
    && controller.getDebugSnapshot(boss).state === 'boss_phase_change',
  'Boss changes to phase 2 exactly at half health');
  check(boss.getCombatResponse() === 'invulnerable' && boss.roleCueText.text === 'OVERTIME!',
    'Phase transition is protected and visibly announced');
  check(battle.modeText.text.includes('BOSS · PHASE 2/2')
    && battle.hud.enemyBar.label.text.includes('BOSS · PHASE 2/2'),
  'Boss HUD updates to the second phase');
  until(battle, () => controller.getDebugSnapshot(boss).state === 'boss_reposition',
    'Phase 2 changes the decision order by repositioning first');
  until(battle, () => controller.getDebugSnapshot(boss).state !== 'boss_reposition',
    'Phase 2 reposition completes');

  boss.x = battle.player.x + 80;
  boss.y = battle.player.y;
  boss.updateVisuals();
  until(battle, () => boss.getCurrentAttack()?.id === 'overtime_timecard_swipe',
    'Phase 2 retains the readable melee punish test');
  until(battle, () => boss.getCurrentAttack() === null, 'Phase 2 melee completes');
  boss.x = battle.player.x + 210;
  boss.y = battle.player.y;
  boss.updateVisuals();
  until(battle, () => boss.getCurrentAttack()?.id === 'overtime_lane_lockdown',
    'Phase 2 reaches its area-denial action');
  tick(battle);
  check(boss.roleCueText.text === 'FULL LOCKDOWN!', 'Phase 2 danger uses a stronger distinct callout');
  check(vents.every((vent) => battle.stageInteractions.getSnapshot(vent.id).phase === 'telegraph'),
    'Phase 2 locks both outer lanes and changes the safe-space decision');
  const bossHpBeforeHazards = boss.hp;
  tick(battle, Math.ceil(vents[0].telegraphMs / 50));
  check(boss.hp === bossHpBeforeHazards, 'Boss cannot damage itself with its authored lane hazards');

  const projectile = Object.values(projectilesById)[0];
  battle.projectileSystem.spawn(add, projectile);
  kill(boss);
  tick(battle);
  check(battle.encounterDirector.getPhase() === 'clear_delay', 'Priority boss defeat begins the victory release beat');
  check(battle.waveEnemies.length === 0 && battle.stageInteractions.getCount() === 0
    && battle.projectileSystem.getActiveOwnerIds().length === 0,
  'defeat_priority immediately cleans the surviving add, hazards and projectiles');
  until(battle, () => battle.encounterDirector.getPhase() === 'victory', 'Final boss clear reaches Stage victory');
  check(battle.battleFlow.getResult() === 'victory'
    && battle.combatPresentation.getVfxDiagnostics().activeLayers === 0,
    'Victory leaves no enemy AI, interaction or transient presentation state');

  battle = await restartWaveRun(battle);
  advanceToBoss(battle);
  const restartedBoss = battle.waveEnemies.find((enemy) => battle.getWaveSpawnForEnemy(enemy)?.aiProfile === 'junkyard_boss');
  const restartedController = battle.waveEnemyControllers.get(restartedBoss.instanceId);
  check(restartedBoss.hp === restartedBoss.maxHp
    && restartedController.getDebugSnapshot(restartedBoss).junkyardBossPhase === 1
    && battle.waveStage.sections[6].interactions.every((vent) => battle.stageInteractions.getSnapshot(vent.id).phase === 'dormant'),
  'Restart reproduces a full-health phase-1 boss with fresh hazards');
  restartedBoss.cancelAttack();
  battle.encounterDirector.releaseAllTokens();
  restartedBoss.hp = restartedBoss.maxHp / 2;
  tick(battle);
  check(restartedBoss.roleCueText.text === 'OVERTIME!' && battle.modeText.text.includes('BOSS · PHASE 2/2'),
    'Final QA frame visibly captures the protected phase transition');

  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();
  output.textContent = `PASS — ${checks.length} G7 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual learning, feel and device acceptance remain separate.`;
  document.title = `PASS G7 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G7';
}
