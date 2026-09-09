import type { StageDefinition } from '../data/stages';
import { enemyRoleContracts, fighterEnemyRoles } from '../ai/EnemyRoles';
import { getPressureBudgetViolations } from './EncounterDirector';

export const MINIMUM_WAVE_SPAWN_DISTANCE = 96;
export const MAXIMUM_WAVE_SPAWN_DISTANCE = 480;
export const MAXIMUM_WAVE_ENEMIES = 4;
export const MAXIMUM_STAGE_INTERACTIONS = 2;

/**
 * Validates static Wave data without needing a Phaser scene. These rules keep
 * camera, fighter bounds and the future travel director from receiving stage
 * data that can produce an unreachable or unfair encounter.
 */
export function getWaveStageValidationViolations(stage: StageDefinition): string[] {
  const violations: string[] = [];
  const knownSectionIds = new Set<string>();
  let previousMaxX = -Infinity;
  let previousZoneIndex = -1;

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
    const zoneIndex = stage.zones.findIndex((candidate) => candidate.id === section.zoneId);
    if (!zone) {
      violations.push(`${section.id}: section must reference a known zone`);
    } else if (zoneIndex < previousZoneIndex) {
      violations.push(`${section.id}: sections must follow zone order`);
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
    if (zoneIndex !== previousZoneIndex && bounds.minX < previousMaxX) {
      violations.push(`${section.id}: section overlaps the previous section`);
    }
    if (zoneIndex !== previousZoneIndex) previousMaxX = Math.max(previousMaxX, bounds.maxX);
    if (zoneIndex >= 0) previousZoneIndex = zoneIndex;

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
    if (section.completionRule.type === 'defeat_priority') {
      const prioritySpawnId = section.completionRule.prioritySpawnId;
      if (!section.enemies.some((spawn) => spawn.id === prioritySpawnId)) {
        violations.push(`${section.id}: priority completion must reference an enemy spawn`);
      }
    }
    if (section.clearReward) {
      if (!Number.isFinite(section.clearReward.healthRatio)
        || section.clearReward.healthRatio <= 0
        || section.clearReward.healthRatio > 1) {
        violations.push(`${section.id}: clear reward health ratio must be greater than zero and at most one`);
      }
      if (!section.clearReward.label.trim()) {
        violations.push(`${section.id}: clear reward label must not be empty`);
      }
    }
    const interactionIds = new Set<string>();
    if ((section.interactions?.length ?? 0) > MAXIMUM_STAGE_INTERACTIONS) {
      violations.push(`${section.id}: encounter exceeds the stage interaction budget`);
    }
    for (const interaction of section.interactions ?? []) {
      if (!interaction.id || interactionIds.has(interaction.id)) {
        violations.push(`${section.id}: stage interaction ids must be unique`);
      }
      interactionIds.add(interaction.id);
      if (interaction.x < bounds.minX || interaction.x > bounds.maxX
        || interaction.y < bounds.minY || interaction.y > bounds.maxY) {
        violations.push(`${section.id}: stage interactions must stay inside combat bounds`);
      }
      if (!interaction.label.trim()) violations.push(`${section.id}: stage interaction label must not be empty`);
      if (interaction.type === 'steam_vent') {
        const positiveValues = [interaction.radiusX, interaction.radiusY, interaction.telegraphMs,
          interaction.activeMs, interaction.cooldownMs, interaction.damage, interaction.knockback];
        if (positiveValues.some((value) => !Number.isFinite(value) || value <= 0)
          || !Number.isFinite(interaction.initialDelayMs) || interaction.initialDelayMs < 0) {
          violations.push(`${section.id}: steam vent values must be finite with positive size, timing and impact`);
        }
      } else if (!Number.isFinite(interaction.collectRadius) || interaction.collectRadius <= 0
        || !Number.isFinite(interaction.healthRatio) || interaction.healthRatio < 0 || interaction.healthRatio > 1
        || !Number.isFinite(interaction.manaRatio) || interaction.manaRatio < 0 || interaction.manaRatio > 1
        || interaction.healthRatio + interaction.manaRatio <= 0) {
        violations.push(`${section.id}: resource pickup values must define a positive bounded reward and radius`);
      }
    }
    const spawnIds = new Set<string>();
    for (const spawn of section.enemies) {
      if (!spawn.id || spawnIds.has(spawn.id)) violations.push(`${section.id}: enemy spawn ids must be unique`);
      spawnIds.add(spawn.id);
      if (!spawn.roleId || !(spawn.roleId in enemyRoleContracts)) {
        violations.push(`${section.id}: enemy spawn must reference a known role`);
      } else if (fighterEnemyRoles[spawn.fighterId] !== spawn.roleId) {
        violations.push(`${section.id}: enemy fighter and role must match`);
      }
      if (!Number.isFinite(spawn.entryDelayMs) || spawn.entryDelayMs < 0) {
        violations.push(`${section.id}: enemy entry delay must be a non-negative finite number`);
      }
      if (!['left', 'right', 'upper_lane', 'lower_lane'].includes(spawn.entryDirection)) {
        violations.push(`${section.id}: enemy entry direction must be known`);
      }
      if (spawn.spawnX < bounds.minX || spawn.spawnX > bounds.maxX || spawn.spawnY < bounds.minY || spawn.spawnY > bounds.maxY) {
        violations.push(`${section.id}: enemy spawn must stay inside its section bounds`);
      }
      if (spawn.aiProfile === 'scrap_foreman') {
        const interaction = section.interactions?.find((candidate) => candidate.id === spawn.stageInteractionId);
        if (!interaction || interaction.type !== 'steam_vent' || interaction.trigger !== 'midboss_command') {
          violations.push(`${section.id}: scrap foreman must reference a command-triggered steam vent`);
        }
      } else if (spawn.stageInteractionId) {
        violations.push(`${section.id}: only an authored AI profile may command a stage interaction`);
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
      if (section.travelBounds || section.arrivalTriggerX !== undefined) {
        violations.push(`${section.id}: final encounter must not define travel`);
      }
      continue;
    }

    if (nextSection.zoneId === section.zoneId) {
      if (section.travelBounds || section.arrivalTriggerX !== undefined) {
        violations.push(`${section.id}: travel is only allowed between zones`);
      }
      if (JSON.stringify(section.bounds) !== JSON.stringify(nextSection.bounds)) {
        violations.push(`${section.id}: sub-waves in one zone must share combat bounds`);
      }
      continue;
    }

    if (!section.travelBounds || section.arrivalTriggerX === undefined) {
      violations.push(`${section.id}: final zone encounter must define a travel corridor and arrival trigger`);
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
