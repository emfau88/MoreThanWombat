import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discountFireballProjectile,
  discountUltimateOrbProjectile,
} from '../src/game/data/projectiles';

test('Wizard projectiles use transparent roster VFX, not legacy animation sheets', () => {
  for (const projectile of [discountFireballProjectile, discountUltimateOrbProjectile]) {
    assert.equal(projectile.textureKey, 'vfx-roster-wizard-cast');
    assert.equal(projectile.animationKey, undefined);
    assert.ok(projectile.spinRadiansPerSecond && projectile.spinRadiansPerSecond > 0);
  }
});
