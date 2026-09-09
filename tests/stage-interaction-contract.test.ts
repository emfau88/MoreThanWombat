import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advanceStageInteraction,
  createStageInteractionRuntime,
  isInsideInteractionEllipse,
  triggerSteamVent,
} from '../src/game/core/StageInteractionContract';
import type { ResourcePickupInteractionDefinition, SteamVentInteractionDefinition } from '../src/game/data/stages';

const periodicVent: SteamVentInteractionDefinition = {
  id: 'periodic', type: 'steam_vent', x: 100, y: 200, radiusX: 60, radiusY: 30,
  trigger: 'periodic', initialDelayMs: 500, telegraphMs: 900, activeMs: 250, cooldownMs: 3000,
  damage: 8, knockback: 150, label: 'PRESSURE LEAK',
};

const commandVent: SteamVentInteractionDefinition = {
  ...periodicVent, id: 'command', trigger: 'midboss_command', initialDelayMs: 0,
};

test('periodic steam waits for the camera, telegraphs, fires once and cools down', () => {
  const runtime = createStageInteractionRuntime(periodicVent);
  assert.deepEqual(runtime, { phase: 'cooldown', remainingMs: 500, cycle: 0 });
  advanceStageInteraction(periodicVent, runtime, 500, true, false);
  assert.deepEqual(runtime, { phase: 'cooldown', remainingMs: 0, cycle: 0 }, 'offscreen vents stay safe');
  advanceStageInteraction(periodicVent, runtime, 0, true, true);
  assert.deepEqual(runtime, { phase: 'telegraph', remainingMs: 900, cycle: 0 });
  advanceStageInteraction(periodicVent, runtime, 900, true, true);
  assert.deepEqual(runtime, { phase: 'active', remainingMs: 250, cycle: 1 });
  advanceStageInteraction(periodicVent, runtime, 250, true, true);
  assert.deepEqual(runtime, { phase: 'cooldown', remainingMs: 3000, cycle: 1 });
});

test('command steam only starts on an explicit midboss command and resets to dormant', () => {
  const runtime = createStageInteractionRuntime(commandVent);
  assert.deepEqual(runtime, { phase: 'dormant', remainingMs: 0, cycle: 0 });
  advanceStageInteraction(commandVent, runtime, 5000, true, true);
  assert.equal(runtime.phase, 'dormant');
  assert.equal(triggerSteamVent(commandVent, runtime), true);
  assert.equal(triggerSteamVent(commandVent, runtime), false, 'one command cannot retrigger an active cycle');
  advanceStageInteraction(commandVent, runtime, commandVent.telegraphMs, true, true);
  assert.equal(runtime.phase, 'active');
  advanceStageInteraction(commandVent, runtime, commandVent.activeMs, true, true);
  assert.equal(runtime.phase, 'cooldown');
  advanceStageInteraction(commandVent, runtime, commandVent.cooldownMs, true, true);
  assert.equal(runtime.phase, 'dormant');
});

test('interaction timers freeze outside active combat and pickup state is deterministic', () => {
  const runtime = createStageInteractionRuntime(periodicVent);
  advanceStageInteraction(periodicVent, runtime, 1000, false, true);
  assert.deepEqual(runtime, { phase: 'cooldown', remainingMs: 500, cycle: 0 });

  const pickup: ResourcePickupInteractionDefinition = {
    id: 'lunch', type: 'resource_pickup', x: 10, y: 20, collectRadius: 40,
    healthRatio: 0.18, manaRatio: 0.25, label: 'Union Lunchbox',
  };
  assert.deepEqual(createStageInteractionRuntime(pickup), { phase: 'available', remainingMs: 0, cycle: 0 });
});

test('steam danger uses the authored ground ellipse', () => {
  assert.equal(isInsideInteractionEllipse({ x: 100, y: 200 }, periodicVent), true);
  assert.equal(isInsideInteractionEllipse({ x: 160, y: 200 }, periodicVent), true);
  assert.equal(isInsideInteractionEllipse({ x: 100, y: 231 }, periodicVent), false);
  assert.equal(isInsideInteractionEllipse({ x: 150, y: 225 }, periodicVent), false);
});
