import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BASE_GAME_WIDTH,
  GAME_HEIGHT,
  MAX_LANDSCAPE_GAME_WIDTH,
  getAdaptiveGameViewport,
} from '../src/game/core/AdaptiveViewport.ts';

test('adaptive viewport preserves the base combat canvas at 16:9 and narrower', () => {
  assert.deepEqual(getAdaptiveGameViewport(960, 540), { width: BASE_GAME_WIDTH, height: GAME_HEIGHT });
  assert.deepEqual(getAdaptiveGameViewport(568, 320), { width: BASE_GAME_WIDTH, height: GAME_HEIGHT });
});

test('adaptive viewport adds horizontal play space for a wide landscape device', () => {
  assert.deepEqual(getAdaptiveGameViewport(844, 390), { width: 1169, height: GAME_HEIGHT });
});

test('adaptive viewport has stable safe defaults and a practical width cap', () => {
  assert.deepEqual(getAdaptiveGameViewport(1920, 540), { width: MAX_LANDSCAPE_GAME_WIDTH, height: GAME_HEIGHT });
  assert.deepEqual(getAdaptiveGameViewport(0, 0), { width: BASE_GAME_WIDTH, height: GAME_HEIGHT });
});
