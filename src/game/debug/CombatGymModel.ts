import type { AttackDefinition } from '../data/attacks';
import { attacksById } from '../data/attacks';
import { fighterDefinitions } from '../data/fighters';
import type { FighterId } from '../core/BattleModes';

export type CombatGymDummyMode = 'idle' | 'guard' | 'invulnerable' | 'attack-loop';
export type CombatGymMoveKind = 'basic' | 'special' | 'ultimate' | 'air';

export type CombatGymSettings = {
  playerId: FighterId;
  dummyId: FighterId;
  moveIndex: number;
  rangeIndex: number;
  laneIndex: number;
  manaIndex: number;
  dummyModeIndex: number;
};

export type CombatGymMove = {
  attack: AttackDefinition;
  kind: CombatGymMoveKind;
};

export const COMBAT_GYM_FIGHTERS: FighterId[] = [
  'wombat',
  'discount_wizard',
  'budget_barbarian',
  'buster_bulldog',
  'angry_pigeon',
  'reference_fighter',
];

export const COMBAT_GYM_RANGES = [58, 92, 150] as const;
export const COMBAT_GYM_LANE_GAPS = [0, 34, 68] as const;
export const COMBAT_GYM_MANA_RATIOS = [0, 0.5, 1] as const;
export const COMBAT_GYM_DUMMY_MODES: CombatGymDummyMode[] = ['idle', 'guard', 'invulnerable', 'attack-loop'];

export function createDefaultCombatGymSettings(playerId: FighterId, dummyId: FighterId): CombatGymSettings {
  return {
    playerId,
    dummyId,
    moveIndex: 0,
    rangeIndex: 0,
    laneIndex: 0,
    manaIndex: 2,
    dummyModeIndex: 0,
  };
}

export function normalizeCombatGymSettings(settings: CombatGymSettings): CombatGymSettings {
  const playerId = fighterDefinitions[settings.playerId] ? settings.playerId : 'wombat';
  const dummyId = fighterDefinitions[settings.dummyId] ? settings.dummyId : 'angry_pigeon';
  const moves = getCombatGymMoves(playerId);

  return {
    playerId,
    dummyId,
    moveIndex: wrapIndex(settings.moveIndex, moves.length),
    rangeIndex: wrapIndex(settings.rangeIndex, COMBAT_GYM_RANGES.length),
    laneIndex: wrapIndex(settings.laneIndex, COMBAT_GYM_LANE_GAPS.length),
    manaIndex: wrapIndex(settings.manaIndex, COMBAT_GYM_MANA_RATIOS.length),
    dummyModeIndex: wrapIndex(settings.dummyModeIndex, COMBAT_GYM_DUMMY_MODES.length),
  };
}

export function getCombatGymMoves(fighterId: FighterId): CombatGymMove[] {
  const definition = fighterDefinitions[fighterId];
  const moves: CombatGymMove[] = [];
  const addMove = (attackId: string | undefined, kind: CombatGymMoveKind) => {
    const attack = attackId ? attacksById[attackId] : undefined;
    if (attack && !moves.some((move) => move.attack.id === attack.id)) {
      moves.push({ attack, kind });
    }
  };

  addMove(definition.attacks.basic, 'basic');
  addMove(definition.attacks.special, 'special');
  if (fighterId === 'discount_wizard') {
    addMove('discount_miscast', 'special');
  }
  addMove(definition.attacks.ultimate, 'ultimate');
  addMove('air_bonk', 'air');
  return moves;
}

export function getSelectedCombatGymMove(settings: CombatGymSettings): CombatGymMove {
  const moves = getCombatGymMoves(settings.playerId);
  return moves[wrapIndex(settings.moveIndex, moves.length)];
}

export function cycleCombatGymSetting(
  settings: CombatGymSettings,
  key: 'player' | 'dummy' | 'move' | 'range' | 'lane' | 'mana' | 'dummyMode',
  direction = 1,
): CombatGymSettings {
  const next = { ...settings };

  if (key === 'player') {
    const index = COMBAT_GYM_FIGHTERS.indexOf(settings.playerId);
    next.playerId = COMBAT_GYM_FIGHTERS[wrapIndex(index + direction, COMBAT_GYM_FIGHTERS.length)];
    next.moveIndex = 0;
  } else if (key === 'dummy') {
    const index = COMBAT_GYM_FIGHTERS.indexOf(settings.dummyId);
    next.dummyId = COMBAT_GYM_FIGHTERS[wrapIndex(index + direction, COMBAT_GYM_FIGHTERS.length)];
  } else if (key === 'move') {
    next.moveIndex = wrapIndex(settings.moveIndex + direction, getCombatGymMoves(settings.playerId).length);
  } else if (key === 'range') {
    next.rangeIndex = wrapIndex(settings.rangeIndex + direction, COMBAT_GYM_RANGES.length);
  } else if (key === 'lane') {
    next.laneIndex = wrapIndex(settings.laneIndex + direction, COMBAT_GYM_LANE_GAPS.length);
  } else if (key === 'mana') {
    next.manaIndex = wrapIndex(settings.manaIndex + direction, COMBAT_GYM_MANA_RATIOS.length);
  } else {
    next.dummyModeIndex = wrapIndex(settings.dummyModeIndex + direction, COMBAT_GYM_DUMMY_MODES.length);
  }

  return normalizeCombatGymSettings(next);
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}
