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
  clearReward?: Readonly<{ healthRatio: number; label: string }>;
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
export const JUNKYARD_WALKABLE_BAND = Object.freeze({ minY: 310, maxY: 468 });
const SCRAP_GATE_BOUNDS: FighterBounds = { minX: 72, maxX: 888, ...JUNKYARD_WALKABLE_BAND };
const FURNACE_YARD_BOUNDS: FighterBounds = { minX: 984, maxX: 1848, ...JUNKYARD_WALKABLE_BAND };
const NEON_DUMP_BOUNDS: FighterBounds = { minX: 1944, maxX: 2808, ...JUNKYARD_WALKABLE_BAND };

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
        { id: 'pigeon-intro', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 610, spawnY: 356,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 34, moveSpeedOverride: 112 },
      ],
    },
    {
      id: 'side-door', title: 'Side Door', objective: 'Track the delayed lane change.', zoneId: 'scrap-gate',
      bounds: SCRAP_GATE_BOUNDS,
      travelBounds: { minX: 72, maxX: 1104, ...JUNKYARD_WALKABLE_BAND }, arrivalTriggerX: 1018,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1,
        burst: { periodMs: 4200, durationMs: 1550 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-door', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 560, spawnY: 340,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 30, moveSpeedOverride: 112 },
        { id: 'pigeon-door-late', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 660, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 450, hpOverride: 30, moveSpeedOverride: 114 },
        { id: 'flanker-late', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 680, spawnY: 332,
          entryDirection: 'upper_lane', entryDelayMs: 1000, hpOverride: 42, moveSpeedOverride: 178 },
      ],
      clearReward: { healthRatio: 0.25, label: 'Suspicious Scrap Snack' },
    },
    {
      id: 'crossfire', title: 'Crossfire', objective: 'Alternate between melee and range.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0,
        burst: { periodMs: 4400, durationMs: 1700 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-crossfire', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1280, spawnY: 342,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 30, moveSpeedOverride: 114 },
        { id: 'pigeon-crossfire-late', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1430, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 500, hpOverride: 28, moveSpeedOverride: 112 },
        { id: 'wizard-crossfire', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 1580, spawnY: 354,
          entryDirection: 'upper_lane', entryDelayMs: 1000, hpOverride: 46, moveSpeedOverride: 136 },
      ],
    },
    {
      id: 'armor-lesson', title: 'Armor Lesson', objective: 'Strip armor while managing pursuit.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'heavy-lesson', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 1320, spawnY: 380,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 78, moveSpeedOverride: 116 },
        { id: 'pigeon-lesson', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1480, spawnY: 332,
          entryDirection: 'upper_lane', entryDelayMs: 550, hpOverride: 28, moveSpeedOverride: 114 },
        { id: 'pigeon-lesson-late', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1595, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 1100, hpOverride: 28, moveSpeedOverride: 114 },
      ],
    },
    {
      id: 'foreman-audition', title: 'Foreman Audition', objective: 'Punish two long commitments.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      travelBounds: { minX: 984, maxX: 2064, ...JUNKYARD_WALKABLE_BAND }, arrivalTriggerX: 1978,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1,
        burst: { periodMs: 4000, durationMs: 1900 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-foreman', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 1280, spawnY: 338,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 30, moveSpeedOverride: 116 },
        { id: 'flanker-elite', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 1460, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 550, hpOverride: 44, moveSpeedOverride: 182 },
        { id: 'heavy-elite', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 1600, spawnY: 354,
          entryDirection: 'upper_lane', entryDelayMs: 1250, hpOverride: 84, moveSpeedOverride: 118 },
      ],
      clearReward: { healthRatio: 0.3, label: 'Questionable First-Aid Can' },
    },
    {
      id: 'neon-ambush', title: 'Neon Ambush', objective: 'Survive three staggered roles.', zoneId: 'neon-dump',
      bounds: NEON_DUMP_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1,
        burst: { periodMs: 5000, durationMs: 2200 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-ambush', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2200, spawnY: 338,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 28, moveSpeedOverride: 116 },
        { id: 'pigeon-ambush-late', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2300, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 450, hpOverride: 28, moveSpeedOverride: 116 },
        { id: 'wizard-ambush', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 2440, spawnY: 350,
          entryDirection: 'upper_lane', entryDelayMs: 1000, hpOverride: 44, moveSpeedOverride: 138 },
        { id: 'flanker-ambush', fighterId: 'scrap_flanker', roleId: 'flanker', spawnX: 2550, spawnY: 424,
          entryDirection: 'lower_lane', entryDelayMs: 1550, hpOverride: 40, moveSpeedOverride: 184 },
      ],
    },
    {
      id: 'junkyard-overtime', title: 'Junkyard Overtime', objective: 'Break the armored finale under mixed pressure.', zoneId: 'neon-dump',
      bounds: NEON_DUMP_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1,
        burst: { periodMs: 4200, durationMs: 2400 } }, completionRule: DEFEAT_ALL,
      enemies: [
        { id: 'pigeon-final', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2200, spawnY: 338,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 30, moveSpeedOverride: 118 },
        { id: 'pigeon-final-late', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2280, spawnY: 430,
          entryDirection: 'lower_lane', entryDelayMs: 450, hpOverride: 30, moveSpeedOverride: 118 },
        { id: 'heavy-final', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 2440, spawnY: 354,
          entryDirection: 'upper_lane', entryDelayMs: 1050, hpOverride: 90, moveSpeedOverride: 120 },
        { id: 'wizard-final', fighterId: 'discount_wizard', roleId: 'zoner', spawnX: 2550, spawnY: 424,
          entryDirection: 'lower_lane', entryDelayMs: 1650, hpOverride: 48, moveSpeedOverride: 140 },
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
