// Development-only G2 executable harness. It exercises real Phaser Fighters and the Wave scene.
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
function tick(battle, ms = 50) {
  battle.update(0, ms);
  battle.cameras.main.preRender();
}
function untilPhase(battle, phase) {
  for (let i = 0; i < 100 && battle.encounterDirector.getPhase() !== phase; i++) tick(battle);
  check(battle.encounterDirector.getPhase() === phase, `Phase ${phase}, section ${battle.waveIndex + 1}`);
}
function kill(fighter) {
  fighter.receiveHit({ damage: 10000, hitstunMs: 1, knockbackX: 0, knockbackY: 0, sourceFacing: 'right' });
}
function roleOf(battle, fighter) {
  return battle.waveEnemyControllers.get(fighter.instanceId).getRoleId(fighter);
}
function advanceToNextSection(battle) {
  tick(battle);
  untilPhase(battle, 'travel');
  input = { moveX: 1, moveY: 0 };
  for (let i = 0; i < 220 && battle.encounterDirector.getPhase() === 'travel'; i++) tick(battle);
  input = { moveX: 0, moveY: 0 };
  check(battle.encounterDirector.getPhase() === 'transition', 'Travel enters next section');
  untilPhase(battle, 'section_intro');
  untilPhase(battle, 'spawning');
  untilPhase(battle, 'active');
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

  untilPhase(battle, 'spawning');
  check(battle.waveEnemies.every((enemy) => enemy.getCombatResponse() === 'invulnerable'), 'Role entry remains protected');
  untilPhase(battle, 'active');
  let pigeon = battle.waveEnemies[0];
  check(roleOf(battle, pigeon) === 'pursuer', 'Section 1 spawns the Pursuer contract');
  pigeon.cancelAttack();
  pigeon.x = battle.player.x + 60;
  pigeon.y = battle.player.y;
  tick(battle);
  check(pigeon.getCurrentAttack()?.id === 'pigeon_peck', 'Pursuer commits its short melee attack');
  battle.player.y = Math.min(battle.arenaBounds.maxY, pigeon.y + 100);
  const pigeonController = battle.waveEnemyControllers.get(pigeon.instanceId);
  for (let i = 0; i < 30 && pigeonController.getDebugSnapshot(pigeon).state !== 'comic_whiff'; i++) tick(battle);
  check(pigeonController.getDebugSnapshot(pigeon).state === 'comic_whiff', 'Missed Pigeon attack enters mechanical overextension');
  check(pigeon.roleCueText.visible && pigeon.roleCueText.text === 'WHOOPS!', 'Pursuer whiff is visibly telegraphed');
  kill(pigeon);
  advanceToNextSection(battle);

  const sectionTwoRoles = battle.waveEnemies.map((enemy) => roleOf(battle, enemy)).sort();
  check(sectionTwoRoles.join(',') === 'pursuer,zoner', 'Section 2 proves Pursuer + Zoner pairing');
  const wizard = battle.waveEnemies.find((enemy) => roleOf(battle, enemy) === 'zoner');
  battle.waveEnemies.filter((enemy) => enemy !== wizard).forEach(kill);
  tick(battle);
  const ExistingController = battle.waveEnemyControllers.get(wizard.instanceId).constructor;
  const wizardController = new ExistingController('zoner', wizard.instanceId);
  battle.waveEnemyControllers.set(wizard.instanceId, wizardController);
  const castIds = [];
  for (let cast = 0; cast < 3; cast++) {
    wizard.cancelAttack();
    wizard.setManaForDebug(wizard.maxMana);
    wizard.x = battle.player.x + 200;
    wizard.y = battle.player.y;
    const intent = wizardController.update(wizard, battle.player, 0.05, () => true);
    check(intent.attackPressed && battle.tryStartAttackByIdWithFx(wizard, intent.attackId, intent.attackKind), `Zoner cast ${cast + 1} starts on the real Fighter`);
    castIds.push(wizard.getCurrentAttack()?.id);
    wizardController.update(wizard, battle.player, 0.05, () => true);
    wizard.cancelAttack();
    battle.player.y = Math.abs(battle.arenaBounds.maxY - wizard.y) > Math.abs(battle.arenaBounds.minY - wizard.y)
      ? battle.arenaBounds.maxY : battle.arenaBounds.minY;
    wizardController.update(wizard, battle.player, 0.05, () => true);
  }
  check(castIds.join(',') === 'discount_fireball_cast,discount_fireball_cast,discount_enemy_miscast', `Every third Zoner cast is a deterministic harmless dud (${castIds.join(',')})`);
  check(wizardController.getDebugSnapshot(wizard).state === 'comic_miscast', 'Wizard dud enters self-stagger');
  battle.applyEnemyRolePresentation(wizard, wizardController);
  check(wizard.roleCueText.visible && wizard.roleCueText.text === 'DUD!', 'Zoner miscast remains visually readable');
  kill(wizard);
  advanceToNextSection(battle);

  const sectionThreeRoles = battle.waveEnemies.map((enemy) => roleOf(battle, enemy)).sort();
  check(sectionThreeRoles.join(',') === 'flanker,heavy', 'Section 3 proves Flanker + Heavy pairing');
  const heavy = battle.waveEnemies.find((enemy) => roleOf(battle, enemy) === 'heavy');
  const flanker = battle.waveEnemies.find((enemy) => roleOf(battle, enemy) === 'flanker');
  const heavyController = battle.waveEnemyControllers.get(heavy.instanceId);
  check(heavy.getCombatResponse() === 'armor' && heavy.roleCueText.text === 'ARMOR ◆◆', 'Heavy enters with two visible armor contacts');
  const armorImpact = { damage: 1, attackId: 'wombat_jab', outcome: 'armored', attacker: battle.player, defender: heavy };
  battle.handleEnemyRoleImpacts([armorImpact]);
  check(heavy.getCombatResponse() === 'armor' && heavyController.getPresentation(heavy).cue === 'ARMOR ◆', 'First contact removes one armor plate');
  battle.handleEnemyRoleImpacts([armorImpact]);
  check(heavy.getCombatResponse() === 'normal' && heavy.roleCueText.text === 'ARMOR BREAK!', 'Second contact visibly breaks armor and changes response');
  kill(heavy);
  tick(battle);

  const flankerController = battle.waveEnemyControllers.get(flanker.instanceId);
  const laneSide = flankerController.flankLaneSide;
  flanker.cancelAttack();
  flanker.x = battle.player.x + 150;
  flanker.y = battle.player.y + 74 * laneSide;
  tick(battle);
  check(flanker.getCurrentAttack()?.id === 'scrap_flanker_charge', 'Flanker aligns in another lane and commits its charge');
  battle.player.y = laneSide > 0 ? battle.arenaBounds.minY : battle.arenaBounds.maxY;
  for (let i = 0; i < 40 && flankerController.getDebugSnapshot(flanker).state !== 'comic_crash'; i++) tick(battle);
  check(flankerController.getDebugSnapshot(flanker).state === 'comic_crash', 'Missed Flanker charge enters the crash punish window');
  check(flanker.roleCueText.visible && flanker.roleCueText.text === 'CRASH!', 'Flanker crash is visibly telegraphed');

  const qualityChecks = [];
  for (let i = 0; i < 3; i++) {
    qualityChecks.push(battle.combatPresentation.getVfxQuality());
    battle.applyEnemyRolePresentation(flanker, flankerController);
    check(flanker.roleCueText.visible && flanker.roleCueText.text === 'CRASH!', `${qualityChecks.at(-1)} VFX keeps role cue readable`);
    battle.combatPresentation.cycleVfxQuality();
  }
  check(qualityChecks.join(',') === 'full,reduced,minimal', 'All three VFX quality levels exercised');
  check(battle.encounterDirector.getTokenUsage().disruption <= 1, 'Disruption pressure remains inside the Director budget');
  check(game.scene.isActive('BattleScene') && !game.scene.isActive('MainMenuScene'), 'G2 proof remains in the live Battle scene');
  game.loop.start(game.step.bind(game));
  await sleep(100);
  game.loop.stop();

  output.textContent = `PASS — ${checks.length} G2 runtime checks\n${checks.join('\n')}\nScripted diagnostics; manual feel acceptance remains separate.`;
  document.title = `PASS G2 — ${checks.length} checks`;
} catch (error) {
  game?.loop.stop();
  output.textContent = `FAIL after ${checks.length} checks\n${error.stack}\n${checks.join('\n')}`;
  document.title = 'FAIL G2';
}
