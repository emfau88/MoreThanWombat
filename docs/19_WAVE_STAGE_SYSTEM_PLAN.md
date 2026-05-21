# 19 - Wave Stage System Plan

This document started as a future plan for LF2-inspired wave stages that scroll to the right.
It is now partially implemented and should be read as both plan and status note.

## Current Status

Implemented today:

- Stage definition file exists at `src/game/data/stages.ts`
- First stage `junkyard_run` exists
- 3 horizontal sections exist
- Wave mode now uses staged sections instead of only fixed-arena respawns
- Multi-enemy section support exists
- Section-specific combat bounds exist
- Camera follow exists in Wave mode only
- HUD and overlays remain screen-space

Not done yet:

- Proper wave polish/balancing pass
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
