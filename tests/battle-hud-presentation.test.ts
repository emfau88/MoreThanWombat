import assert from 'node:assert/strict';
import test from 'node:test';
import { formatWaveHudHeader, getWaveHudKind, shouldShowLocalEnemyHealthBar } from '../src/game/ui/BattleHudPresentation';
import { junkyardRunStage } from '../src/game/data/stages';

test('wave HUD reserves the persistent enemy bar for midboss and boss sections', () => {
  assert.equal(getWaveHudKind(junkyardRunStage.sections[1]), 'normal');
  assert.equal(getWaveHudKind(junkyardRunStage.sections[4]), 'midboss');
  assert.equal(getWaveHudKind(junkyardRunStage.sections[6]), 'boss');
});

test('ordinary wave enemies use local damage bars while priority enemies do not', () => {
  const normal = junkyardRunStage.sections[1];
  const midboss = junkyardRunStage.sections[4];
  assert.equal(shouldShowLocalEnemyHealthBar('waves', normal, normal.enemies[0]), true);
  assert.equal(shouldShowLocalEnemyHealthBar('waves', midboss, midboss.enemies[0]), false);
  assert.equal(shouldShowLocalEnemyHealthBar('duel', normal, normal.enemies[0]), false);
});

test('compact wave header exposes remaining enemies and boss phase without duplicate names', () => {
  assert.equal(formatWaveHudHeader({ stageTitle: 'Junkyard Run', sectionIndex: 1, sectionCount: 7,
    sectionTitle: 'Side Door', remainingEnemies: 3, kind: 'normal' }),
  'JUNKYARD RUN · 2/7 · 3 LEFT · SIDE DOOR');
  assert.match(formatWaveHudHeader({ stageTitle: 'Junkyard Run', sectionIndex: 6, sectionCount: 7,
    sectionTitle: 'Junkyard Overtime', remainingEnemies: 2, kind: 'boss', bossPhase: 2 }), /BOSS · PHASE 2\/2/);
});
