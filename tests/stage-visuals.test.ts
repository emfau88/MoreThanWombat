import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FLAT_ARENA_VISUAL_CONTRACT,
  getStageTileScale,
  getStageVisualContractViolations,
} from '../src/game/core/StageVisuals';
import { junkyardRunStage, stageVisualContracts } from '../src/game/data/stages';

test('wave tile scale preserves the source projection while covering the combat viewport', () => {
  const scale = getStageTileScale({ width: 1672, height: 941 }, { width: 960, height: 540 });

  assert.ok(Math.abs(scale - 960 / 1672) < 0.000001);
  assert.ok(1672 * scale >= 960);
  assert.ok(941 * scale >= 540);
});

test('stage tile scale rejects invalid raster dimensions', () => {
  assert.throws(() => getStageTileScale({ width: 0, height: 941 }, { width: 960, height: 540 }));
});

test('flat Duel/Test bounds stay inside the shared painted ground band', () => {
  assert.deepEqual(
    getStageVisualContractViolations(FLAT_ARENA_VISUAL_CONTRACT, FLAT_ARENA_VISUAL_CONTRACT.combatBounds),
    [],
  );
});

test('every Junkyard Run section stays inside its declared visual ground contract', () => {
  const contract = stageVisualContracts[junkyardRunStage.id];

  for (const section of junkyardRunStage.sections) {
    const localBounds = {
      minX: section.bounds.minX - section.bounds.minX + contract.combatBounds.minX,
      maxX: section.bounds.maxX - section.bounds.minX + contract.combatBounds.minX,
      minY: section.bounds.minY,
      maxY: section.bounds.maxY,
    };
    assert.deepEqual(getStageVisualContractViolations(contract, localBounds), [], section.id);
  }
});
