// Development-only executable harness; Vite's production entry does not import it.
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
const neutral = { moveX: 0, moveY: 0 };
let input = neutral;
async function start(mode, fighter = 'wombat') {
  game.loop.start();
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('BattleScene', { mode, playerFighterId: fighter });
  for (let i = 0; i < 200 && !game.scene.isActive('BattleScene'); i++) await sleep(10);
  const battle = game.scene.getScene('BattleScene');
  game.loop.stop();
  input = neutral;
  battle.inputController.consumePlayerInput = () => input;
  return battle;
}
function tick(battle, ms = 50) {
  battle.update(0, ms);
  battle.cameras.main.preRender();
}
function until(battle, phase) {
  for (let i = 0; i < 100 && battle.encounterDirector.getPhase() !== phase; i++) tick(battle);
  check(battle.encounterDirector.getPhase() === phase, `Phase ${phase}, section ${battle.waveIndex + 1}`);
}
function kill(enemy) { enemy.receiveHit({ damage: 10000, hitstunMs: 1, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' }); }
function owners(battle) { return battle.projectileSystem.getActiveOwnerIds(); }

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');
  for (const fighter of ['wombat', 'discount_wizard', 'budget_barbarian', 'mara_breach']) {
    const battle = await start('waves', fighter);
    check(battle.encounterDirector.getPhase() === 'section_intro', `${fighter}: restart begins at intro`);
    battle.player.setManaForDebug(10);
    for (let section = 0; section < 3; section++) {
      const mana = battle.player.mana;
      until(battle, 'spawning');
      check(battle.waveEnemies.every((enemy) => !enemy.getCurrentAttack()), 'Entry has no enemy attacks');
      check(owners(battle).length === 0, 'Entry has no projectiles');
      const actors = [battle.player, ...battle.waveEnemies];
      for (let i = 1; i < actors.length; i++) {
        check(battle.isEnemyVisibleForAttack(actors[i]), 'Spawn visible in actual camera');
        for (let j = 0; j < i; j++) check(Math.hypot(actors[i].x - actors[j].x, actors[i].y - actors[j].y) >= 112, 'Spawn separation');
      }
      until(battle, 'active');
      check(battle.player.mana === mana, 'No mana during intro/entry');
      tick(battle);
      check(battle.player.mana > mana, 'Mana regenerates during active combat');
      const enemy = battle.waveEnemies[0];
      const projectile = Object.values(projectilesById)[0];
      battle.projectileSystem.spawn(enemy, projectile);
      check(owners(battle).length === 1, 'Real projectile created for cleanup check');
      battle.waveEnemies.forEach(kill);
      tick(battle);
      check(owners(battle).length === 0, 'Clear removes actual projectile objects');
      const clearMana = battle.player.mana;
      until(battle, section === 2 ? 'victory' : 'travel');
      check(battle.player.mana === clearMana, 'No mana during clear delay');
      if (section < 2) {
        for (let i = 0; i < 100; i++) tick(battle);
        check(battle.player.mana === clearMana, 'Five seconds travel waiting gives no mana');
        input = { moveX: 1, moveY: 0 };
        for (let i = 0; i < 200 && battle.encounterDirector.getPhase() === 'travel'; i++) tick(battle);
        input = neutral;
        check(battle.encounterDirector.getPhase() === 'transition', 'Walking crosses arrival trigger');
        const arrivalX = battle.player.x;
        until(battle, 'section_intro');
        check(battle.player.x === arrivalX, 'Transition preserves player position');
        check(battle.player.mana === clearMana, 'No transition mana');
      }
    }
    check(battle.battleFlow.getResult() === 'victory', `${fighter}: full three-section flow reaches victory`);
    const mana = battle.player.mana;
    for (let i = 0; i < 20; i++) tick(battle);
    check(battle.player.mana === mana && owners(battle).length === 0, 'Victory freezes mana and hazards');
  }
  let battle = await start('waves');
  until(battle, 'active');
  const enemy = battle.waveEnemies[0];
  check(battle.requestEnemyAttack(enemy, 'basic'), 'Wave attack receives a token');
  battle.tryStartAttackWithFx(enemy, 'basic');
  enemy.receiveHit({ damage: 1, hitstunMs: 100, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' });
  battle.reconcileWaveAttackTokens();
  check(battle.encounterDirector.getTokenUsage().melee === 0, 'Actual Fighter hit interrupt releases token');
  battle.projectileSystem.spawn(enemy, Object.values(projectilesById)[0]);
  kill(battle.player);
  tick(battle);
  check(battle.battleFlow.getResult() === 'defeat' && owners(battle).length === 0, 'Defeat clears actual projectile and enemy objects');
  check(!battle.encounterDirector.canRegenerateMana(), 'Defeat disables mana');
  battle = await start('waves');
  check(battle.waveIndex === 0 && battle.encounterDirector.getTokenUsage().melee === 0, 'Restart has fresh director and no tokens');
  until(battle, 'active');
  battle.waveEnemies.forEach(kill);
  kill(battle.player);
  tick(battle);
  check(battle.battleFlow.getResult() === 'defeat', 'Simultaneous player/enemy death cannot start travel or victory');
  battle = await start('duel');
  check(battle.encounterDirector === null && battle.enemy, 'Duel creates its ordinary enemy without Director');
  battle.player.setManaForDebug(10);
  tick(battle);
  check(battle.player.mana > 10, 'Duel mana unchanged');
  kill(battle.enemy);
  tick(battle);
  check(battle.battleFlow.getResult() === 'victory', 'Duel victory unchanged');
  battle = await start('test');
  check(battle.combatGym && !battle.encounterDirector, 'Gym creates its existing diagnostic controls');
  battle.player.setManaForDebug(10);
  battle.combatGym.clock.togglePause();
  tick(battle);
  check(battle.player.mana === 10, 'Paused Gym cannot regenerate mana');
  battle.combatGym.clock.togglePause();
  tick(battle);
  check(battle.player.mana > 10, 'Unpaused Gym regenerates as before');
  output.textContent = `PASS — ${checks.length} runtime checks\n${checks.join('\n')}\nScripted diagnostics; not a balance or real-device playtest.`;
  document.title = `PASS G1 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G1';
}
