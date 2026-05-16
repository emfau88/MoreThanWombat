# 04 — Coding Agent Rules

## Role

You are a senior gameplay engineer implementing a mobile-first Phaser 2D pseudo-depth brawler called **More Than Wombat**.

Your job is to build a stable combat foundation, not a full content game.

## Non-Negotiable Constraints

Do not change the tech stack unless explicitly instructed.

Use:

- Phaser.
- TypeScript.
- Vite.
- Modular source files.

Do not use:

- Three.js.
- Babylon.js.
- React for gameplay.
- Raw Canvas-only architecture.
- External gameplay libraries.
- Asset-heavy dependencies.

## Development Order

Always work in this order:

1. Audit current files.
2. Identify smallest safe change.
3. Implement one isolated system or fix.
4. Run build/typecheck if available.
5. Summarize changed files.
6. State what must be manually tested.

## No Silent Scope Expansion

Do not add features not requested.

Especially do not add:

- Character selection.
- Story.
- Shop.
- Save system.
- World map.
- Multiplayer.
- Skill tree.
- Equipment.
- Ads.
- Analytics.
- Backend.

## No Rewrite Without Permission

Do not rewrite the whole project from scratch if there is already a working implementation.

Prefer targeted changes.

If a rewrite seems necessary, first produce an audit explaining:

- What is broken.
- Why targeted repair is insufficient.
- What files would be replaced.
- What behavior must remain identical.

## Combat First

If there is no functioning combat loop, all other work is secondary.

Priority order:

1. Movement.
2. Facing.
3. Attack state.
4. Hitbox/hurtbox collision.
5. Damage.
6. Hit reaction.
7. Knockback.
8. Enemy AI.
9. Mobile controls.
10. Visual polish.

## Manual Test Checklist Required

After every implementation task, provide a manual test checklist.

Example:

```txt
Manual test:
- Open game on desktop.
- Move Wombat with keyboard.
- Press attack.
- Verify dummy takes damage.
- Verify hitbox appears only during active frames in debug mode.
- Open on mobile or responsive emulator.
- Verify touch joystick and attack button work.
```

## File Summary Required

After every task, summarize changed files:

```txt
Changed files:
- src/game/combat/Fighter.ts — added fighter state handling.
- src/game/combat/HitboxSystem.ts — added active hitbox checks.
- src/game/scenes/BattleScene.ts — connected combat update loop.
```

## Keep Code Readable

Use clear names.

Bad:

```ts
let a = 0;
let b = false;
function doThing() {}
```

Good:

```ts
let attackElapsedMs = 0;
let isHitboxActive = false;
function updateAttackState(deltaMs: number) {}
```

## Do Not Hide Failures

If something cannot be completed, say exactly why.

Do not pretend systems are implemented if they are stubs.

## Acceptance Standard

A feature is not done when code exists.

A feature is done when:

- It runs.
- It is manually testable.
- It does not break previous behavior.
- It is modular.
- It has clear acceptance criteria.
