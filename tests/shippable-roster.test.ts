import assert from 'node:assert/strict';
import test from 'node:test';
import { COMBAT_GYM_FIGHTERS } from '../src/game/debug/CombatGymModel';
import {
  isShippableFighter,
  PROTOTYPE_FIGHTERS,
  SHIPPABLE_DUEL_ENEMIES,
  SHIPPABLE_PLAYER_FIGHTERS,
} from '../src/game/data/roster';
import { junkyardRunStage } from '../src/game/data/stages';

test('normal play exposes the four-fighter core roster and its approved Duel opponents', () => {
  assert.deepEqual(SHIPPABLE_PLAYER_FIGHTERS, ['wombat', 'discount_wizard', 'budget_barbarian', 'mara_breach']);
  assert.deepEqual(SHIPPABLE_DUEL_ENEMIES, ['angry_pigeon', 'discount_wizard', 'budget_barbarian', 'mara_breach']);
  assert.equal(isShippableFighter('buster_bulldog'), false);
  assert.equal(isShippableFighter('reference_fighter'), false);
});

test('diagnostic prototypes remain available to the Combat Gym but never appear in Wave data', () => {
  assert.deepEqual(PROTOTYPE_FIGHTERS, ['buster_bulldog', 'reference_fighter']);
  assert.ok(COMBAT_GYM_FIGHTERS.includes('buster_bulldog'));
  assert.ok(COMBAT_GYM_FIGHTERS.includes('reference_fighter'));
  assert.ok(junkyardRunStage.sections.every((section) => section.enemies.every((spawn) => !PROTOTYPE_FIGHTERS.includes(spawn.fighterId as (typeof PROTOTYPE_FIGHTERS)[number]))));
});
