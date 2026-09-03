import type { StageDefinition } from '../data/stages';

export const MINIMUM_WAVE_SPAWN_DISTANCE = 96;

/**
 * Validates static Wave data without needing a Phaser scene. These rules keep
 * camera, fighter bounds and the future travel director from receiving stage
 * data that can produce an unreachable or unfair encounter.
 */
export function getWaveStageValidationViolations(stage: StageDefinition): string[] {
  const violations: string[] = [];
  const knownSectionIds = new Set<string>();
  let previousMaxX = -Infinity;

  if (!Number.isFinite(stage.worldWidth) || stage.worldWidth <= 0) {
    violations.push('world width must be a positive finite number');
  }

  if (stage.sections.length === 0) {
    violations.push('stage must contain at least one section');
  }

  for (const section of stage.sections) {
    if (knownSectionIds.has(section.id)) {
      violations.push(`${section.id}: section id must be unique`);
    }
    knownSectionIds.add(section.id);

    const { bounds } = section;
    if (bounds.minX < 0 || bounds.minX >= bounds.maxX || bounds.maxX > stage.worldWidth) {
      violations.push(`${section.id}: horizontal bounds must stay inside the world and be ordered`);
    }
    if (bounds.minY < 0 || bounds.minY >= bounds.maxY) {
      violations.push(`${section.id}: vertical bounds must be ordered and non-negative`);
    }
    if (bounds.minX < previousMaxX) {
      violations.push(`${section.id}: section overlaps the previous section`);
    }
    previousMaxX = Math.max(previousMaxX, bounds.maxX);

    const playerSpawnX = bounds.minX + 140;
    const playerSpawnY = Math.min(Math.max(340, bounds.minY + 48), bounds.maxY - 48);
    for (const spawn of section.enemies) {
      if (spawn.spawnX < bounds.minX || spawn.spawnX > bounds.maxX || spawn.spawnY < bounds.minY || spawn.spawnY > bounds.maxY) {
        violations.push(`${section.id}: enemy spawn must stay inside its section bounds`);
      }

      const distance = Math.hypot(spawn.spawnX - playerSpawnX, spawn.spawnY - playerSpawnY);
      if (distance < MINIMUM_WAVE_SPAWN_DISTANCE) {
        violations.push(`${section.id}: enemy spawn is too close to the section player spawn`);
      }
    }
  }

  return violations;
}
