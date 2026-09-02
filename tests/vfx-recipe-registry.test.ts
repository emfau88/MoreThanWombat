import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cycleVfxQuality,
  getAuxiliaryVfxRecipe,
  getImpactVfxRecipe,
  shouldRenderVfxLayer,
} from '../src/game/combat/VfxRecipeRegistry';

test('universal recipes choose a shared family from impact style and strength', () => {
  const lightPhysical = getImpactVfxRecipe({ feedbackClass: 'light', sparkStyle: 'physical' } as never);
  const heavyPhysical = getImpactVfxRecipe({ feedbackClass: 'heavy', sparkStyle: 'physical' } as never);
  const magic = getImpactVfxRecipe({ feedbackClass: 'medium', sparkStyle: 'magic' } as never);

  assert.equal(lightPhysical.id, 'physical.light');
  assert.equal(heavyPhysical.id, 'physical.heavy');
  assert.equal(magic.id, 'magic.medium');
  assert.equal(heavyPhysical.layers.length, 2);
});

test('outcome recipes stay distinct and whiff remains a motion-only recipe', () => {
  assert.equal(getImpactVfxRecipe({ feedbackClass: 'light', sparkStyle: 'block' } as never).id, 'block');
  assert.equal(getImpactVfxRecipe({ feedbackClass: 'light', sparkStyle: 'armor' } as never).id, 'armor');
  assert.equal(getImpactVfxRecipe({ feedbackClass: 'light', sparkStyle: 'invulnerable' } as never).id, 'invulnerable');
  assert.equal(getAuxiliaryVfxRecipe('motion.whiff').anchor, 'motion');
});

test('quality modes retain the core and drop optional residue deterministically', () => {
  const heavyGround = getAuxiliaryVfxRecipe('ground.heavy');
  assert.equal(cycleVfxQuality('full'), 'reduced');
  assert.equal(cycleVfxQuality('reduced'), 'minimal');
  assert.equal(cycleVfxQuality('minimal'), 'full');
  assert.equal(heavyGround.layers.filter((layer) => shouldRenderVfxLayer(layer, 'full')).length, 2);
  assert.equal(heavyGround.layers.filter((layer) => shouldRenderVfxLayer(layer, 'minimal')).length, 1);
});
