import type { StageDefinition } from '../data/stages';
import { enemyRoleContracts, fighterEnemyRoles } from '../ai/EnemyRoles';
import { getPressureBudgetViolations } from './EncounterDirector';

export const MINIMUM_WAVE_SPAWN_DISTANCE = 96;
export const MAXIMUM_WAVE_SPAWN_DISTANCE = 480;
export const MAXIMUM_WAVE_ENEMIES = 2;

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

  if (stage.zones.length === 0) {
    violations.push('stage must contain at least one visual zone');
  }

  const knownZoneIds = new Set<string>();
  let previousZoneMaxX = 0;
  for (const zone of stage.zones) {
    if (knownZoneIds.has(zone.id)) {
      violations.push(`${zone.id}: zone id must be unique`);
    }
    knownZoneIds.add(zone.id);
    if (!zone.backgroundKey || zone.minX !== previousZoneMaxX || zone.minX >= zone.maxX || zone.maxX > stage.worldWidth) {
      violations.push(`${zone.id}: zones must tile the full world in order`);
    }
    previousZoneMaxX = zone.maxX;
  }
  if (stage.zones.length > 0 && previousZoneMaxX !== stage.worldWidth) {
    violations.push('zones must cover the full world width');
  }

  for (const [sectionIndex, section] of stage.sections.entries()) {
    if (knownSectionIds.has(section.id)) {
      violations.push(`${section.id}: section id must be unique`);
    }
    knownSectionIds.add(section.id);

    const zone = stage.zones.find((candidate) => candidate.id === section.zoneId);
    if (!zone) {
      violations.push(`${section.id}: section must reference a known zone`);
    }

    const { bounds } = section;
    if (bounds.minX < 0 || bounds.minX >= bounds.maxX || bounds.maxX > stage.worldWidth) {
      violations.push(`${section.id}: horizontal bounds must stay inside the world and be ordered`);
    }
    if (zone && (bounds.minX < zone.minX || bounds.maxX > zone.maxX)) {
      violations.push(`${section.id}: combat bounds must stay inside its visual zone`);
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
    if (section.enemies.length === 0) {
      violations.push(`${section.id}: encounter must define at least one enemy spawn`);
    }
    if (section.enemies.length > MAXIMUM_WAVE_ENEMIES) {
      violations.push(`${section.id}: encounter exceeds the simultaneous enemy budget`);
    }
    violations.push(...getPressureBudgetViolations(section.pressureBudget)
      .map((violation) => `${section.id}: ${violation}`));
    for (const spawn of section.enemies) {
      if (!spawn.roleId || !(spawn.roleId in enemyRoleContracts)) {
        violations.push(`${section.id}: enemy spawn must reference a known role`);
      } else if (fighterEnemyRoles[spawn.fighterId] !== spawn.roleId) {
        violations.push(`${section.id}: enemy fighter and role must match`);
      }
      if (spawn.spawnX < bounds.minX || spawn.spawnX > bounds.maxX || spawn.spawnY < bounds.minY || spawn.spawnY > bounds.maxY) {
        violations.push(`${section.id}: enemy spawn must stay inside its section bounds`);
      }

      const distance = Math.hypot(spawn.spawnX - playerSpawnX, spawn.spawnY - playerSpawnY);
      if (distance < MINIMUM_WAVE_SPAWN_DISTANCE) {
        violations.push(`${section.id}: enemy spawn is too close to the section player spawn`);
      }
      if (distance > MAXIMUM_WAVE_SPAWN_DISTANCE) {
        violations.push(`${section.id}: enemy spawn is outside the initial camera-safe range`);
      }
    }

    for (let spawnIndex = 0; spawnIndex < section.enemies.length; spawnIndex += 1) {
      const spawn = section.enemies[spawnIndex];
      for (let otherIndex = spawnIndex + 1; otherIndex < section.enemies.length; otherIndex += 1) {
        const other = section.enemies[otherIndex];
        if (Math.hypot(spawn.spawnX - other.spawnX, spawn.spawnY - other.spawnY) < MINIMUM_WAVE_SPAWN_DISTANCE) {
          violations.push(`${section.id}: enemy spawns are too close together`);
        }
      }
    }

    const nextSection = stage.sections[sectionIndex + 1];
    if (!nextSection) {
      continue;
    }

    if (!section.travelBounds || section.arrivalTriggerX === undefined) {
      violations.push(`${section.id}: non-final section must define a travel corridor and arrival trigger`);
      continue;
    }

    const travel = section.travelBounds;
    if (
      travel.minX > bounds.minX
      || travel.maxX <= bounds.maxX
      || travel.minY !== bounds.minY
      || travel.maxY !== bounds.maxY
      || travel.minX < 0
      || travel.maxX > stage.worldWidth
    ) {
      violations.push(`${section.id}: travel bounds must extend the combat lane inside the world`);
    }
    if (section.arrivalTriggerX < travel.minX || section.arrivalTriggerX > travel.maxX) {
      violations.push(`${section.id}: arrival trigger must stay inside the travel corridor`);
    }
    if (section.arrivalTriggerX < nextSection.bounds.minX || section.arrivalTriggerX > nextSection.bounds.maxX) {
      violations.push(`${section.id}: arrival trigger must enter the next combat bounds without repositioning`);
    }
  }

  return violations;
}
