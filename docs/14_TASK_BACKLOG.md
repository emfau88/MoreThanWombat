# 14 — Task Backlog

## P0 — Foundation

### TASK-001 — Create Phaser TypeScript Vite Project

Goal:
Set up the project with Phaser, TypeScript, and Vite.

Acceptance:

- `npm install` works.
- `npm run dev` works.
- `npm run build` works.
- Phaser canvas visible.

### TASK-002 — Add Scene Skeleton

Goal:
Create BootScene, PreloadScene, BattleScene.

Acceptance:

- BootScene starts PreloadScene.
- PreloadScene starts BattleScene.
- BattleScene displays placeholder arena.

### TASK-003 — Add Player Placeholder

Goal:
Create Wombat placeholder as a simple sprite/rectangle.

Acceptance:

- Player visible.
- Player has world position.
- Player has debug label.

### TASK-004 — Add Input Abstraction

Goal:
Create unified input state for keyboard and touch.

Acceptance:

- Keyboard movement works.
- Input state object consumed by player logic.

### TASK-005 — Add Mobile Touch Joystick

Goal:
Implement basic left-side virtual joystick.

Acceptance:

- Joystick controls movement.
- Movement stops on touch release.
- Desktop controls still work.

## P1 — Movement and Depth

### TASK-006 — Arena Bounds

Goal:
Limit player movement to arena floor.

Acceptance:

- Player cannot leave arena bounds.

### TASK-007 — Depth Sorting

Goal:
Sort fighters by floor `y` position.

Acceptance:

- Lower-screen fighter renders in front.

### TASK-008 — Add Enemy Dummy

Goal:
Add one non-moving enemy dummy.

Acceptance:

- Enemy visible.
- Enemy has hurtbox and HP.

## P2 — Combat Core

### TASK-009 — Fighter State Machine

Goal:
Implement basic fighter states.

Acceptance:

- idle/walk/attack/hitstun/dead exist.
- State transitions are explicit.

### TASK-010 — Attack Data Definitions

Goal:
Add data-driven attack definitions.

Acceptance:

- Wombat Jab exists as data.
- Pigeon Peck exists as data.

### TASK-011 — Hitbox and Hurtbox Debug Rendering

Goal:
Render debug boxes.

Acceptance:

- Hurtbox visible in debug.
- Hitbox visible only when active.

### TASK-012 — Player Basic Attack

Goal:
Player can attack enemy.

Acceptance:

- Attack has startup/active/recovery.
- Enemy takes damage.
- Enemy knocked back.

### TASK-013 — Hitstun and Knockback

Goal:
Make hit reaction mechanically real.

Acceptance:

- Hit enemy cannot immediately act.
- Knockback movement visible.

## P3 — Enemy AI

### TASK-014 — Enemy Approach AI

Goal:
Enemy moves toward player.

Acceptance:

- Enemy approaches within attack range.
- Enemy does not constantly overlap player.

### TASK-015 — Enemy Attack

Goal:
Enemy can damage player.

Acceptance:

- Enemy starts attack near player.
- Player loses HP when hit.

### TASK-016 — Enemy Death

Goal:
Enemy dies cleanly.

Acceptance:

- Enemy enters dead state at zero HP.
- Dead enemy cannot attack or be hit.

## P4 — Mobile Combat

### TASK-017 — Attack Button

Goal:
Add mobile attack button.

Acceptance:

- Button triggers player basic attack.
- Button does not bypass recovery.

### TASK-018 — Special Button

Goal:
Add mobile special button and placeholder or real special.

Acceptance:

- Special input triggers special state.
- Special does not break combat state machine.

### TASK-019 — Auto-Facing on Attack

Goal:
Assist mobile combat direction.

Acceptance:

- Player faces nearest enemy when attack starts.
- Facing does not flip mid-active frame.

## P5 — Game Loop

### TASK-020 — HUD

Goal:
Show player HP and enemy count.

Acceptance:

- Player HP visible.
- Enemy count or enemy HP visible.

### TASK-021 — Waves

Goal:
Add three small waves.

Acceptance:

- New wave spawns after previous enemies die.
- No endless spawn bug.

### TASK-022 — Win/Lose Conditions

Goal:
Add simple result states.

Acceptance:

- Victory shown after all waves.
- Defeat shown when player dies.
- Restart possible.

## P6 — Feel Pass

### TASK-023 — Hitstop

Goal:
Add brief hitstop on successful hit.

Acceptance:

- Hits feel stronger.
- Game does not freeze permanently.

### TASK-024 — Hit Flash

Goal:
Add visual flash on damaged fighter.

Acceptance:

- Damage feedback visible.
- Flash does not obscure fighter.

### TASK-025 — Screen Shake

Goal:
Add small camera shake on heavy hit.

Acceptance:

- Shake is noticeable but not nauseating.

## P7 — First Art Pass

### TASK-026 — Wombat Sprite Sheet Integration

Goal:
Replace placeholder with Wombat sprite sheet.

Acceptance:

- Idle/walk/attack display.
- No visible jitter.

### TASK-027 — Pigeon Sprite Sheet Integration

Goal:
Replace enemy placeholder with Pigeon sprite sheet.

Acceptance:

- Pigeon idle/walk/attack/hit display.
- No visible jitter.

### TASK-028 — Arena Background

Goal:
Add simple readable arena.

Acceptance:

- Arena supports combat readability.
- Background does not hide characters.
