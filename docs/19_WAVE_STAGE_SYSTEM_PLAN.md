# 19 - Wave Stage System Plan

This document started as a future plan for LF2-inspired wave stages that scroll to the right.
It is now partially implemented and should be read as both plan and status note.

**Current update — 2026-09-08:** [Plan 31](31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md) supersedes the expansion order and exclusions below. The current stage has three zones with distinct backgrounds and seven role-based encounters (2/3/2), a tested visible-floor band, four same-zone sub-wave transitions and two explicit safe travel corridors with arrival triggers. Encounter groups now favor several weak Pigeons with selected Flanker, Zoner and Heavy peaks; zone-end rewards restore health. Authored transition cards preview each section, while active combat camera framing follows the player/enemy group. The old single-background data example is historical; `src/game/data/stages.ts` is authoritative. G1–G4 are technically implemented, while G6/G7 add interactions and bosses after G5. [Current G4 evidence](qa/g4-runtime-2026-09-08/README.md).

## Current Status

Implemented today:

- Stage definition file exists at `src/game/data/stages.ts`
- First stage `junkyard_run` exists
- 3 visual zones with 7 encounters exist
- Wave mode now uses staged sections instead of only fixed-arena respawns
- Multi-enemy section support exists
- Section-specific combat bounds exist
- Wave camera previews incoming encounters, frames active fighter groups and follows the player during travel
- Zone-end health rewards and zone-colored transition cards exist
- HUD and overlays remain screen-space

Not done yet:

- Manual four-character wave balance acceptance
- More than one real stage
- Obstacles, hazards, gates, bosses, or branching
- Broader content variety inside the staged wave structure

## Goal

Build wave-mode stages where the player progresses through multiple horizontal sections.

Example:

- Stage 1 contains 3 waves
- Wave 1 happens in section 1
- After wave 1, the camera and movement bounds open toward section 2
- Wave 2 starts farther to the right
- After wave 3, the stage is cleared

## Important Constraint

Do not replace the current fixed Duel and Test arenas.

Recommended split:

- Duel: fixed 960x540 arena
- Test: fixed 960x540 arena
- Waves: stage-based side-scroll arenas

## Data Model

```ts
type StageDefinition = {
  id: string;
  title: string;
  backgroundKey: string;
  worldWidth: number;
  scrollMode: 'fixed' | 'side_scroll';
  sections: StageSectionDefinition[];
};

type StageSectionDefinition = {
  id: string;
  title: string;
  bounds: FighterBounds;
  enemies: StageEnemySpawnDefinition[];
};

type StageEnemySpawnDefinition = {
  fighterId: FighterId;
  spawnX: number;
  spawnY: number;
  hpOverride?: number;
  moveSpeedOverride?: number;
};
```

## Required Systems

- Stage definitions
- Wider background assets or segmented backgrounds
- Camera follow for player in wave mode only
- Dynamic arena bounds per wave section
- Wave spawns based on current section
- UI fixed with `scrollFactor(0)`
- Clear transition after each section

## First Implementation Status

The first implementation already follows the intended narrow scope:

- `junkyard_run`
- 3 sections
- one wide stage background
- no obstacles
- no branching
- no infinite procedural scrolling

## Risks

- Camera follow can expose UI or depth-sorting assumptions
- Enemy spawn logic must account for camera/world coordinates
- Arena bounds must remain clear and readable on mobile
- Wide generated backgrounds need careful composition so the playable lane stays consistent

## Still Not In This Pass

- Infinite scrolling
- Doors, gates, or collision obstacles
- Story scripting
- Boss fights
- Map hazards
