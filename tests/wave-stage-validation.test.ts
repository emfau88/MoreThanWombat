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

test('Junkyard Run composes exactly seven valid encounters across three zones', () => {
  assert.equal(MINIMUM_WAVE_SPAWN_DISTANCE, 96);
  assert.equal(MAXIMUM_WAVE_SPAWN_DISTANCE, 480);
  assert.equal(MAXIMUM_WAVE_ENEMIES, 3);
  assert.deepEqual(getWaveStageValidationViolations(junkyardRunStage), []);
  assert.equal(junkyardRunStage.sections.length, 7);
  assert.deepEqual(junkyardRunStage.zones.map((zone) =>
    junkyardRunStage.sections.filter((section) => section.zoneId === zone.id).length), [2, 3, 2]);
  assert.ok(junkyardRunStage.sections.every((section) => section.objective.length > 0));
  assert.ok(junkyardRunStage.sections.every((section) => section.completionRule.type === 'defeat_all'));
  assert.ok(junkyardRunStage.sections.some((section) => section.enemies.length === 3));
});

test('encounters escalate through role composition, timing and pressure channels', () => {
  assert.deepEqual(junkyardRunStage.sections.map((section) => section.enemies.map((spawn) => spawn.roleId)), [
    ['pursuer'],
    ['pursuer', 'flanker'],
    ['pursuer', 'zoner'],
    ['heavy', 'pursuer'],
    ['heavy', 'flanker'],
    ['pursuer', 'zoner', 'flanker'],
    ['heavy', 'zoner', 'flanker'],
  ]);
  assert.deepEqual(junkyardRunStage.sections.map((section) => section.enemies.map((spawn) => spawn.entryDelayMs)), [
    [0], [0, 900], [0, 550], [0, 650], [0, 800], [0, 650, 1300], [0, 500, 1050],
  ]);
  assert.deepEqual(junkyardRunStage.sections.map((section) => section.pressureBudget), [
    { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 },
    { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1, burst: { periodMs: 4200, durationMs: 1550 } },
    { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0, burst: { periodMs: 4400, durationMs: 1700 } },
    { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 },
    { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1, burst: { periodMs: 4000, durationMs: 1900 } },
    { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1, burst: { periodMs: 5000, durationMs: 2200 } },
    { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1, burst: { periodMs: 4200, durationMs: 2400 } },
  ]);
});

test('sub-waves share their zone without travel while zone boundaries use explicit corridors', () => {
  const travelSections = junkyardRunStage.sections
    .map((section, index) => ({ section, index }))
    .filter(({ section }) => section.travelBounds);
  assert.deepEqual(travelSections.map(({ index }) => index), [1, 4]);
  assert.deepEqual(getWaveTraversalBounds(junkyardRunStage, 0, 'combat'), {
    minX: 72, maxX: 888, minY: 248, maxY: 474,
  });
  assert.deepEqual(getWaveTraversalBounds(junkyardRunStage, 1, 'travel'), {
    minX: 72, maxX: 1104, minY: 248, maxY: 474,
  });
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 0, 2000), false);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 1, 1017), false);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 1, 1018), true);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 4, 1978), true);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 6, 2880), false);
});

test('stage validation rejects invalid role entry, completion and zone-transition data', () => {
  const firstSpawn = junkyardRunStage.sections[0].enemies[0];
  const invalidStage: StageDefinition = {
    ...junkyardRunStage,
    worldWidth: 800,
    sections: [
      {
        ...junkyardRunStage.sections[0],
        bounds: { minX: 72, maxX: 500, minY: 248, maxY: 474 },
        travelBounds: { minX: 72, maxX: 500, minY: 248, maxY: 474 },
        arrivalTriggerX: 700,
        completionRule: { type: 'defeat_priority', prioritySpawnId: 'missing' },
        enemies: [{ ...firstSpawn, spawnX: 212, spawnY: 340, entryDelayMs: -1 }],
      },
      {
        ...junkyardRunStage.sections[2],
        id: junkyardRunStage.sections[0].id,
        bounds: { minX: 420, maxX: 900, minY: 474, maxY: 248 },
        pressureBudget: { meleeTokens: -1, rangedTokens: 0.5, disruptionBudget: 0 },
        enemies: [{ ...firstSpawn, id: '', fighterId: 'budget_barbarian', roleId: 'heavy', spawnX: 2000, spawnY: 200 }],
      },
    ],
  };

  const violations = getWaveStageValidationViolations(invalidStage);
  assert.ok(violations.includes('gate-crasher: enemy spawn is too close to the section player spawn'));
  assert.ok(violations.includes('gate-crasher: travel bounds must extend the combat lane inside the world'));
  assert.ok(violations.includes('gate-crasher: arrival trigger must stay inside the travel corridor'));
  assert.ok(violations.includes('gate-crasher: priority completion must reference an enemy spawn'));
  assert.ok(violations.includes('gate-crasher: enemy entry delay must be a non-negative finite number'));
  assert.ok(violations.includes('gate-crasher: section id must be unique'));
  assert.ok(violations.includes('gate-crasher: horizontal bounds must stay inside the world and be ordered'));
  assert.ok(violations.includes('gate-crasher: vertical bounds must be ordered and non-negative'));
  assert.ok(violations.includes('gate-crasher: section overlaps the previous section'));
  assert.ok(violations.includes('gate-crasher: enemy spawn must stay inside its section bounds'));
  assert.ok(violations.includes('gate-crasher: enemy spawn is outside the initial camera-safe range'));
  assert.ok(violations.includes('gate-crasher: pressure budgets must be non-negative integers'));
  assert.ok(violations.includes('gate-crasher: enemy fighter and role must match'));
  assert.ok(violations.includes('gate-crasher: enemy spawn ids must be unique'));
  assert.ok(violations.includes('zones must cover the full world width'));
});
