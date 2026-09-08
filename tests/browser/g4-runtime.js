// Development-only G4 harness. It exercises defense and recovery on real Phaser fighters.
import '../../src/main.ts';
import { PLAYER_DEFENSE_CONTRACT } from '../../src/game/combat/DefenseContract.ts';

const output = document.querySelector('#results');
const checks = [];
function check(condition, label) {
  if (!condition) throw new Error(label);
  checks.push(label);
  output.textContent = `RUNNING — ${checks.length} checks\n${checks.join('\n')}`;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const game = window.__MORE_THAN_WOMBAT_GAME__;
const neutral = { moveX: 0, moveY: 0, attackPressed: false, specialPressed: false,
  ultimatePressed: false, jumpPressed: false, defendPressed: false, debugTogglePressed: false,
  restartPressed: false, menuPressed: false };
let input = neutral;
function tick(battle, ms = 50) {
  battle.update(0, ms);
  battle.cameras.main.preRender();
  input = neutral;
}
async function start() {
  game.loop.start();
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('BattleScene', { mode: 'test', playerFighterId: 'wombat', enemyFighterId: 'angry_pigeon' });
  for (let i = 0; i < 200 && !game.scene.isActive('BattleScene'); i++) await sleep(10);
  const battle = game.scene.getScene('BattleScene');
  game.loop.stop();
  battle.inputController.consumePlayerInput = () => input;
  battle.player.x = 420;
  battle.player.y = 350;
  battle.enemy.x = 466;
  battle.enemy.y = 350;
  battle.player.updateVisuals();
  battle.enemy.updateVisuals();
  return battle;
}

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');

  let battle = await start();
  const hpBeforeGuard = battle.player.hp;
  check(battle.enemy.tryStartAttackById('pigeon_peck', 'basic'), 'Pigeon starts a real light attack');
  input = { ...neutral, defendPressed: true };
  tick(battle, 50);
  tick(battle, 100);
  check(battle.player.state === 'guard', `Neutral defend starts Guard (got ${battle.player.state})`);
  check(battle.player.hp === hpBeforeGuard, 'Guard blocks a real melee hit without damage');
  check(battle.combatFeedback.getLastImpactDebugInfo()?.outcome === 'blocked', 'Block remains a distinct combat outcome');
  battle.player.update((PLAYER_DEFENSE_CONTRACT.guardActiveMs - 150 + 1) / 1000, 0, 0, battle.arenaBounds);
  check(battle.player.state === 'guard' && battle.player.getCombatResponse() === 'normal', 'Guard has punishable recovery');
  check(battle.player.tryStartDefense(0, 0) === null, 'Guard cannot retrigger during recovery');
  battle.player.update((PLAYER_DEFENSE_CONTRACT.guardRecoveryMs + 100) / 1000, 0, 0, battle.arenaBounds);
  check(battle.player.state === 'idle', 'Guard returns idle before its reuse cooldown');
  battle.combatFeedback.advance(100);

  const evadeStartY = battle.player.y;
  input = { ...neutral, moveY: 1, defendPressed: true };
  tick(battle, PLAYER_DEFENSE_CONTRACT.evadeStartupMs);
  check(battle.player.state === 'evade', 'Directional defend starts Evade');
  check(battle.player.getCombatResponse() === 'invulnerable', 'Evade enters its precise invulnerability window');
  check(battle.player.y > evadeStartY, 'Evade moves along the requested lane direction');
  tick(battle, PLAYER_DEFENSE_CONTRACT.evadeInvulnerableMs);
  check(battle.player.state === 'evade' && battle.player.getCombatResponse() === 'normal', 'Evade recovery is vulnerable');
  const recoveryY = battle.player.y;
  tick(battle, PLAYER_DEFENSE_CONTRACT.evadeRecoveryMs);
  check(battle.player.state === 'idle' && battle.player.y === recoveryY, 'Evade stops moving during recovery and returns idle');

  battle = await start();
  const hpBeforeBreak = battle.player.hp;
  check(battle.enemy.tryStartAttackById('wombat_belly_slam', 'special'), 'Enemy starts an authored guard-break move');
  input = { ...neutral, defendPressed: true };
  tick(battle, 50);
  tick(battle, 180);
  check(battle.combatFeedback.getLastImpactDebugInfo()?.outcome === 'guard_broken', 'Heavy move produces guard_broken');
  check(battle.player.hp === hpBeforeBreak - 7 && battle.player.state === 'hitstun', 'Guard break deals reduced damage and hitstun');
  check(battle.player.getCombatResponse() === 'invulnerable', 'Hitstun prevents alternating crowd re-hits');

  battle = await start();
  battle.player.receiveHit({ damage: 1, hitstunMs: 0, knockbackX: 40, knockbackY: 0,
    sourceFacing: 'right', launchVelocityZ: 420, hitReaction: 'launch' });
  check(battle.player.state === 'launched' && !battle.player.isGrounded, 'Launch is distinct from ordinary hitstun');
  check(battle.player.getCombatResponse() === 'invulnerable', 'Launched fighter cannot be juggled indefinitely');
  const phases = new Set([battle.player.state]);
  for (let i = 0; i < 80 && battle.player.state !== 'wake_up'; i++) {
    battle.player.update(0.05, 0, 0, battle.arenaBounds);
    phases.add(battle.player.state);
  }
  check(phases.has('knockdown') && phases.has('grounded') && phases.has('wake_up'), 'Launch reaches knockdown, grounded and wake-up in order');
  check(battle.player.getHurtbox() !== null && battle.player.getCombatResponse() === 'invulnerable', 'Wake-up has visible protected hurtbox');
  battle.player.update((PLAYER_DEFENSE_CONTRACT.wakeUpInvulnerableMs + 1) / 1000, 0, 0, battle.arenaBounds);
  check(battle.player.state === 'wake_up' && battle.player.getCombatResponse() === 'normal', 'Wake-up protection ends before recovery');
  battle.player.update(PLAYER_DEFENSE_CONTRACT.wakeUpRecoveryMs / 1000, 0, 0, battle.arenaBounds);
  check(battle.player.state === 'idle', 'Wake-up completes without a stuck state');
  battle.player.receiveHit({ damage: 10000, hitstunMs: 1, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' });
  check(battle.player.state === 'dead', 'Death remains distinct from normal knockdown');

  battle = await start();
  for (const phase of ['guard', 'evade', 'launched', 'knockdown', 'wake_up']) {
    battle.enemy.setDefensePhaseForDebug(phase);
    check(battle.enemy.state === phase, `Combat Gym exposes ${phase} preset`);
  }

  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();
  output.textContent = `PASS — ${checks.length} G4 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual game-feel acceptance remains separate.`;
  document.title = `PASS G4 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G4';
}
