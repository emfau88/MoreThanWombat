import assert from 'node:assert/strict';
import test from 'node:test';
import { findSafeWaveSpawn, isWaveActorVisible } from '../src/game/core/WaveSafety';
import { junkyardRunStage } from '../src/game/data/stages';

test('every current entry finds separated visible spawns across arrival lanes and camera positions', () => {
  for (const [index, section] of junkyardRunStage.sections.entries()) {
    for (const y of [248, 340, 474]) {
      const player = { x: index ? junkyardRunStage.sections[index - 1].arrivalTriggerX! : 212, y };
      for (const width of [960, 1200]) {
        const x = Math.max(0, Math.min(player.x - width / 2, 2880 - width));
        const view = { x, right: x + width, y: 0, bottom: 540 };
        const occupied = [player];
        for (const spawn of section.enemies) {
          const actual = findSafeWaveSpawn({ x: spawn.spawnX, y: spawn.spawnY }, section.bounds, view, occupied);
          assert.ok(actual, `${section.id}, lane ${y}, width ${width}`);
          assert.ok(isWaveActorVisible(actual, view));
          for (const other of occupied) assert.ok(Math.hypot(actual.x - other.x, actual.y - other.y) >= 112);
          occupied.push(actual);
        }
      }
    }
  }
});

test('unsafe geometry fails closed instead of falling back to an overlap', () => {
  assert.equal(findSafeWaveSpawn({ x: 100, y: 100 }, { minX: 100, maxX: 110, minY: 100, maxY: 110 },
    { x: 0, y: 0, right: 960, bottom: 540 }, [{ x: 100, y: 100 }]), null);
  assert.equal(isWaveActorVisible({ x: 20, y: 330 }, { x: 0, y: 0, right: 960, bottom: 540 }), false);
});
