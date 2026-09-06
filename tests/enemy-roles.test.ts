import assert from 'node:assert/strict';
import test from 'node:test';
import { EnemyController, type EnemyRoleActor } from '../src/game/ai/EnemyController';
import {
  enemyRoleContracts,
  enemyRoleProofPairs,
  fighterEnemyRoles,
  type EnemyRoleId,
} from '../src/game/ai/EnemyRoles';
import { EncounterDirector } from '../src/game/core/EncounterDirector';

type MutableRoleActor = EnemyRoleActor & {
  attack: { id: string } | null;
  phase: ReturnType<EnemyRoleActor['getAttackPhase']>;
};

function actor(id: string, instanceId: number, x: number, y: number): MutableRoleActor {
  const result: MutableRoleActor = {
    id,
    instanceId,
    x,
    y,
    facing: x > 0 ? 'left' : 'right',
    state: 'idle',
    isGrounded: true,
    attack: null,
    phase: 'none',
    getCurrentAttack: () => result.attack,
    getAttackPhase: () => result.phase,
  };
  return result;
}

test('G2 defines four complete role contracts with one mechanical comedy signature each', () => {
  assert.deepEqual(Object.keys(enemyRoleContracts), ['pursuer', 'flanker', 'heavy', 'zoner']);
  for (const contract of Object.values(enemyRoleContracts)) {
    assert.equal(contract.id.length > 0, true);
    assert.ok(contract.preferredDistance.minX < contract.preferredDistance.maxX);
    assert.ok(contract.entryBehavior && contract.attackBehavior && contract.recoveryBehavior && contract.repositionBehavior);
    assert.deepEqual(Object.keys(contract.reactions), ['guard', 'evade', 'projectile', 'armorBreak', 'knockdown']);
    assert.ok(contract.weakness.length > 20);
    assert.ok(contract.comedySignature.length > 20);
  }
  assert.deepEqual(fighterEnemyRoles, {
    angry_pigeon: 'pursuer', scrap_flanker: 'flanker', scrap_heavy: 'heavy', discount_wizard: 'zoner',
  });
});

test('pair proof matrix gives every role at least two distinct partners', () => {
  const partners = new Map<EnemyRoleId, Set<EnemyRoleId>>();
  for (const [left, right] of enemyRoleProofPairs) {
    assert.notEqual(left, right);
    if (!partners.has(left)) partners.set(left, new Set());
    if (!partners.has(right)) partners.set(right, new Set());
    partners.get(left)?.add(right);
    partners.get(right)?.add(left);
  }
  for (const roleId of Object.keys(enemyRoleContracts) as EnemyRoleId[]) {
    assert.ok((partners.get(roleId)?.size ?? 0) >= 2, `${roleId} needs two pair proofs`);
  }
});

test('every G2 role pair can commit through one shared Director without bypassing its channels', () => {
  const target = actor('wombat', 90, 0, 0);
  const setup: Record<EnemyRoleId, { fighterId: string; x: number; y: number }> = {
    pursuer: { fighterId: 'angry_pigeon', x: 60, y: 0 },
    flanker: { fighterId: 'scrap_flanker', x: 150, y: 74 },
    heavy: { fighterId: 'scrap_heavy', x: 90, y: 0 },
    zoner: { fighterId: 'discount_wizard', x: 200, y: 0 },
  };

  for (const [leftRole, rightRole] of enemyRoleProofPairs) {
    const director = new EncounterDirector({ sectionCount: 1, sectionIntroMs: 0, spawnEntryMs: 0,
      pressureProfiles: [{ meleeTokens: 2, rangedTokens: 1, disruptionBudget: 1 }] });
    director.advance(0, false);
    director.advance(0, false);
    const leftData = setup[leftRole];
    const rightData = setup[rightRole];
    const left = actor(leftData.fighterId, 11, leftData.x, leftData.y);
    const right = actor(rightData.fighterId, 12, rightData.x, rightData.y);
    const leftController = new EnemyController(leftRole, 1);
    const rightController = new EnemyController(rightRole, 1);
    const leftIntent = leftController.update(left, target, 1 / 60,
      (kind) => director.requestAttack(left.instanceId, leftController.getPressureChannel(kind, left)));
    director.advance(300, false);
    const rightIntent = rightController.update(right, target, 1 / 60,
      (kind) => director.requestAttack(right.instanceId, rightController.getPressureChannel(kind, right)));
    assert.ok(leftIntent.attackPressed, `${leftRole} should commit beside ${rightRole}`);
    assert.ok(rightIntent.attackPressed, `${rightRole} should commit beside ${leftRole}`);
    assert.equal(Object.values(director.getTokenUsage()).reduce((sum, value) => sum + value, 0), 2);
  }
});

