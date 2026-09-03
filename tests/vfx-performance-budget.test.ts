import assert from 'node:assert/strict';
import test from 'node:test';
import { VFX_ACTIVE_LAYER_LIMITS } from '../src/game/combat/VfxPerformanceBudget';

test('VFX quality tiers define bounded concurrent layer budgets', () => {
  assert.equal(VFX_ACTIVE_LAYER_LIMITS.full, 80);
  assert.equal(VFX_ACTIVE_LAYER_LIMITS.reduced, 48);
  assert.equal(VFX_ACTIVE_LAYER_LIMITS.minimal, 24);
  assert.ok(VFX_ACTIVE_LAYER_LIMITS.full > VFX_ACTIVE_LAYER_LIMITS.reduced);
  assert.ok(VFX_ACTIVE_LAYER_LIMITS.reduced > VFX_ACTIVE_LAYER_LIMITS.minimal);
});
