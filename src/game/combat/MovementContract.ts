export const PLAYER_MOVEMENT_CONTRACT = Object.freeze({
  runActivationMs: 220,
  runInputThreshold: 0.82,
  runReleaseThreshold: 0.28,
  runSpeedMultiplier: 1.42,
  airControlMultiplier: 0.82,
});

export function getClampedInputMagnitude(moveX: number, moveY: number): number {
  if (!Number.isFinite(moveX) || !Number.isFinite(moveY)) return 0;
  return Math.min(1, Math.hypot(moveX, moveY));
}

export function advanceRunCharge(previousMs: number, moveX: number, moveY: number, deltaMs: number): number {
  const magnitude = getClampedInputMagnitude(moveX, moveY);
  if (magnitude < PLAYER_MOVEMENT_CONTRACT.runInputThreshold) return 0;
  return Math.min(PLAYER_MOVEMENT_CONTRACT.runActivationMs, Math.max(0, previousMs) + Math.max(0, deltaMs));
}

export function shouldKeepRunning(moveX: number, moveY: number): boolean {
  return getClampedInputMagnitude(moveX, moveY) >= PLAYER_MOVEMENT_CONTRACT.runReleaseThreshold;
}
