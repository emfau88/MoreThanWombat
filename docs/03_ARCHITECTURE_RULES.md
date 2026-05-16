# 03 — Architecture Rules

## Prime Rule

Do not build a god file.

No single scene or class may become the dumping ground for all logic.

## Required Architecture Style

Use small, composable modules with clear responsibilities.

Recommended structure:

```txt
src/
  main.ts
  game/
    GameConfig.ts
    scenes/
      BootScene.ts
      PreloadScene.ts
      MainMenuScene.ts
      BattleScene.ts
    core/
      InputController.ts
      MobileControls.ts
      CameraController.ts
      DepthSort.ts
    combat/
      Fighter.ts
      FighterStateMachine.ts
      CombatSystem.ts
      HitboxSystem.ts
      DamageSystem.ts
      KnockbackSystem.ts
    data/
      fighters.ts
      attacks.ts
      enemies.ts
      levels.ts
    ui/
      Hud.ts
      TouchHud.ts
    utils/
      Rect.ts
      MathUtils.ts
```

## File Size Rule

Soft limit per source file:

- 250 lines: acceptable.
- 400 lines: warning.
- 600+ lines: refactor required before adding features.

## Scene Responsibility

`BattleScene` may coordinate systems but must not own all logic.

Allowed in `BattleScene`:

- Create arena.
- Create fighters.
- Call update systems.
- Own scene-level lifecycle.

Not allowed in `BattleScene`:

- Detailed attack timing logic.
- Hardcoded hit detection rules.
- Enemy AI internals.
- Touch control implementation details.
- Fighter state machine internals.

## Data-Driven Combat

Attacks must be defined as data.

Example:

```ts
export const wombatPunch = {
  id: 'wombat_punch',
  startupMs: 100,
  activeMs: 90,
  recoveryMs: 180,
  damage: 8,
  knockbackX: 160,
  knockbackY: 20,
  hitbox: { x: 22, y: -24, width: 44, height: 34 }
};
```

Do not hardcode every attack directly inside update loops.

## State Machine Requirement

Every fighter must use explicit states.

Minimum states:

```txt
idle
walk
attack
special
hitstun
knockdown
getup
dead
```

State transitions must be readable and testable.

## Coordinate Model

Use separate concepts:

- World position: `x`, `y`.
- Visual vertical offset: `z`.
- Sprite render position: `sprite.x = x`, `sprite.y = y - z`.
- Depth sorting: based on `y`.

## Debug Mode

A debug mode must be available during development.

It should show:

- Hurtboxes.
- Active hitboxes.
- Pushboxes.
- Fighter state text.
- HP values.
- Enemy AI state.

Debug mode must be removable or toggleable.

## No Premature Abstractions

Do not introduce:

- Full ECS.
- Plugin architecture.
- Multiplayer framework.
- Save system.
- Inventory.
- Skill tree.
- Shop.
- Meta-progression.

These are not MVP requirements.
