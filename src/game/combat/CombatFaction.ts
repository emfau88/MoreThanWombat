export type CombatFaction = 'player' | 'enemy' | 'neutral';

export function canCombatFactionHit(source: CombatFaction, target: CombatFaction): boolean {
  return source !== target;
}
