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
  bounds: FighterBounds;
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
        maxX: 888,
        minY: 248,
        maxY: 474,
      },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 690,
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
        minX: 888,
        maxX: 1704,
        minY: 248,
        maxY: 474,
      },
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
          spawnX: 1450,
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
        minX: 1704,
        maxX: 2520,
        minY: 248,
        maxY: 474,
      },
      enemies: [
        {
          fighterId: 'angry_pigeon',
          spawnX: 2110,
          spawnY: 362,
          hpOverride: 54,
          moveSpeedOverride: 126,
        },
        {
          fighterId: 'discount_wizard',
          spawnX: 2310,
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
