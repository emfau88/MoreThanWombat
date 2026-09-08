// Development-only G3 harness. It proves the seven-encounter composition in real Phaser scenes.
import '../../src/main.ts';
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
function tick(battle, ms = 50) {
  battle.update(0, ms);
  battle.cameras.main.preRender();
}
function untilPhase(battle, phase) {
  for (let i = 0; i < 120 && battle.encounterDirector.getPhase() !== phase; i++) tick(battle);
  check(battle.encounterDirector.getPhase() === phase, `Phase ${phase} at encounter ${battle.waveIndex + 1}`);
}
function kill(fighter) {
  fighter.receiveHit({ damage: 10000, hitstunMs: 1, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' });
}

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('BattleScene', { mode: 'waves', playerFighterId: 'wombat' });
  for (let i = 0; i < 200 && !game.scene.isActive('BattleScene'); i++) await sleep(10);
  const battle = game.scene.getScene('BattleScene');
  game.loop.stop();
  battle.inputController.consumePlayerInput = () => input;
  battle.player.setCombatResponse('invulnerable');
  check(battle.waveStage.sections.length === 7, 'Stage owns exactly seven data-driven encounters');
  check(new Set(battle.waveStage.sections.map((section) => section.objective)).size === 7, 'Every encounter has a distinct player objective');
  check(battle.waveStage.sections.every((section) => section.completionRule.type === 'defeat_all'), 'All shipped G3 encounters use defeat_all');

  let zoneTravelCount = 0;
  let subWaveCount = 0;
  for (let encounter = 0; encounter < 7; encounter++) {
    const section = battle.waveStage.sections[encounter];
    untilPhase(battle, 'spawning');
    check(battle.waveEnemies.length === section.enemies.length, `${section.title}: complete roster created`);
    check(battle.waveEnemies.every((enemy) => enemy.getCombatResponse() === 'invulnerable' && !enemy.getCurrentAttack()), `${section.title}: entry is protected and inert`);
    for (let i = 0; i < battle.waveEnemies.length; i++) {
      const spawn = section.enemies[i];
      const enemy = battle.waveEnemies[i];
      const entry = battle.waveEnemyEntries.get(enemy.instanceId);
      const directional = spawn.entryDirection === 'right' ? entry.startX >= entry.targetX
        : spawn.entryDirection === 'left' ? entry.startX <= entry.targetX
          : spawn.entryDirection === 'lower_lane' ? entry.startY >= entry.targetY
            : entry.startY <= entry.targetY;
      check(directional, `${section.title}: ${spawn.id} uses its authored entry direction`);
      check(enemy.container.visible === (spawn.entryDelayMs === 0), `${section.title}: ${spawn.id} obeys its entry delay`);
    }
    untilPhase(battle, 'active');
    const activated = new Set(battle.waveEnemies.filter((enemy) => battle.isWaveEnemyCombatActive(enemy)).map((enemy) => enemy.instanceId));
    for (let i = 0; i < 50 && activated.size < battle.waveEnemies.length; i++) {
      tick(battle);
      for (const enemy of battle.waveEnemies) {
        if (battle.isWaveEnemyCombatActive(enemy)) activated.add(enemy.instanceId);
        else check(!enemy.getCurrentAttack() && enemy.getCombatResponse() === 'invulnerable', `${section.title}: delayed enemy stays harmless`);
      }
    }
    check(activated.size === battle.waveEnemies.length, `${section.title}: every staged enemy activates`);
    check(battle.waveEnemies.every((enemy) => enemy.container.visible && battle.isEnemyVisibleForAttack(enemy)), `${section.title}: active enemies are visible and eligible`);
    const projectile = Object.values(projectilesById)[0];
    battle.projectileSystem.spawn(battle.waveEnemies[0], projectile);
    battle.waveEnemies.forEach(kill);
    tick(battle);
    check(battle.projectileSystem.getActiveOwnerIds().length === 0, `${section.title}: clear removes projectiles`);

    const next = battle.waveStage.sections[encounter + 1];
    if (!next) {
      untilPhase(battle, 'victory');
      continue;
    }
    const before = { x: battle.player.x, y: battle.player.y };
    if (next.zoneId === section.zoneId) {
      untilPhase(battle, 'transition');
      check(battle.waveTraversalPhase === 'transition', `${section.title}: sub-wave skips travel`);
      untilPhase(battle, 'section_intro');
      check(battle.player.x === before.x && battle.player.y === before.y, `${section.title}: sub-wave keeps player position`);
      subWaveCount += 1;
    } else {
      untilPhase(battle, 'travel');
      input = { moveX: 1, moveY: 0 };
      for (let i = 0; i < 240 && battle.encounterDirector.getPhase() === 'travel'; i++) tick(battle);
      input = { moveX: 0, moveY: 0 };
      check(battle.encounterDirector.getPhase() === 'transition', `${section.title}: player crosses the zone arrival trigger`);
      untilPhase(battle, 'section_intro');
      zoneTravelCount += 1;
    }
  }
  check(subWaveCount === 4, 'Four same-zone transitions run without travel');
  check(zoneTravelCount === 2, 'Travel occurs exactly twice between three zones');
  check(battle.battleFlow.getResult() === 'victory', 'Seventh encounter produces Stage victory');
  check(battle.waveEnemies.length === 0 && battle.projectileSystem.getActiveOwnerIds().length === 0, 'Victory leaves no enemy or projectile softlock');

  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();
  output.textContent = `PASS — ${checks.length} G3 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual balance acceptance remains separate.`;
  document.title = `PASS G3 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G3';
}
