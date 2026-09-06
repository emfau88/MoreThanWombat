import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_GYM_FIGHTERS } from '../src/game/debug/CombatGymModel';
import {
  isShippableFighter,
  PROTOTYPE_FIGHTERS,
  REWORK_FIGHTERS,
  SHIPPABLE_DUEL_ENEMIES,
  SHIPPABLE_PLAYER_FIGHTERS,
  WAVE_ROLE_PROTOTYPES,
} from '../src/game/data/roster';
import { junkyardRunStage } from '../src/game/data/stages';
import { attacksById } from '../src/game/data/attacks';
import { fighterDefinitions } from '../src/game/data/fighters';

test('normal play exposes only the asset-approved roster and its approved Duel opponents', () => {
  assert.deepEqual(SHIPPABLE_PLAYER_FIGHTERS, ['wombat', 'discount_wizard', 'budget_barbarian', 'mara_breach']);
  assert.deepEqual(SHIPPABLE_DUEL_ENEMIES, ['angry_pigeon', 'discount_wizard']);
  assert.equal(isShippableFighter('buster_bulldog'), false);
  assert.equal(isShippableFighter('reference_fighter'), false);
  assert.equal(isShippableFighter('budget_barbarian'), true);
  assert.equal(isShippableFighter('mara_breach'), true);
});

test('diagnostic prototypes stay in the Gym while explicit role prototypes may appear in Waves', () => {
  assert.deepEqual(PROTOTYPE_FIGHTERS, ['buster_bulldog', 'reference_fighter']);
  assert.deepEqual(WAVE_ROLE_PROTOTYPES, ['scrap_flanker', 'scrap_heavy']);
  assert.deepEqual(REWORK_FIGHTERS, []);
  assert.ok(COMBAT_GYM_FIGHTERS.includes('buster_bulldog'));
  assert.ok(COMBAT_GYM_FIGHTERS.includes('reference_fighter'));
  assert.ok(COMBAT_GYM_FIGHTERS.includes('budget_barbarian'));
  assert.ok(COMBAT_GYM_FIGHTERS.includes('mara_breach'));
  const unavailableWaveFighters = [...PROTOTYPE_FIGHTERS, ...REWORK_FIGHTERS];
  assert.ok(junkyardRunStage.sections.every((section) => section.enemies.every((spawn) => !unavailableWaveFighters.includes(spawn.fighterId as (typeof unavailableWaveFighters)[number]))));
  const waveFighters = junkyardRunStage.sections.flatMap((section) => section.enemies.map((spawn) => spawn.fighterId));
  assert.ok(WAVE_ROLE_PROTOTYPES.every((fighterId) => waveFighters.includes(fighterId)));
  assert.ok(WAVE_ROLE_PROTOTYPES.every((fighterId) => !isShippableFighter(fighterId)));
});

test('every shippable player has an authored basic, special, and ultimate with a real mana gate', () => {
  for (const fighterId of SHIPPABLE_PLAYER_FIGHTERS) {
    const fighter = fighterDefinitions[fighterId];
    const basic = attacksById[fighter.attacks.basic];
    const special = fighter.attacks.special ? attacksById[fighter.attacks.special] : undefined;
    const ultimate = fighter.attacks.ultimate ? attacksById[fighter.attacks.ultimate] : undefined;

    assert.ok(basic, `${fighter.label} needs a basic attack`);
    assert.ok(special, `${fighter.label} needs a special attack`);
    assert.ok(ultimate, `${fighter.label} needs an ultimate attack`);
    assert.ok((special?.manaCost ?? 0) > 0, `${fighter.label} special needs a mana cost`);
    assert.ok((ultimate?.manaCost ?? 0) >= 100, `${fighter.label} ultimate needs a full-mana gate`);
  }
});
