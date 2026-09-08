import type { EnemyRoleId } from '../ai/EnemyRoles';
import type { FighterBounds } from '../combat/Fighter';
import type { FighterId } from '../core/BattleModes';
import type { EncounterPressureBudget } from '../core/EncounterDirector';
import { FLAT_ARENA_VISUAL_CONTRACT } from '../core/StageVisuals';

export type WaveStageId = 'junkyard_run';
export type EnemyEntryDirection = 'left' | 'right' | 'upper_lane' | 'lower_lane';

export type StageEnemySpawnDefinition = {
  id: string;
  fighterId: FighterId;
  roleId: EnemyRoleId;
  spawnX: number;
  spawnY: number;
  entryDirection: EnemyEntryDirection;
  entryDelayMs: number;
  hpOverride?: number;
  moveSpeedOverride?: number;
};

export type EncounterCompletionRule =
  | Readonly<{ type: 'defeat_all' }>
  | Readonly<{ type: 'defeat_priority'; prioritySpawnId: string }>;

export type StageSectionDefinition = {
  id: string;
  title: string;
  objective: string;
  zoneId: string;
  /** Bounds used while enemies are active. Sub-waves in one zone share them. */
  bounds: FighterBounds;
  /** Safe forward corridor unlocked only after the final encounter of a zone. */
  travelBounds?: FighterBounds;
  /** X coordinate at which the following zone becomes active. */
  arrivalTriggerX?: number;
  /** Maximum simultaneous attack commitments the Encounter Director may grant. */
  pressureBudget: EncounterPressureBudget;
  completionRule: EncounterCompletionRule;
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

const DEFEAT_ALL = { type: 'defeat_all' } as const;
const SCRAP_GATE_BOUNDS: FighterBounds = { minX: 72, maxX: 888, minY: 248, maxY: 474 };
const FURNACE_YARD_BOUNDS: FighterBounds = { minX: 984, maxX: 1848, minY: 248, maxY: 474 };
const NEON_DUMP_BOUNDS: FighterBounds = { minX: 1944, maxX: 2808, minY: 248, maxY: 474 };

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
      id: 'gate-crasher', title: 'Gate Crasher', objective: 'Read the Pursuer rhythm.', zoneId: 'scrap-gate',
      bounds: SCRAP_GATE_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-intro', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 610, spawnY: 334,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 52, moveSpeedOverride: 120 },
      ],
    },
    {
      id: 'side-door', title: 'Side Door', objective: 'Track the delayed lane change.', zoneId: 'scrap-gate',
      bounds: SCRAP_GATE_BOUNDS,
      travelBounds: { minX: 72, maxX: 1104, minY: 248, maxY: 474 }, arrivalTriggerX: 1018,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1,
        burst: { periodMs: 4200, durationMs: 1550 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-door', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 590, spawnY: 304,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 48, moveSpeedOverride: 122 },
        { id: 'flanker-late', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 680, spawnY: 398,
          entryDirection: 'lower_lane', entryDelayMs: 900, hpOverride: 50, moveSpeedOverride: 190 },
      ],
    },
    {
      id: 'crossfire', title: 'Crossfire', objective: 'Alternate between melee and range.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0,
        burst: { periodMs: 4400, durationMs: 1700 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-crossfire', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1320, spawnY: 300,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 50, moveSpeedOverride: 124 },
        { id: 'wizard-crossfire', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 1510, spawnY: 378,
          entryDirection: 'upper_lane', entryDelayMs: 550, hpOverride: 62, moveSpeedOverride: 144 },
      ],
    },
    {
      id: 'armor-lesson', title: 'Armor Lesson', objective: 'Strip armor while managing pursuit.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'heavy-lesson', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 1370, spawnY: 370,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 104, moveSpeedOverride: 126 },
        { id: 'pigeon-lesson', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1570, spawnY: 292,
          entryDirection: 'lower_lane', entryDelayMs: 650, hpOverride: 46, moveSpeedOverride: 124 },
      ],
    },
    {
      id: 'foreman-audition', title: 'Foreman Audition', objective: 'Punish two long commitments.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      travelBounds: { minX: 984, maxX: 2064, minY: 248, maxY: 474 }, arrivalTriggerX: 1978,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1,
        burst: { periodMs: 4000, durationMs: 1900 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'heavy-elite', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 1350, spawnY: 296,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 108, moveSpeedOverride: 128 },
        { id: 'flanker-elite', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 1550, spawnY: 402,
          entryDirection: 'upper_lane', entryDelayMs: 800, hpOverride: 54, moveSpeedOverride: 194 },
      ],
    },
    {
      id: 'neon-ambush', title: 'Neon Ambush', objective: 'Survive three staggered roles.', zoneId: 'neon-dump',
      bounds: NEON_DUMP_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1,
        burst: { periodMs: 5000, durationMs: 2200 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-ambush', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2220, spawnY: 296,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 48, moveSpeedOverride: 126 },
        { id: 'wizard-ambush', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 2380, spawnY: 404,
          entryDirection: 'upper_lane', entryDelayMs: 650, hpOverride: 60, moveSpeedOverride: 146 },
        { id: 'flanker-ambush', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 2520, spawnY: 292,
          entryDirection: 'lower_lane', entryDelayMs: 1300, hpOverride: 50, moveSpeedOverride: 194 },
      ],
    },
    {
      id: 'junkyard-overtime', title: 'Junkyard Overtime', objective: 'Break the armored finale under mixed pressure.', zoneId: 'neon-dump',
      bounds: NEON_DUMP_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1,
        burst: { periodMs: 4200, durationMs: 2400 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'heavy-final', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 2250, spawnY: 370,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 112, moveSpeedOverride: 130 },
        { id: 'wizard-final', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 2410, spawnY: 280,
          entryDirection: 'upper_lane', entryDelayMs: 500, hpOverride: 64, moveSpeedOverride: 148 },
        { id: 'flanker-final', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 2520, spawnY: 404,
          entryDirection: 'lower_lane', entryDelayMs: 1050, hpOverride: 54, moveSpeedOverride: 196 },
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
