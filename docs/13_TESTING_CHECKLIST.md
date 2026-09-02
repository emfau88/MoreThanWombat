# 13 — Testing Checklist

## Before Every Commit / Agent Step

Run:

```bash
npm run build
npm run typecheck
npm test
```

There is currently no `lint` script. State that explicitly if lint coverage is relevant.

## Combat Gym Regression

- Main Menu -> Combat Gym -> Start Battle.
- Cycle player, move, dummy, range, lane, MP, and dummy mode.
- For Discount Wizard, verify Wand Smack, Fireball, Miscast, Clearance Orb, and Air Bonk are individually selectable.
- Verify every changed preset restarts into `BattleScene`, not the main menu.
- Pause, fire a move, and advance with single-frame steps.
- Verify startup, active, recovery, animation frame, and hitstop telemetry.
- Toggle boxes and verify hurtbox, pushbox, and active hitbox are distinguishable.
- Verify a guarding dummy takes no damage.
- Verify an invulnerable dummy takes no damage.
- Verify an idle dummy takes damage exactly once per attack instance.
- Test the `MENU` touch target in a landscape mobile viewport; it must win over joystick capture.

## Character Asset Regression

- Run `npm.cmd run assets:refresh` after any Body-sheet, raw Wizard-row, or character manifest change.
- Confirm 5/5 sheets pass and the whole-sheet gate reports no unexpected empty or edge-clipped frames.
- Review enlarged Idle/Walk loops both original and mirrored in `docs/qa/character-loop-previews/`.
- Review changed attacks in the Combat Gym at 0.25× with boxes off and on.
- Confirm Body and contact/cast VFX remain separate layers.

## Desktop Manual Test

- Open dev server.
- Verify canvas loads.
- Move player up/down/left/right.
- Verify player stops when keys are released.
- Press attack.
- Verify attack state starts and ends.
- Verify enemy can be hit.
- Verify HP changes.
- Toggle debug mode.
- Verify boxes align with characters.

## Mobile Manual Test

- Open on actual phone or mobile emulator.
- Verify game scales correctly.
- Use joystick.
- Release joystick and verify movement stops.
- Tap attack.
- Tap special.
- Verify buttons do not overlap too much of combat area.
- Verify no stuck inputs after touch end.

## Combat Regression Test

- Attack from left side.
- Attack from right side.
- Attack while enemy is above player.
- Attack while enemy is below player.
- Verify hit only lands when hitbox overlaps hurtbox.
- Verify enemy does not take repeated accidental damage from one swing.
- Verify dead enemy no longer attacks.

## Enemy AI Test

- Stand still and let enemy approach.
- Move away and verify enemy follows.
- Move vertically and verify enemy adjusts.
- Let enemy attack and verify player takes damage.
- Confirm enemy does not overlap forever.

## Performance Smoke Test

- Spawn several enemies later.
- Verify no severe frame drop.
- Verify debug rendering can be turned off.
- Verify no memory leak symptoms after restarting battle several times.

## Visual Readability Test

On phone screen:

- Can the player be distinguished immediately?
- Can enemies be distinguished immediately?
- Are hit reactions visible?
- Are controls blocking important action?
- Is the arena too noisy?

If readability fails, reduce visual noise before adding effects.