test('the four roles make recognizably different solo decisions and spend their declared channels', () => {
  const target = actor('wombat', 90, 0, 0);
  const cases = [
    { role: 'pursuer' as const, enemy: actor('angry_pigeon', 1, 60, 0), kind: 'basic', attackId: undefined, channel: 'melee' },
    { role: 'flanker' as const, enemy: actor('scrap_flanker', 2, 150, 74), kind: 'special', attackId: 'scrap_flanker_charge', channel: 'disruption' },
    { role: 'heavy' as const, enemy: actor('scrap_heavy', 3, 90, 0), kind: 'special', attackId: 'scrap_heavy_bash', channel: 'melee' },
    { role: 'zoner' as const, enemy: actor('discount_wizard', 4, 200, 0), kind: 'special', attackId: 'discount_fireball_cast', channel: 'ranged' },
  ];

  for (const item of cases) {
    const controller = new EnemyController(item.role, 1);
    const intent = controller.update(item.enemy, target, 1 / 60, () => true);
    assert.equal(intent.attackPressed, true, `${item.role} should commit from its preferred position`);
    assert.equal(intent.attackKind, item.kind);
    assert.equal(intent.attackId, item.attackId);
    assert.equal(controller.getPressureChannel(intent.attackKind, item.enemy), item.channel);
  }
});

test('Pursuer whiff overextends, while a connected peck skips the joke window', () => {
  const target = actor('wombat', 90, 0, 0);
  const pigeon = actor('angry_pigeon', 1, 60, 0);
  const whiff = new EnemyController('pursuer');
  pigeon.attack = { id: 'pigeon_peck' };
  pigeon.phase = 'active';
  whiff.update(pigeon, target, 1 / 60);
  pigeon.attack = null;
  pigeon.phase = 'none';
  const whiffIntent = whiff.update(pigeon, target, 1 / 60);
  assert.equal(whiffIntent.state, 'comic_whiff');
  assert.notEqual(whiffIntent.moveX, 0);
  assert.equal(whiff.getPresentation(pigeon).cue, 'WHOOPS!');

  const connected = new EnemyController('pursuer');
  pigeon.attack = { id: 'pigeon_peck' };
  pigeon.phase = 'active';
  connected.update(pigeon, target, 1 / 60);
  connected.notifyAttackConnected();
  pigeon.attack = null;
  pigeon.phase = 'none';
  assert.notEqual(connected.update(pigeon, target, 1 / 60).state, 'comic_whiff');
});

test('Flanker commits down one lane and crashes after a missed charge', () => {
  const target = actor('wombat', 90, 0, 0);
  const flanker = actor('scrap_flanker', 2, 150, 74);
  const controller = new EnemyController('flanker', 1);
  const commit = controller.update(flanker, target, 1 / 60, () => true);
  assert.equal(commit.attackId, 'scrap_flanker_charge');
  flanker.attack = { id: 'scrap_flanker_charge' };
  flanker.phase = 'active';
  assert.equal(controller.update(flanker, target, 1 / 60).moveX, -1);
  flanker.attack = null;
  flanker.phase = 'none';
  assert.equal(controller.update(flanker, target, 1 / 60).state, 'comic_crash');
  assert.equal(controller.getPresentation(flanker).cue, 'CRASH!');
});

test('Heavy breaks armor on the second contact and permanently changes response and pace', () => {
  const target = actor('wombat', 90, 0, 0);
  const heavy = actor('scrap_heavy', 3, 220, 0);
  const controller = new EnemyController('heavy');
  assert.equal(controller.getCombatResponse(heavy), 'armor');
  assert.equal(controller.notifyArmoredContact(heavy), false);
  assert.equal(controller.getPresentation(heavy).cue, 'ARMOR ◆');
  const armoredApproach = controller.update(heavy, target, 1 / 60).moveX;
  assert.equal(controller.notifyArmoredContact(heavy), true);
  assert.equal(controller.getCombatResponse(heavy), 'normal');
  assert.equal(controller.getPresentation(heavy).cue, 'ARMOR BREAK!');
  controller.update(heavy, target, 0.72);
  const exposedApproach = controller.update(heavy, target, 1 / 60).moveX;
  assert.ok(Math.abs(exposedApproach) > Math.abs(armoredApproach));
});

test('Zoner turns every third approved ranged commitment into a harmless dud and self-stagger', () => {
  const target = actor('wombat', 90, 0, 0);
  const wizard = actor('discount_wizard', 4, 200, 0);
  const controller = new EnemyController('zoner');
  const ids = [1, 2, 3].map(() => controller.update(wizard, target, 1 / 60, () => true).attackId);
  assert.deepEqual(ids, ['discount_fireball_cast', 'discount_fireball_cast', 'discount_enemy_miscast']);
  wizard.attack = { id: 'discount_enemy_miscast' };
  wizard.phase = 'active';
  controller.update(wizard, target, 1 / 60);
  wizard.attack = null;
  wizard.phase = 'none';
  assert.equal(controller.update(wizard, target, 1 / 60).state, 'comic_miscast');
  assert.equal(controller.getPresentation(wizard).cue, 'DUD!');
});
