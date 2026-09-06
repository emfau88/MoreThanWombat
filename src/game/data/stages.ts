import type { FighterBounds } from '../combat/Fighter';
import type { FighterId } from '../core/BattleModes';
import type { EncounterPressureBudget } from '../core/EncounterDirector';
import { FLAT_ARENA_VISUAL_CONTRACT } from '../core/StageVisuals';

export type WaveStageId = 'junkyard_run';

export type StageEnemySpawnDefinition = {
  fighterId: FighterId;
  spawnX: number;
  spawnY: number;
  hpOverride?: number;
  moveSpeedOverride?: number;
};

export type StageSectionDefinition = {
  id: string;
  title: string;
  zoneId: string;
  /** Bounds used while enemies are active. */
  bounds: FighterBounds;
  /** Safe forward corridor unlocked after this section is cleared. */
  travelBounds?: FighterBounds;
  /** X coordinate at which the following encounter becomes active. */
  arrivalTriggerX?: number;
  /** Maximum simultaneous attack commitments the Encounter Director may grant. */
  pressureBudget: EncounterPressureBudget;
  enemies: StageEnemySpawnDefinition[];
};

export type StageZoneDefinition = {
  id: string;
  title: string;
  backgroundKey: string;
  minX: number;
  maxX: number;
  transitionColor: number;
};

export type StageDefinition = {
  id: WaveStageId;
  title: string;
  worldWidth: number;
  scrollMode: 'fixed' | 'side_scroll';
  zones: StageZoneDefinition[];
  sections: StageSectionDefinition[];
};

export const junkyardRunStage: StageDefinition = {
  id: 'junkyard_run',
  title: 'Junkyard Run',
  worldWidth: 2880,
  scrollMode: 'side_scroll',
  zones: [
    { id: 'scrap-gate', title: 'Scrap Gate', backgroundKey: 'junkyard-run-scrap-gate', minX: 0, maxX: 960, transitionColor: 0xc77935 },
    { id: 'furnace-yard', title: 'Furnace Yard', backgroundKey: 'junkyard-run-furnace-yard', minX: 960, maxX: 1920, transitionColor: 0xd34c47 },
    { id: 'neon-dump', title: 'Neon Dump', backgroundKey: 'junkyard-run-neon-dump', minX: 1920, maxX: 2880, transitionColor: 0xb55cff },
  ],
  sections: [
    {
      id: 'yard-entry',
      title: 'Scrap Gate',
      zoneId: 'scrap-gate',
      bounds: {
        minX: 72,
        maxX: 720,
        minY: 248,
        maxY: 474,
      },
      travelBounds: {
        minX: 72,
        maxX: 1104,
        minY: 248,
        maxY: 474,
      },
      arrivalTriggerX: 1018,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 610,
          spawnY: 334,
          hpOverride: 56,
          moveSpeedOverride: 120,
        },
      ],
    },
    {
      id: 'crusher-lane',
      title: 'Furnace Yard',
      zoneId: 'furnace-yard',
      bounds: {
        minX: 984,
        maxX: 1656,
        minY: 248,
        maxY: 474,
      },
      travelBounds: {
        minX: 984,
        maxX: 2064,
        minY: 248,
        maxY: 474,
      },
      arrivalTriggerX: 1978,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0 },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 1340,
          spawnY: 308,
          hpOverride: 52,
          moveSpeedOverride: 122,
        },
        {
          fighterId: 'angry_pigeon',
          spawnX: 1478,
          spawnY: 350,
          hpOverride: 70,
          moveSpeedOverride: 110,
        },
      ],
    },
    {
      id: 'wizard-pit',
      title: 'Neon Dump',
      zoneId: 'neon-dump',
      bounds: {
        minX: 1944,
        maxX: 2808,
        minY: 248,
        maxY: 474,
      },
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0, burst: { periodMs: 5000, durationMs: 1800 } },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 2240,
          spawnY: 362,
          hpOverride: 54,
          moveSpeedOverride: 126,
        },
        {
          fighterId: 'discount_wizard',
          spawnX: 2430,
          spawnY: 314,
          hpOverride: 86,
          moveSpeedOverride: 144,
        },
      ],
    },
  ],
};

export const stageVisualContracts: Record<WaveStageId, typeof FLAT_ARENA_VISUAL_CONTRACT> = {
  junkyard_run: FLAT_ARENA_VISUAL_CONTRACT,
};

export const waveStages: Record<WaveStageId, StageDefinition> = {
  junkyard_run: junkyardRunStage,
};

export const defaultWaveStageId: WaveStageId = 'junkyard_run';
