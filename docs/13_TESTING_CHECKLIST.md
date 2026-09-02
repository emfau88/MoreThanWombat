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
- Frame-step authored moves across exact Early/Main/Late boundaries and verify the telemetry/profile geometry changes together.
- Verify airborne fighters use the airborne hurtbox and no grounded pushbox.
- Verify the contact marker appears at the actual hitbox/hurtbox overlap, not at the generic defender center.
- Verify a guarding dummy takes no damage.
- Verify an armored dummy takes damage without hitstun, knockback, or attack interruption.
- Verify an invulnerable dummy takes no damage.
- Verify Light, Heavy, Block, Armor, Invulnerable, and Magic report different impact profiles.
- Verify a Whiff leaves impact telemetry at `none` and produces no contact spark/SFX.
- Cycle Combat Gym shake through Full/Reduced/Off; contact and move-cue shake must obey it while sparks remain readable.
- Cycle Combat Gym VFX through Ref/Comic A/Comic B with button or `V`; Physical, Magic, and Ground previews must use the selected family.
- With Comic A/B active, verify physical and magic contacts still appear only on confirmed overlap and stay frozen during Pause/Frame Step.
- During hitstop, press a buffered action and verify its 150-ms lifetime does not age until combat resumes.
- Verify an idle dummy takes damage exactly once per attack instance.
- Test the `MENU` touch target in a landscape mobile viewport; it must win over joystick capture.

## Character Asset Regression

- Run `npm.cmd run assets:refresh` after any Body-sheet, raw Wizard-row, or character manifest change.
- Confirm 5/5 sheets pass and the whole-sheet gate reports no unexpected empty or edge-clipped frames.
- Review enlarged Idle/Walk loops both original and mirrored in `docs/qa/character-loop-previews/`.
- Review changed attacks in the Combat Gym at 0.25× with boxes off and on.
- Confirm Body and contact/cast VFX remain separate layers.

## VFX Asset Regression

- Run `npm.cmd run vfx:refresh` after any style-lock Source, Runtime target, or `config/vfx-style-lock.json` change.
- Confirm all expected assets pass alpha, corner, border, canvas, and nonempty checks in `docs/qa/vfx-style-lock-latest.md`.
- Review Comic A/B on Park, Scrapyard, and Rooftop; no rectangle, chroma fringe, painted terrain, or fixed ground plate may be visible.
- Review at 1×, 0.5×, and 0.25× with Pause/Frame Step; Light effects must not hide the defender reaction.
- Keep Character Body, Contact FX, Ground FX, Weapon FX, and arena art in separate Runtime layers.

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
- Verify same-faction fighters/projectiles do not deal friendly-fire damage.
- In Waves, verify enemies separate via pushboxes instead of stacking indefinitely.
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
