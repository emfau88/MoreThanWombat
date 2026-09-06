import type { ArenaId } from '../data/arenas';
import type { WaveStageId } from '../data/stages';
import type { CombatGymSettings } from '../debug/CombatGymModel';

export type BattleMode = 'duel' | 'waves' | 'test';

export type FighterId =
  | 'wombat'
  | 'angry_pigeon'
  | 'discount_wizard'
  | 'budget_barbarian'
  | 'mara_breach'
  | 'buster_bulldog'
  | 'reference_fighter'
  | 'scrap_flanker'
  | 'scrap_heavy';

export type CharacterSelectSceneData = {
  mode: BattleMode;
  selectedPlayer?: FighterId;
  selectedEnemy?: FighterId;
  selectedArena?: ArenaId;
};

export type BattleSceneData = {
  mode?: BattleMode;
  playerFighterId?: FighterId;
  enemyFighterId?: FighterId;
  arenaId?: ArenaId;
  stageId?: WaveStageId;
  combatGym?: CombatGymSettings;
};
