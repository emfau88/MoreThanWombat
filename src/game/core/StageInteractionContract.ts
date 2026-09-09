import type { StageInteractionDefinition, SteamVentInteractionDefinition } from '../data/stages';

export type StageInteractionPhase = 'dormant' | 'telegraph' | 'active' | 'cooldown' | 'available' | 'collected';

export type StageInteractionRuntime = {
  phase: StageInteractionPhase;
  remainingMs: number;
  cycle: number;
};

export function createStageInteractionRuntime(definition: StageInteractionDefinition): StageInteractionRuntime {
  if (definition.type === 'resource_pickup') return { phase: 'available', remainingMs: 0, cycle: 0 };
  return definition.trigger === 'periodic'
    ? { phase: 'cooldown', remainingMs: definition.initialDelayMs, cycle: 0 }
    : { phase: 'dormant', remainingMs: 0, cycle: 0 };
}

export function triggerSteamVent(
  definition: SteamVentInteractionDefinition,
  runtime: StageInteractionRuntime,
): boolean {
  if (definition.trigger !== 'midboss_command' || runtime.phase !== 'dormant') return false;
  runtime.phase = 'telegraph';
  runtime.remainingMs = definition.telegraphMs;
  return true;
}

export function advanceStageInteraction(
  definition: StageInteractionDefinition,
  runtime: StageInteractionRuntime,
  deltaMs: number,
  combatActive: boolean,
  visible: boolean,
): void {
  if (definition.type === 'resource_pickup' || !combatActive) return;
  const safeDelta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;

  if (runtime.phase === 'dormant') return;
  runtime.remainingMs = Math.max(0, runtime.remainingMs - safeDelta);
  if (runtime.remainingMs > 0) return;

  if (runtime.phase === 'cooldown') {
    if (definition.trigger === 'midboss_command') {
      runtime.phase = 'dormant';
      return;
    }
    if (!visible) return;
    runtime.phase = 'telegraph';
    runtime.remainingMs = definition.telegraphMs;
    return;
  }

  if (runtime.phase === 'telegraph') {
    runtime.phase = 'active';
    runtime.remainingMs = definition.activeMs;
    runtime.cycle += 1;
    return;
  }

  if (runtime.phase === 'active') {
    runtime.phase = 'cooldown';
    runtime.remainingMs = definition.cooldownMs;
  }
}

export function isInsideInteractionEllipse(
  actor: Readonly<{ x: number; y: number }>,
  interaction: Readonly<{ x: number; y: number; radiusX: number; radiusY: number }>,
): boolean {
  if (interaction.radiusX <= 0 || interaction.radiusY <= 0) return false;
  const normalizedX = (actor.x - interaction.x) / interaction.radiusX;
  const normalizedY = (actor.y - interaction.y) / interaction.radiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
}
