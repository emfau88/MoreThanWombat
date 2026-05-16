# 12 — Acceptance Criteria

## Global Acceptance Criteria

Every implementation step must satisfy:

- Game still starts.
- No TypeScript build errors.
- No obvious runtime console errors.
- Previous completed behavior still works.
- Changed files are summarized.
- Manual test checklist is provided.

## Phase 0 Acceptance

- Project installs.
- Dev server runs.
- Build completes.
- Phaser canvas visible.
- Scaling works in desktop and mobile viewport.

## Phase 1 Acceptance

- Player appears in arena.
- Player can move with keyboard.
- Player can move with mobile joystick.
- Movement stops when input stops.
- Player cannot leave arena bounds.
- Depth sorting changes with `y` position.

## Phase 2 Acceptance

- Attack button/key starts attack.
- Attack has startup, active, recovery.
- Hitbox appears only during active phase in debug mode.
- Enemy hurtbox can be hit.
- Enemy HP decreases.
- Enemy receives knockback.
- Same attack does not hit same enemy repeatedly by accident.

## Phase 3 Acceptance

- Enemy approaches player.
- Enemy attacks when close enough.
- Enemy attack can damage player.
- Enemy respects attack recovery.
- Enemy does not jitter wildly around the player.

## Phase 4 Acceptance

- Touch controls usable on mobile.
- Buttons are large enough.
- Inputs do not stick.
- Attack/special do not bypass state rules.
- Auto-facing helps mobile attack direction without causing chaos.

## Phase 5 Acceptance

- Successful hits produce hitstop.
- Successful hits produce visible feedback.
- Feedback does not obscure the combat.
- Performance remains smooth.

## Phase 6 Acceptance

- Three waves spawn.
- Player can win after defeating all enemies.
- Player can lose when HP reaches zero.
- Restart works.
- No soft lock after win/loss.

## MVP Done Acceptance

The MVP is done only if:

- A player can complete one short arena battle on phone.
- Combat has at least one satisfying hit interaction.
- Enemy can threaten the player.
- Code remains modular.
- Debug hitboxes can be shown.
- Build is stable.
