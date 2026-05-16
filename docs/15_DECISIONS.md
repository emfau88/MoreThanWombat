# 15 — Decisions Log

## DEC-001 — Engine Choice

Decision:
Use Phaser with TypeScript and Vite.

Reason:
The game is a 2D sprite-based mobile-first brawler. Phaser is the most direct fit.

Rejected:

- Three.js: wrong abstraction level, 3D-focused.
- Babylon.js: overkill, 3D-focused.
- Raw Canvas: too much infrastructure work.

## DEC-002 — First Version Scope

Decision:
Build combat sandbox first, not full game.

Reason:
The game's success depends on combat feel. Menus, progression, world map, and extra content are worthless if punching feels bad.

## DEC-003 — Pseudo-Depth Model

Decision:
Use `x/y` floor plane and optional `z` visual vertical offset.

Reason:
Classic beat 'em up readability without real 3D complexity.

## DEC-004 — Depth Sorting

Decision:
Render depth is based on floor `y` position.

Reason:
Characters lower on screen should appear in front.

## DEC-005 — Combat Timing

Decision:
Every attack requires startup, active, and recovery phases.

Reason:
This creates readable, tunable combat instead of vague collision spam.

## DEC-006 — Hitbox Separation

Decision:
Sprites, hurtboxes, hitboxes, and pushboxes must be separate concepts.

Reason:
Sprite bounds are not accurate combat bounds and will make combat feel unfair.

## DEC-007 — Placeholders Before Final Assets

Decision:
Use rectangles/placeholders before final art.

Reason:
Combat logic must be proven before investing in asset polish.

## DEC-008 — Mobile Controls Are MVP

Decision:
Touch joystick and attack buttons are part of MVP, not later polish.

Reason:
The game is mobile-first. Desktop-only controls would produce misleading gameplay decisions.
