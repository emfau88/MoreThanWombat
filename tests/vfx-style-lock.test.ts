import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cycleVfxStyleLockMode,
  getStyleLockContactTexture,
  getStyleLockGroundTexture,
  getVfxStyleLockLabel,
} from '../src/game/combat/VfxStyleLock';

test('style-lock modes cycle through reference and both comic variants', () => {
  assert.equal(cycleVfxStyleLockMode('reference'), 'comic-a');
  assert.equal(cycleVfxStyleLockMode('comic-a'), 'comic-b');
  assert.equal(cycleVfxStyleLockMode('comic-b'), 'reference');
});

test('style-lock texture lookup keeps reference and outcomes isolated', () => {
  assert.equal(getStyleLockContactTexture('reference', 'physical'), null);
  assert.equal(getStyleLockContactTexture('comic-a', 'physical'), 'vfx-style-physical-light-a');
  assert.equal(getStyleLockContactTexture('comic-b', 'magic'), 'vfx-style-magic-light-b');
  assert.equal(getStyleLockContactTexture('comic-a', 'block'), null);
  assert.equal(getStyleLockGroundTexture('reference'), null);
  assert.equal(getStyleLockGroundTexture('comic-b'), 'vfx-style-ground-impact-b');
  assert.equal(getVfxStyleLockLabel('comic-a'), 'Comic A');
});
