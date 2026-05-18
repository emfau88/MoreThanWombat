# 19 - Wave Stage System Plan

This is a future plan for LF2-inspired wave stages that scroll to the right.

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

## Proposed Data Model

```ts
type StageDefinition = {
  id: string;
  title: string;
  backgroundKey: string;
  worldWidth: number;
  scrollMode: 'fixed' | 'side_scroll';
  waves: StageWaveDefinition[];
};

type StageWaveDefinition = {
  sectionIndex: number;
  bounds: FighterBounds;
  enemyFighterId: FighterId;
  enemyHp: number;
  enemyMoveSpeed: number;
  spawnX: number;
  spawnY: number;
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

## Recommended First Implementation

Start with one stage:

- `junkyard_run`
- 3 sections
- 3 waves
- one wide 2400-3200px background
- no obstacles
- no branching
- no infinite procedural scrolling

## Risks

- Camera follow can expose UI or depth-sorting assumptions
- Enemy spawn logic must account for camera/world coordinates
- Arena bounds must remain clear and readable on mobile
- Wide generated backgrounds need careful composition so the playable lane stays consistent

## Not In First Pass

- Infinite scrolling
- Doors, gates, or collision obstacles
- Multiple enemy groups per section
- Story scripting
- Boss fights
- Map hazards
