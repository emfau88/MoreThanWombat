import type { CombatResponse } from './CombatResolver';

export type PlayerDefenseAction = 'guard' | 'evade';
export type KnockdownPhase = 'launched' | 'knockdown' | 'grounded' | 'wake_up';

export const PLAYER_DEFENSE_CONTRACT = Object.freeze({
  directionThreshold: 0.45,
  guardActiveMs: 340,
  guardRecoveryMs: 190,
  evadeStartupMs: 60,
  evadeInvulnerableMs: 190,
  evadeRecoveryMs: 170,
  evadeDistance: 112,
  reuseCooldownMs: 620,
  knockdownImpactMs: 210,
  groundedMs: 520,
  wakeUpInvulnerableMs: 260,
  wakeUpRecoveryMs: 150,
});

export type DefenseChoice = Readonly<{
  action: PlayerDefenseAction;
  directionX: number;
  directionY: number;
}>;

export function choosePlayerDefense(moveX: number, moveY: number): DefenseChoice {
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude < PLAYER_DEFENSE_CONTRACT.directionThreshold) {
    return { action: 'guard', directionX: 0, directionY: 0 };
  }
  return { action: 'evade', directionX: moveX / magnitude, directionY: moveY / magnitude };
}

export function getDefenseDurationMs(action: PlayerDefenseAction): number {
  return action === 'guard'
    ? PLAYER_DEFENSE_CONTRACT.guardActiveMs + PLAYER_DEFENSE_CONTRACT.guardRecoveryMs
    : PLAYER_DEFENSE_CONTRACT.evadeStartupMs
      + PLAYER_DEFENSE_CONTRACT.evadeInvulnerableMs
      + PLAYER_DEFENSE_CONTRACT.evadeRecoveryMs;
}

export function getDefenseResponse(action: PlayerDefenseAction, elapsedMs: number): CombatResponse {
  if (action === 'guard') {
    return elapsedMs < PLAYER_DEFENSE_CONTRACT.guardActiveMs ? 'guard' : 'normal';
  }
  const invulnerableStart = PLAYER_DEFENSE_CONTRACT.evadeStartupMs;
  const invulnerableEnd = invulnerableStart + PLAYER_DEFENSE_CONTRACT.evadeInvulnerableMs;
  return elapsedMs >= invulnerableStart && elapsedMs < invulnerableEnd ? 'invulnerable' : 'normal';
}

export function getWakeUpResponse(elapsedMs: number): CombatResponse {
  return elapsedMs < PLAYER_DEFENSE_CONTRACT.wakeUpInvulnerableMs ? 'invulnerable' : 'normal';
}

export function isIncapacitatedPhase(state: string): state is KnockdownPhase {
  return state === 'launched' || state === 'knockdown' || state === 'grounded' || state === 'wake_up';
}
