import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMBAT_GYM_DUMMY_MODES,
  COMBAT_GYM_RANGES,
  createDefaultCombatGymSettings,
  cycleCombatGymSetting,
  getCombatGymMoves,
  getSelectedCombatGymMove,
} from '../src/game/debug/CombatGymModel';

test('combat gym exposes authored moves plus the universal air move', () => {
  const moves = getCombatGymMoves('wombat');
  assert.deepEqual(moves.map((move) => move.attack.id), [
    'wombat_jab',
    'wombat_belly_slam',
    'wombat_earthshaker',
    'air_bonk',
  ]);
});

test('combat gym exposes the Wizard miscast for deterministic animation review', () => {
  const moveIds = getCombatGymMoves('discount_wizard').map((move) => move.attack.id);

  assert.deepEqual(moveIds, [
    'discount_wand_smack',
    'discount_fireball_cast',
    'discount_miscast',
    'discount_clearance_orb',
    'air_bonk',
  ]);
});

test('combat gym setting cycles wrap and reset move choice for a new player', () => {
  let settings = createDefaultCombatGymSettings('wombat', 'angry_pigeon');
  settings = cycleCombatGymSetting(settings, 'range', -1);
  assert.equal(settings.rangeIndex, COMBAT_GYM_RANGES.length - 1);
  settings = cycleCombatGymSetting(settings, 'dummyMode', -1);
  assert.equal(settings.dummyModeIndex, COMBAT_GYM_DUMMY_MODES.length - 1);
  settings = { ...settings, moveIndex: 2 };
  settings = cycleCombatGymSetting(settings, 'player', 1);
  assert.equal(settings.playerId, 'discount_wizard');
  assert.equal(settings.moveIndex, 0);
  assert.equal(getSelectedCombatGymMove(settings).attack.id, 'discount_wand_smack');
});

test('combat gym exposes armor as a deterministic contact response', () => {
  assert.ok(COMBAT_GYM_DUMMY_MODES.includes('armor'));
});
