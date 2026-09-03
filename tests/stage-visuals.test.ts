import assert from 'node:assert/strict';
import test from 'node:test';
import { getStageTileScale } from '../src/game/core/StageVisuals';

test('wave tile scale preserves the source projection while covering the combat viewport', () => {
  const scale = getStageTileScale({ width: 1672, height: 941 }, { width: 960, height: 540 });

  assert.ok(Math.abs(scale - 960 / 1672) < 0.000001);
  assert.ok(1672 * scale >= 960);
  assert.ok(941 * scale >= 540);
});

test('stage tile scale rejects invalid raster dimensions', () => {
  assert.throws(() => getStageTileScale({ width: 0, height: 941 }, { width: 960, height: 540 }));
});
