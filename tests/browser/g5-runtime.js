// Development-only G5 harness. Exercises movement, chains and air control on real Phaser fighters.
import '../../src/main.ts';
import { PLAYER_MOVEMENT_CONTRACT } from '../../src/game/combat/MovementContract.ts';
import { attacksById } from '../../src/game/data/attacks.ts';
import { fighterDefinitions } from '../../src/game/data/fighters.ts';

const output = document.querySelector('#results');
const checks = [];
function check(condition, label) {
  if (!condition) throw new Error(label);
  checks.push(label);
  output.textContent = `RUNNING — ${checks.length} checks\n${checks.join('\n')}`;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const game = window.__MORE_THAN_WOMBAT_GAME__;
const players = ['wombat', 'discount_wizard', 'budget_barbarian', 'mara_breach'];

async function start(playerFighterId = 'wombat') {
  game.loop.start();
  for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
  game.scene.start('BattleScene', { mode: 'test', playerFighterId, enemyFighterId: 'angry_pigeon' });
  for (let i = 0; i < 200 && !game.scene.isActive('BattleScene'); i++) await sleep(10);
  const battle = game.scene.getScene('BattleScene');
  game.loop.stop();
  battle.player.x = 360;
  battle.player.y = 360;
  battle.enemy.x = 700;
  battle.enemy.y = 360;
  battle.player.updateVisuals();
  battle.enemy.updateVisuals();
  return battle;
}

function advanceTo(fighter, elapsedTarget, bounds, step = 10) {
  for (let guard = 0; guard < 200 && fighter.getAttackElapsedMs() < elapsedTarget; guard++) {
    const remaining = elapsedTarget - fighter.getAttackElapsedMs();
    fighter.update(Math.min(step, remaining) / 1000, 0, 0, bounds);
  }
}

function advanceOnceTo(fighter, elapsedTarget, bounds) {
  const remaining = elapsedTarget - fighter.getAttackElapsedMs();
  if (remaining > 0) fighter.update(remaining / 1000, 0, 0, bounds);
}

try {
  for (let i = 0; i < 1200 && !game.scene.isActive('MainMenuScene'); i++) await sleep(50);
  check(game.scene.isActive('MainMenuScene'), 'Real assets loaded and Main Menu created');

  for (const playerId of players) {
    const battle = await start(playerId);
    const fighter = battle.player;
    const definition = fighterDefinitions[playerId];
    const chain = definition.attacks.basicChain;
    check(chain?.length === 3, `${fighter.label}: three-step chain is data-driven`);

    fighter.update((PLAYER_MOVEMENT_CONTRACT.runActivationMs - 1) / 1000, 1, 0, battle.arenaBounds);
    check(fighter.state === 'walk', `${fighter.label}: Run does not trigger before its hold threshold`);
    fighter.update(0.001, 1, 0, battle.arenaBounds);
    check(fighter.state === 'run', `${fighter.label}: full direction hold starts Run`);
    const walkEquivalent = fighter.moveSpeed * 0.1;
    const runX = fighter.x;
    fighter.update(0.1, 1, 0, battle.arenaBounds);
    check(fighter.x - runX > walkEquivalent * 1.35, `${fighter.label}: Run has meaningful extra speed`);

    check(fighter.tryStartAttack('basic'), `${fighter.label}: ATK during Run starts an attack`);
    check(fighter.state === 'dashAttack' && fighter.getCurrentAttack()?.id === definition.attacks.dashAttack,
      `${fighter.label}: Run ATK selects its authored Dash Attack`);
    const dashX = fighter.x;
    fighter.update(0.1, -1, 0, battle.arenaBounds);
    check(fighter.x > dashX && fighter.facing === 'right', `${fighter.label}: Dash Attack commits forward despite reverse input`);
    fighter.cancelAttack();

    check(fighter.tryStartAttack('basic'), `${fighter.label}: grounded ATK starts chain step 1`);
    fighter.consumePendingAttackStart();
    let current = fighter.getCurrentAttack();
    advanceTo(fighter, current.basicChainWindow.inputOpenMs, battle.arenaBounds);
    check(fighter.tryBufferBasicChain(), `${fighter.label}: one ATK buffers chain step 2`);
    check(!fighter.tryBufferBasicChain(), `${fighter.label}: the same step cannot queue twice`);
    fighter.registerHit(String(battle.enemy.instanceId));
    advanceOnceTo(fighter, current.basicChainWindow.hitCancelMs, battle.arenaBounds);
    check(fighter.getCurrentAttack()?.id === chain[1] && fighter.getBasicChainStep() === 2,
      `${fighter.label}: confirmed hit cancels into step 2`);
    check(fighter.consumePendingAttackStart()?.id === chain[1], `${fighter.label}: step 2 emits one presentation start`);

    current = fighter.getCurrentAttack();
    advanceTo(fighter, current.basicChainWindow.inputOpenMs, battle.arenaBounds);
    check(fighter.tryBufferBasicChain(), `${fighter.label}: one ATK buffers chain finisher`);
    fighter.registerHit(String(battle.enemy.instanceId));
    advanceOnceTo(fighter, current.basicChainWindow.hitCancelMs, battle.arenaBounds);
    check(fighter.getCurrentAttack()?.id === chain[2] && fighter.getBasicChainStep() === 3,
      `${fighter.label}: step 3 is the authored finisher`);
    check(fighter.getCurrentAttack()?.hitReaction === 'knockdown', `${fighter.label}: finisher knocks down`);
    check(!fighter.tryBufferBasicChain(), `${fighter.label}: chain cannot loop past step 3`);
    check(!fighter.tryStartAttack('special'), `${fighter.label}: Special cannot cancel the active basic chain`);
  }

  let battle = await start('wombat');
  let fighter = battle.player;
  check(fighter.tryStartAttack('basic'), 'Whiff timing starts from a fresh basic');
  fighter.consumePendingAttackStart();
  const whiffAttack = fighter.getCurrentAttack();
  advanceTo(fighter, whiffAttack.basicChainWindow.inputOpenMs, battle.arenaBounds);
  check(fighter.tryBufferBasicChain(), 'Whiff continuation accepts one rhythmic buffered ATK');
  advanceOnceTo(fighter, whiffAttack.basicChainWindow.hitCancelMs, battle.arenaBounds);
  check(fighter.getCurrentAttack()?.id === whiffAttack.id, 'Whiff cannot use the early hit-confirm cancel');
  advanceOnceTo(fighter, whiffAttack.basicChainWindow.whiffCancelMs, battle.arenaBounds);
  check(fighter.getBasicChainStep() === 2, 'Whiff continues only at its later punishable cancel');

  battle = await start('wombat');
  fighter = battle.player;
  check(fighter.tryStartJump(), 'Jump starts for Air Bonk control proof');
  const jumpStartX = fighter.x;
  fighter.update(0.12, 1, 0.5, battle.arenaBounds);
  const beforeBonk = { x: fighter.x, y: fighter.y, z: fighter.z };
  check(beforeBonk.x > jumpStartX && beforeBonk.z > 0, 'Jump accepts horizontal and lane movement');
  check(fighter.tryStartAirAttack(), 'ATK in the air starts Air Bonk');
  fighter.update(0.08, -1, -0.5, battle.arenaBounds);
  const firstCorrectionX = fighter.x;
  check(firstCorrectionX < beforeBonk.x && fighter.y < beforeBonk.y, 'Air Bonk accepts a first direction correction');
  check(fighter.z !== beforeBonk.z && fighter.velocityZ !== 0, 'Air Bonk preserves jump arc and gravity');
  fighter.update(0.08, 1, 0.5, battle.arenaBounds);
  check(fighter.x > firstCorrectionX && fighter.facing === 'right', 'Air Bonk accepts repeated mid-air direction correction');
  check(attacksById.air_bonk.canMoveDuringAttack && attacksById.air_bonk.canTurnDuringAttack,
    'Air Bonk explicitly authors movement and facing control');

  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();
  output.textContent = `PASS — ${checks.length} G5 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual rhythm and device acceptance remain separate.`;
  document.title = `PASS G5 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G5';
}
