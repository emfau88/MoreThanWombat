import type { FighterBounds } from '../combat/Fighter';
import type { FighterId } from '../core/BattleModes';
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
  /** Bounds used while enemies are active. */
  bounds: FighterBounds;
  /** Safe forward corridor unlocked after this section is cleared. */
  travelBounds?: FighterBounds;
  /** X coordinate at which the following encounter becomes active. */
  arrivalTriggerX?: number;
  enemies: StageEnemySpawnDefinition[];
};

export type StageDefinition = {
  id: WaveStageId;
  title: string;
  backgroundKey: string;
  worldWidth: number;
  scrollMode: 'fixed' | 'side_scroll';
  sections: StageSectionDefinition[];
};

export const junkyardRunStage: StageDefinition = {
  id: 'junkyard_run',
  title: 'Junkyard Run',
  backgroundKey: 'scrapyard-background',
  worldWidth: 2640,
  scrollMode: 'side_scroll',
  sections: [
    {
      id: 'yard-entry',
      title: 'Entry Scrap',
      bounds: {
        minX: 72,
        maxX: 720,
        minY: 248,
        maxY: 474,
      },
      travelBounds: {
        minX: 72,
        maxX: 960,
        minY: 248,
        maxY: 474,
      },
      arrivalTriggerX: 850,
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
      title: 'Crusher Lane',
      bounds: {
        minX: 816,
        maxX: 1460,
        minY: 248,
        maxY: 474,
      },
      travelBounds: {
        minX: 816,
        maxX: 1744,
        minY: 248,
        maxY: 474,
      },
      arrivalTriggerX: 1634,
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 1180,
          spawnY: 308,
          hpOverride: 52,
          moveSpeedOverride: 122,
        },
        {
          fighterId: 'budget_barbarian',
          spawnX: 1310,
          spawnY: 350,
          hpOverride: 70,
          moveSpeedOverride: 132,
        },
      ],
    },
    {
      id: 'wizard-pit',
      title: 'Wizard Pit',
      bounds: {
        minX: 1600,
        maxX: 2416,
        minY: 248,
        maxY: 474,
      },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 1900,
          spawnY: 362,
          hpOverride: 54,
          moveSpeedOverride: 126,
        },
        {
          fighterId: 'discount_wizard',
          spawnX: 2080,
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
