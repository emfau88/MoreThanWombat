import assert from 'node:assert/strict';
import test from 'node:test';
import { canEnterNextWaveSection, getWaveTraversalBounds } from '../src/game/core/WaveTraversal';
import {
  getWaveStageValidationViolations,
  MAXIMUM_WAVE_ENEMIES,
  MAXIMUM_WAVE_SPAWN_DISTANCE,
  MINIMUM_WAVE_SPAWN_DISTANCE,
} from '../src/game/core/WaveStageValidation';
import { junkyardRunStage, type StageDefinition } from '../src/game/data/stages';

test('Junkyard Run has ordered, reachable sections and safe enemy spawns', () => {
  assert.equal(MINIMUM_WAVE_SPAWN_DISTANCE, 96);
  assert.equal(MAXIMUM_WAVE_SPAWN_DISTANCE, 480);
  assert.equal(MAXIMUM_WAVE_ENEMIES, 2);
  assert.deepEqual(getWaveStageValidationViolations(junkyardRunStage), []);
  assert.deepEqual(
    junkyardRunStage.sections.map((section) => section.pressureBudget),
    [
      { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 },
      { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0 },
      { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1, burst: { periodMs: 5000, durationMs: 1800 } },
    ],
  );
});

test('wave traversal unlocks an explicit corridor and enters the next combat section without a teleport', () => {
  assert.deepEqual(getWaveTraversalBounds(junkyardRunStage, 0, 'combat'), {
    minX: 72,
    maxX: 720,
    minY: 248,
    maxY: 474,
  });
  assert.deepEqual(getWaveTraversalBounds(junkyardRunStage, 0, 'travel'), {
    minX: 72,
    maxX: 1104,
    minY: 248,
    maxY: 474,
  });
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 0, 1017), false);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 0, 1018), true);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 2, 2880), false);
});

test('wave stage validation rejects overlapping sections, invalid spawns and unsafe starts', () => {
  const invalidStage: StageDefinition = {
    ...junkyardRunStage,
    worldWidth: 800,
    sections: [
      {
        ...junkyardRunStage.sections[0],
        bounds: { minX: 72, maxX: 500, minY: 248, maxY: 474 },
        travelBounds: { minX: 72, maxX: 500, minY: 248, maxY: 474 },
        arrivalTriggerX: 700,
        enemies: [{ fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 212, spawnY: 340 }],
      },
      {
        ...junkyardRunStage.sections[1],
        id: junkyardRunStage.sections[0].id,
        bounds: { minX: 420, maxX: 900, minY: 474, maxY: 248 },
        pressureBudget: { meleeTokens: -1, rangedTokens: 0.5, disruptionBudget: 0 },
        enemies: [{ fighterId: 'budget_barbarian', roleId: 'heavy', spawnX: 2000, spawnY: 200 }],
      },
    ],
  };

  const violations = getWaveStageValidationViolations(invalidStage);
  assert.ok(violations.includes('yard-entry: enemy spawn is too close to the section player spawn'));
  assert.ok(violations.includes('yard-entry: travel bounds must extend the combat lane inside the world'));
  assert.ok(violations.includes('yard-entry: arrival trigger must stay inside the travel corridor'));
  assert.ok(violations.includes('yard-entry: section id must be unique'));
  assert.ok(violations.includes('yard-entry: horizontal bounds must stay inside the world and be ordered'));
  assert.ok(violations.includes('yard-entry: vertical bounds must be ordered and non-negative'));
  assert.ok(violations.includes('yard-entry: section overlaps the previous section'));
  assert.ok(violations.includes('yard-entry: enemy spawn must stay inside its section bounds'));
  assert.ok(violations.includes('yard-entry: enemy spawn is outside the initial camera-safe range'));
  assert.ok(violations.includes('yard-entry: pressure budgets must be non-negative integers'));
  assert.ok(violations.includes('yard-entry: enemy fighter and role must match'));
  assert.ok(violations.includes('zones must cover the full world width'));
});
