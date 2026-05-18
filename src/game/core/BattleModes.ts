import type { ArenaId } from '../data/arenas';

export type BattleMode = 'duel' | 'waves' | 'test';

export type FighterId = 'wombat' | 'angry_pigeon' | 'discount_wizard' | 'budget_barbarian' | 'buster_bulldog';

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
};
