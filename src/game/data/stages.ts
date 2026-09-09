import type { EnemyRoleId } from '../ai/EnemyRoles';
import type { FighterBounds } from '../combat/Fighter';
import type { FighterId } from '../core/BattleModes';
import type { EncounterPressureBudget } from '../core/EncounterDirector';
import { FLAT_ARENA_VISUAL_CONTRACT } from '../core/StageVisuals';

export type WaveStageId = 'junkyard_run';
export type EnemyEntryDirection = 'left' | 'right' | 'upper_lane' | 'lower_lane';
export type EnemyAiProfile = 'scrap_foreman' | 'junkyard_boss';

export type SteamVentInteractionDefinition = Readonly<{
  id: string;
  type: 'steam_vent';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  trigger: 'periodic' | 'midboss_command';
  initialDelayMs: number;
  telegraphMs: number;
  activeMs: number;
  cooldownMs: number;
  damage: number;
  knockback: number;
  label: string;
}>;

export type ResourcePickupInteractionDefinition = Readonly<{
  id: string;
  type: 'resource_pickup';
  x: number;
  y: number;
  collectRadius: number;
  healthRatio: number;
  manaRatio: number;
  label: string;
}>;

export type StageInteractionDefinition = SteamVentInteractionDefinition | ResourcePickupInteractionDefinition;

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
  labelOverride?: string;
  aiProfile?: EnemyAiProfile;
  stageInteractionId?: string;
  stageInteractionIds?: readonly string[];
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
  interactions?: readonly StageInteractionDefinition[];
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
      interactions: [{
        id: 'crossfire-steam', type: 'steam_vent', x: 1435, y: 394, radiusX: 68, radiusY: 34,
        trigger: 'periodic', initialDelayMs: 1800, telegraphMs: 900, activeMs: 260, cooldownMs: 4600,
        damage: 8, knockback: 150, label: 'PRESSURE LEAK',
      }],
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
      interactions: [{
        id: 'union-lunchbox', type: 'resource_pickup', x: 1190, y: 426, collectRadius: 48,
        healthRatio: 0.18, manaRatio: 0.25, label: 'Union Lunchbox',
      }],
    },
    {
      id: 'foreman-audition', title: 'Foreman Audition', objective: 'Read the Foreman, then let safety fail him.', zoneId: 'furnace-yard',
      bounds: FURNACE_YARD_BOUNDS,
      travelBounds: { minX: 984, maxX: 2064, ...JUNKYARD_WALKABLE_BAND }, arrivalTriggerX: 1978,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1 },
      completionRule: { type: 'defeat_priority', prioritySpawnId: 'acting-foreman' },
      enemies: [
        { id: 'acting-foreman', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 1510, spawnY: 372,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 132, moveSpeedOverride: 132,
          labelOverride: 'Acting Foreman', aiProfile: 'scrap_foreman', stageInteractionId: 'foreman-steam' },
      ],
      interactions: [{
        id: 'foreman-steam', type: 'steam_vent', x: 1470, y: 402, radiusX: 82, radiusY: 38,
        trigger: 'midboss_command', initialDelayMs: 0, telegraphMs: 1050, activeMs: 300, cooldownMs: 2600,
        damage: 9, knockback: 175, label: 'MANDATORY SAFETY DRILL',
      }],
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
      id: 'junkyard-overtime', title: 'Junkyard Overtime',
      objective: 'Read the Supervisor, rotate out of lockdown, punish the shift change.', zoneId: 'neon-dump',
      bounds: NEON_DUMP_BOUNDS,
      pressureBudget: { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 1,
        burst: { periodMs: 4600, durationMs: 2200 } },
      completionRule: { type: 'defeat_priority', prioritySpawnId: 'overtime-supervisor' },
      enemies: [
        { id: 'overtime-supervisor', fighterId: 'scrap_heavy', roleId: 'heavy', spawnX: 2500, spawnY: 386,
          entryDirection: 'right', entryDelayMs: 0, hpOverride: 220, moveSpeedOverride: 142,
          labelOverride: 'Overtime Supervisor', aiProfile: 'junkyard_boss',
          stageInteractionIds: ['overtime-upper-vent', 'overtime-lower-vent'] },
        { id: 'pigeon-union-rep', fighterId: 'angry_pigeon', roleId: 'pursuer', spawnX: 2250, spawnY: 330,
          entryDirection: 'upper_lane', entryDelayMs: 1600, hpOverride: 32, moveSpeedOverride: 118 },
      ],
      interactions: [
        {
          id: 'overtime-upper-vent', type: 'steam_vent', x: 2420, y: 342, radiusX: 126, radiusY: 30,
          trigger: 'midboss_command', initialDelayMs: 0, telegraphMs: 1050, activeMs: 320, cooldownMs: 1200,
          damage: 10, knockback: 185, label: 'UPPER LANE LOCKDOWN',
        },
        {
          id: 'overtime-lower-vent', type: 'steam_vent', x: 2420, y: 438, radiusX: 126, radiusY: 30,
          trigger: 'midboss_command', initialDelayMs: 0, telegraphMs: 1050, activeMs: 320, cooldownMs: 1200,
          damage: 10, knockback: 185, label: 'LOWER LANE LOCKDOWN',
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
