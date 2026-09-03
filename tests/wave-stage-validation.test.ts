import assert from 'node:assert/strict';
import test from 'node:test';
import { canEnterNextWaveSection, getWaveTraversalBounds } from '../src/game/core/WaveTraversal';
import { getWaveStageValidationViolations, MINIMUM_WAVE_SPAWN_DISTANCE } from '../src/game/core/WaveStageValidation';
import { junkyardRunStage, type StageDefinition } from '../src/game/data/stages';

test('Junkyard Run has ordered, reachable sections and safe enemy spawns', () => {
  assert.equal(MINIMUM_WAVE_SPAWN_DISTANCE, 96);
  assert.deepEqual(getWaveStageValidationViolations(junkyardRunStage), []);
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
    maxX: 960,
    minY: 248,
    maxY: 474,
  });
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 0, 849), false);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 0, 850), true);
  assert.equal(canEnterNextWaveSection(junkyardRunStage, 2, 2520), false);
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
        enemies: [{ fighterId: 'angry_pigeon', spawnX: 212, spawnY: 340 }],
      },
      {
        ...junkyardRunStage.sections[1],
        id: junkyardRunStage.sections[0].id,
        bounds: { minX: 420, maxX: 900, minY: 474, maxY: 248 },
        enemies: [{ fighterId: 'budget_barbarian', spawnX: 1000, spawnY: 200 }],
      },
    ],
  };

  assert.deepEqual(getWaveStageValidationViolations(invalidStage), [
    'yard-entry: enemy spawn is too close to the section player spawn',
    'yard-entry: travel bounds must extend the combat lane inside the world',
    'yard-entry: arrival trigger must stay inside the travel corridor',
    'yard-entry: section id must be unique',
    'yard-entry: horizontal bounds must stay inside the world and be ordered',
    'yard-entry: vertical bounds must be ordered and non-negative',
    'yard-entry: section overlaps the previous section',
    'yard-entry: enemy spawn must stay inside its section bounds',
  ]);
});
