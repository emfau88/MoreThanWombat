import type { AttackDefinition, BasicChainWindow } from '../data/attacks';

export type BasicChainTiming = Readonly<{
  inputOpenMs: number;
  inputCloseMs: number;
  hitCancelMs: number;
  whiffCancelMs: number;
}>;

export function resolveBasicChainTiming(attack: AttackDefinition, window: BasicChainWindow): BasicChainTiming {
  const totalMs = attack.startupMs + attack.activeMs + attack.recoveryMs;
  return {
    inputOpenMs: Math.max(0, Math.min(totalMs, window.inputOpenMs)),
    inputCloseMs: Math.max(0, Math.min(totalMs, window.inputCloseMs)),
    hitCancelMs: Math.max(0, Math.min(totalMs, window.hitCancelMs)),
    whiffCancelMs: Math.max(0, Math.min(totalMs, window.whiffCancelMs)),
  };
}

export function canBufferBasicChain(attack: AttackDefinition, elapsedMs: number): boolean {
  if (!attack.basicChainWindow) return false;
  const timing = resolveBasicChainTiming(attack, attack.basicChainWindow);
  return elapsedMs >= timing.inputOpenMs && elapsedMs <= timing.inputCloseMs;
}

export function canCancelIntoBasicChain(attack: AttackDefinition, elapsedMs: number, didHit: boolean): boolean {
  if (!attack.basicChainWindow) return false;
  const timing = resolveBasicChainTiming(attack, attack.basicChainWindow);
  return elapsedMs >= (didHit ? timing.hitCancelMs : timing.whiffCancelMs);
}
