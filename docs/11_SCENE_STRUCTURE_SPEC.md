# 11 — Scene Structure Specification

## Required Scenes

### BootScene

Purpose:

- Initialize basic game settings.
- Prepare scale mode if necessary.
- Immediately continue to PreloadScene.

### PreloadScene

Purpose:

- Load assets.
- Show simple loading progress later.
- Continue to MainMenuScene or BattleScene during early development.

### MainMenuScene

Purpose:

- Minimal menu later.
- For MVP, this may be skipped or contain only Start button.

### BattleScene

Purpose:

- Run combat gameplay.
- Spawn player and enemies.
- Update combat systems.
- Update HUD.

## MVP Shortcut

During early development, `PreloadScene` may directly start `BattleScene`.

Do not spend time polishing menus before combat works.

## BattleScene Responsibilities

Allowed:

- Create arena bounds.
- Create player and enemies.
- Create systems.
- Call system updates.
- Handle win/lose scene-level flow.

Not allowed:

- Contain all combat logic.
- Contain all input logic.
- Contain all AI logic.
- Contain hardcoded attack timing internals.

## System Update Order

Recommended order per frame:

1. Read input.
2. Update player intent/state.
3. Update enemy AI intent/state.
4. Update fighter state machines.
5. Apply movement.
6. Resolve pushbox/body overlap.
7. Update attack hitboxes.
8. Resolve hits/damage/knockback.
9. Apply visual positions.
10. Depth sort.
11. Update HUD/debug visuals.

## Camera

MVP camera can be simple:

- Fixed camera if arena fits screen.
- Slight follow later.

Do not build complex camera until combat works.

## Arena

First arena:

```txt
width: 1400
height: 520
visible floor depth: y range 240-480 or similar
```

Use clear bounds.

## Depth Sorting

Depth sorting rule:

```ts
fighter.sprite.setDepth(fighter.y);
```

Effects and shadows need specific depth handling:

- Shadow slightly below fighter depth.
- Hit effects slightly above fighter depth.
- UI always fixed/high depth.

## Pause/Restart

For MVP:

- Restart button or key can reload BattleScene.
- No full pause menu required.
