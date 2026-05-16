# 13 — Testing Checklist

## Before Every Commit / Agent Step

Run if available:

```bash
npm run build
npm run typecheck
npm run lint
```

If a script does not exist, state that it does not exist instead of pretending it was run.

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
