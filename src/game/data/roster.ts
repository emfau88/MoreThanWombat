import type { FighterId } from '../core/BattleModes';

/** Fighters exposed in normal play modes. Diagnostic prototypes stay in the Combat Gym only. */
export const SHIPPABLE_PLAYER_FIGHTERS = ['wombat', 'discount_wizard', 'budget_barbarian'] as const satisfies readonly FighterId[];
export const SHIPPABLE_DUEL_ENEMIES = ['angry_pigeon', 'discount_wizard', 'budget_barbarian'] as const satisfies readonly FighterId[];
export const PROTOTYPE_FIGHTERS = ['buster_bulldog', 'reference_fighter'] as const satisfies readonly FighterId[];

export function isShippableFighter(fighterId: FighterId): boolean {
  return SHIPPABLE_PLAYER_FIGHTERS.includes(fighterId as (typeof SHIPPABLE_PLAYER_FIGHTERS)[number])
    || SHIPPABLE_DUEL_ENEMIES.includes(fighterId as (typeof SHIPPABLE_DUEL_ENEMIES)[number]);
}
