# 05 - Roadmap

Historical foundation roadmap.

This file still matters as the original build-order logic, but it no longer describes the current shipped prototype.
For current execution priorities, use:

- `16_CURRENT_ROADMAP.md`
- `17_OPEN_TASKS.md`
- `18_NEXT_STEPS.md`
- `22_HANDOFF_FOR_NEW_CHAT.md`

## Phase 0 - Project Setup

Goal: Create a clean Phaser + TypeScript + Vite project.

Deliverables:

- Project boots in browser.
- Empty game canvas visible.
- Phaser scene lifecycle works.
- Basic responsive scaling works.
- No gameplay yet.

Acceptance:

- `npm install` works.
- `npm run dev` works.
- `npm run build` works.
- Game opens on desktop browser.
- Game opens in mobile browser or mobile emulator.

## Phase 1 - Combat Sandbox Foundation

Goal: One player and one dummy enemy in an arena.

Deliverables:

- Wombat placeholder rectangle or sprite.
- Dummy enemy placeholder.
- Four-direction movement.
- Facing left/right.
- Arena bounds.
- Depth sorting by `y`.
- Desktop keyboard controls.
- Basic mobile touch joystick.

Acceptance:

- Player can move around arena.
- Player cannot leave arena.
- Sprite depth changes correctly by vertical position.
- Controls work on desktop and mobile.

## Phase 2 - First Attack

Goal: One functional normal attack.

Deliverables:

- Attack state.
- Attack timing: startup, active, recovery.
- Active hitbox.
- Enemy hurtbox.
- Damage application.
- Hit reaction.
- Knockback.
- Debug hitbox rendering.

Acceptance:

- Pressing attack triggers animation/state.
- Hitbox exists only during active frames.
- Enemy loses HP when hit.
- Enemy is knocked back.
- Enemy cannot be hit multiple times by same attack unless explicitly allowed.

## Phase 3 - Enemy AI

Goal: Enemy can approach and attack.

Deliverables:

- Enemy AI states: idle, approach, attack, recover.
- Simple distance-based behavior.
- Enemy attack hitbox.
- Player hurtbox interaction.

Acceptance:

- Enemy approaches player.
- Enemy attacks only within reasonable range.
- Enemy does not constantly overlap player.
- Player can take damage.

## Phase 4 - Mobile Combat Pass

Goal: Combat is playable on phone.

Deliverables:

- Touch joystick.
- Attack button.
- Special button placeholder or implementation.
- Optional dodge/jump button.
- Auto-facing helper.
- Button layout safe for thumbs.

Acceptance:

- Player can move and attack comfortably on mobile.
- Buttons do not cover critical action.
- Inputs do not stick.
- No accidental multi-input chaos.

## Phase 5 - Feel Pass

Goal: Make hits satisfying.

Deliverables:

- Hitstop.
- Small screen shake.
- Hit flash.
- Dust effect placeholder.
- Damage number placeholder optional.

Acceptance:

- Hits feel noticeably stronger.
- Effects do not hide readability.
- Performance remains stable.

## Phase 6 - First Arena Wave

Goal: A tiny playable level.

Deliverables:

- Three enemy waves.
- Spawn points.
- Victory condition.
- Defeat condition.
- Minimal HUD.

Acceptance:

- Player can win.
- Player can lose.
- Waves spawn predictably.
- No endless broken state.

## Phase 7 - Visual Identity Pass

Goal: Replace placeholders with first real style pass.

Deliverables:

- Wombat sprite sheet.
- Angry Pigeon sprite sheet.
- Simple arena background.
- Shadow rendered separately under characters.
- Basic UI theme.

Acceptance:

- Game reads as cartoon animal brawler.
- Animations do not jitter.
- Characters remain readable on mobile.

## Phase 8 - Content Expansion Gate

Only begin after all previous phases are stable.

Potential additions:

- Second enemy type.
- Special move.
- Simple boss.
- Character intro screen.
- Level select.
- Progression.

Do not start this phase until the combat core is fun.
