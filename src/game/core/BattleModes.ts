export type BattleMode = 'duel' | 'waves';

export type FighterId = 'wombat' | 'angry_pigeon' | 'discount_wizard' | 'budget_barbarian' | 'buster_bulldog';

export type CharacterSelectSceneData = {
  mode: BattleMode;
  selectedPlayer?: FighterId;
  selectedEnemy?: FighterId;
};

export type BattleSceneData = {
  mode?: BattleMode;
  playerFighterId?: FighterId;
  enemyFighterId?: FighterId;
};
