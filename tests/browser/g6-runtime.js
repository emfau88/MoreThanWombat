// Development-only G6 harness. Exercises authored interactions and the midboss in a real Phaser scene.
import '../../src/main.ts';

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

function until(battle, predicate, label, maximumTicks = 400) {
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
  const changesZone = battle.waveStage.sections[previousIndex].zoneId
    !== battle.waveStage.sections[previousIndex + 1].zoneId;
  battle.waveEnemies.forEach(kill);
  tick(battle);
  until(battle, () => battle.encounterDirector.getPhase() === (changesZone ? 'travel' : 'transition'),
    `Encounter ${previousIndex + 1} reaches its release beat`);
  if (changesZone) {
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

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');
  let battle = await startWaveRun();

  const interactionTypes = new Set(battle.waveStage.sections.flatMap((section) =>
    (section.interactions ?? []).map((interaction) => interaction.type)));
  check(interactionTypes.size === 2 && interactionTypes.has('steam_vent') && interactionTypes.has('resource_pickup'),
    'G6 ships exactly two data-driven interaction types');
  check(battle.waveStage.sections[4].enemies.length === 1
    && battle.waveStage.sections[4].enemies[0].aiProfile === 'scrap_foreman',
  'Encounter 5 is a standalone authored midboss');

  reachActive(battle, 0);
  advanceEncounter(battle);
  advanceEncounter(battle);
  const periodic = battle.waveStage.sections[2].interactions[0];
  check(battle.stageInteractions.getSnapshot(periodic.id).phase === 'cooldown',
    'Furnace vent begins with a deterministic safe delay');
  battle.player.x = periodic.x;
  battle.player.y = periodic.y;
  battle.player.updateVisuals();
  for (const enemy of battle.waveEnemies) {
    enemy.x = periodic.x + 260;
    enemy.y = periodic.y + 60;
    enemy.updateVisuals();
  }
  tick(battle, periodic.initialDelayMs / 50);
  check(battle.stageInteractions.getSnapshot(periodic.id).phase === 'telegraph',
    'Visible pressure leak enters its full warning phase');
  check(battle.stageInteractions.visuals.get(periodic.id).cue.visible,
    'Steam warning is rendered before danger becomes active');
  const hpBeforeSteam = battle.player.hp;
  tick(battle, periodic.telegraphMs / 50);
  check(battle.player.hp === hpBeforeSteam - periodic.damage,
    'Pressure leak deals its authored damage exactly after the warning');
  const hitPosition = { x: battle.player.x, y: battle.player.y };
  tick(battle, 2);
  check(battle.player.hp === hpBeforeSteam - periodic.damage, 'One steam cycle cannot multi-hit the same fighter');
  check(battle.player.x !== hitPosition.x || battle.player.y !== hitPosition.y,
    'Steam changes fighter position as well as health');

  kill(battle.player);
  tick(battle);
  check(battle.encounterDirector.getPhase() === 'defeat' && battle.stageInteractions.getCount() === 0,
    'Defeat clears active stage interactions');
  battle = await restartWaveRun(battle);
  check(battle.waveIndex === 0 && battle.stageInteractions.getCount() === 0,
    'Restart begins a clean run without inherited interaction state');

  reachActive(battle, 0);
  advanceEncounter(battle);
  advanceEncounter(battle);
  advanceEncounter(battle);
  const pickup = battle.waveStage.sections[3].interactions[0];
  battle.player.hp = 40;
  battle.player.setManaForDebug(0);
  const canRegenerateMana = battle.encounterDirector.canRegenerateMana.bind(battle.encounterDirector);
  battle.encounterDirector.canRegenerateMana = () => false;
  battle.player.x = pickup.x;
  battle.player.y = pickup.y;
  battle.player.updateVisuals();
  const expectedHp = Math.min(battle.player.maxHp, 40 + Math.ceil(battle.player.maxHp * pickup.healthRatio));
  const expectedMana = Math.ceil(battle.player.maxMana * pickup.manaRatio);
  tick(battle);
  battle.encounterDirector.canRegenerateMana = canRegenerateMana;
  check(battle.player.hp === expectedHp && battle.player.mana === expectedMana,
    'Union Lunchbox reproducibly restores its authored HP and mana');
  check(battle.stageInteractions.getSnapshot(pickup.id).phase === 'collected',
    'Union Lunchbox can be collected only once');
  tick(battle, 10);
  check(battle.player.hp === expectedHp, 'Collected resource cannot be farmed by standing on it');

  advanceEncounter(battle);
  const foreman = battle.waveEnemies[0];
  const foremanController = battle.waveEnemyControllers.get(foreman.instanceId);
  const foremanVent = battle.waveStage.sections[4].interactions[0];
  check(foreman.label === 'Acting Foreman' && battle.modeText.text.includes('MIDBOSS'),
    'Encounter 5 presents the priority target as a named midboss');
  check(foremanController.getDebugSnapshot(foreman).aiProfile === 'scrap_foreman',
    'Midboss owns its dedicated AI profile');

  battle.player.state = 'idle';
  battle.player.isGrounded = true;
  battle.player.z = 0;
  battle.player.velocityZ = 0;
  battle.player.x = 1390;
  battle.player.y = foremanVent.y;
  foreman.x = battle.player.x + 80;
  foreman.y = battle.player.y;
  foreman.cancelAttack();
  foreman.updateVisuals();
  battle.player.updateVisuals();
  until(battle, () => foreman.getCurrentAttack()?.id === 'foreman_clipboard_check',
    'Foreman opens with Clipboard Check');
  tick(battle);
  check(foreman.roleCueText.text === 'CLIPBOARD!', 'Clipboard Check has a visible startup callout');
  until(battle, () => foreman.getCurrentAttack() === null, 'Clipboard Check reaches recovery end');
  tick(battle);

  foreman.x = battle.player.x + 184;
  foreman.y = battle.player.y;
  foreman.updateVisuals();
  until(battle, () => foreman.getCurrentAttack()?.id === 'foreman_forklift_charge',
    'Foreman escalates into Forklift Charge');
  tick(battle);
  check(foreman.roleCueText.text === 'FORKLIFT →', 'Forklift Charge signals its direction');
  until(battle, () => foreman.getCurrentAttack() === null, 'Forklift Charge reaches recovery end');
  tick(battle);

  foreman.x = foremanVent.x;
  foreman.y = foremanVent.y;
  battle.player.x = foremanVent.x - 200;
  battle.player.y = foremanVent.y;
  foreman.updateVisuals();
  battle.player.updateVisuals();
  until(battle, () => foreman.getCurrentAttack()?.id === 'foreman_steam_whistle',
    'Foreman completes the pattern with Steam Drill');
  tick(battle);
  check(foreman.roleCueText.text === 'STEAM DRILL!'
    && battle.stageInteractions.getSnapshot(foremanVent.id).phase === 'telegraph',
  'Steam Drill and the vent visibly warn before firing');
  const foremanHpBeforeBackfire = foreman.hp;
  until(battle, () => battle.stageInteractions.getSnapshot(foremanVent.id).phase === 'active',
    'Commanded vent reaches its active phase');
  check(foreman.hp === foremanHpBeforeBackfire - Math.ceil(foremanVent.damage * 1.5)
    && foreman.state === 'knockdown', 'Foreman can be knocked down by his own stronger steam backfire');
  check(foreman.roleCueText.text === 'SAFETY LAST!', 'Backfire produces a mechanical comedy punish window');

  kill(foreman);
  tick(battle);
  check(battle.encounterDirector.getPhase() === 'clear_delay' && battle.stageInteractions.getCount() === 0,
    'Midboss defeat clears its commanded hazard immediately');

  while (battle.waveIndex < battle.waveStage.sections.length - 1) advanceEncounter(battle);
  battle.waveEnemies.forEach(kill);
  tick(battle);
  until(battle, () => battle.encounterDirector.getPhase() === 'victory', 'Final encounter reaches victory');
  check(battle.battleFlow.getResult() === 'victory' && battle.stageInteractions.getCount() === 0,
    'Victory leaves no interaction state behind');

  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();
  output.textContent = `PASS — ${checks.length} G6 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual feel and device acceptance remain separate.`;
  document.title = `PASS G6 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G6';
}
