# More Than Wombat - Handoff For New Chat

Last updated: 2026-09-05

## Current handoff — G1 implemented; manual acceptance before G2

Read [plan 31](31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md) first and the [G0 baseline with logs](qa/gameplay-baseline-2026-09-05/README.md) second. The current task is gameplay and Wave completion. The historical VFX-first recommendations and knockdown exclusion below do not override this plan.

- Four normal players: Wombat, Discount Wizard, Budget Barbarian and Mara Breach. Normal Duel enemies: Pigeon and Wizard. Buster Bulldog and Reference Fighter are Gym-only prototypes, not normal Character Select options.
- Local checks on codebase `d676906`: Typecheck, **55/55 tests**, production build, **6/6** character sheets and VFX QA **6/6 + 5/5 + 4/4** pass. Character QA includes a prototype and is not a roster count or visual acceptance.
- Junkyard Run has three zones and three groups (five enemies total), now with a tested Director, lifecycle-safe pressure budgets, safe visible entry and phase-aware mana. No mana regeneration during safe travel, transition or results.
- Current checks: 66/66 tests, Typecheck, build and 235 scripted Phaser assertions at each of three viewport sizes. See the [G1 report](qa/g1-runtime-2026-09-05/README.md); the 55-test line above is the historical G0 baseline.
- Mobile follow-up: corrected FIT resizing, full landscape width, canvas sharpening and four action buttons enlarged by 10% with matching separate touch circles. Rotation and actual touch events pass browser emulation; [mobile evidence](qa/mobile-2026-09-05/README.md). Physical-device acceptance remains open.
- Next: manual G1 pressure/readability acceptance, then G2 roles and G3 seven encounters; no new player fighter or arena during G0–G9.
- Full interactive runs, balance, current Pages verification and two real-device classes remain open. Use the [run template](qa/gameplay-run-template.md); do not mark manual gates passed from unit tests.

Everything below is retained as dated implementation history and system context. Older counts, roster descriptions and “next” lists are superseded by this update.

## Historischer Handoff-Snapshot — 2026-09-02

BULK 0 and the architecture safety pass BULK 0.5 from `23_ARCADE_QUALITY_COMBAT_VFX_PLAN.md` are complete.

- Test mode is now a full Combat Gym with fighter/move/dummy/range/lane/mana presets.
- Pause, frame step, slow motion, box overlays, telemetry, guard, armor, invulnerability, and attack-loop dummy modes exist.
- Move timeline, input buffering, contact resolution, hit feedback, presentation FX, animation registration, and mobile hit testing were separated into focused modules.
- Melee, projectile, and Axe Rain contacts share hit/blocked/armored/invulnerable outcomes.
- At the time of this 2026-09-02 snapshot, `npm.cmd run typecheck`, `npm.cmd test`, and `npm.cmd run build` were required checks and 34 tests passed. The current G0 count is 55/55.
- The touch `MENU` control has priority over joystick capture and has been verified in a mobile landscape viewport.
- BULK 1 is complete: deterministic normalization, loop previews, whole-sheet gates, and visual review pass for all five production Body sheets.
- Discount Wizard v2 was rebuilt from a canonical master; all 20 cells pass, and Wand Smack plus Miscast were approved in the Combat Gym at 0.25×.
- Runtime Idle offsets and Barbarian scale-pop repairs were removed in favor of generated normalized sheets.
- Read `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md` and `docs/qa/character-assets-latest.md` before changing character art.
- BULK 2 is complete: timeline-bound Early/Main/Late hitboxes, state-based hurtbox/pushbox profiles, explicit lane/height limits, factions, real overlap contacts, pairwise crowd pushboxes, and profile telemetry are integrated.
- Wombat Jab/Belly Slam are the authored reference profiles; Air Bonk/Axe Rain are explicit, and unchanged moves safely use their previous box as a `main` fallback.
- Read `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md` before changing collision or contact geometry.
- BULK 3 is complete: one `CombatImpact` event now drives strength/outcome-specific hitstop, 34–64 ms flash, shake, contact spark, SFX, optional haptics, and telemetry.
- Input buffers no longer age during hitstop; long Hitstun/Air-Attack body tints are removed.
- Shake is Full/Reduced/Off in Combat Gym and gates both contact and move-cue camera motion.
- Read `26_BULK_3_HIT_CONFIRM_IMPLEMENTATION.md` before changing impact timing or presentation.
- BULK 4.0 and 4.1 are complete. The approved Comic B Light/Small and Comic A Medium/Heavy language now has two deterministic VFX manifests, transparent Source/Runtime assets, recipe selection by Outcome × Strength, and pooled image layers.
- Combat Gym cycles universal recipes with `V` and Full/Reduced/Minimal quality with `Q`; Block, Armor and Invulnerable were visually checked at the actual contact point.
- Preserve the completed `CombatImpact` event and never bake arena or terrain backgrounds into Runtime VFX.

## Purpose

This file is the compact handoff for a new chat or a new developer taking over the project.

Use it first, then open the referenced docs only when needed. The project has moved beyond the original MVP docs, so this handoff describes the current real state.

## Project Summary

More Than Wombat is a mobile-first Phaser/TypeScript/Vite 2D pseudo-depth arena brawler.

The current build is a playable prototype with:

- Main menu
- Character select
- Arena select
- Duel mode
- Waves mode
- Combat Gym with deterministic fighter/move/dummy/range/lane/mana presets
- Mobile touch controls
- Desktop debug controls
- Multiple playable fighters
- Mana and ultimate attacks
- GitHub Pages deployment setup

Core rule still applies: keep the combat foundation stable. Do not add broad feature creep such as shops, story systems, multiplayer, progression, or complex physics.

## Tech Stack

- Phaser
- TypeScript
- Vite
- HTML5
- Mobile-first
- No Three.js / Babylon.js
- No external gameplay libraries
- No complex physics simulation

Useful commands:

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd test
npm.cmd run vfx:refresh
npm.cmd run dev -- --host 127.0.0.1 --port 4173
git status --short
```

Local test URL:

```text
http://127.0.0.1:4173/MoreThanWombat/
```

GitHub Pages URL:

```text
https://emfau88.github.io/MoreThanWombat/
```

## Current Modes

### Duel

1v1 battle. Player selects own fighter, opponent, and arena.

### Waves

Short staged wave mode.

Current implementation:

- Uses `junkyard_run`
- Uses 3 horizontal sections
- Uses wave-only camera follow
- Uses section-specific combat bounds
- Supports multiple enemies inside a section

This is the first staged implementation, not the final polished version. See `19_WAVE_STAGE_SYSTEM_PLAN.md`.

### Combat Gym / Test

Deterministic solo practice and frame-analysis mode.

Important current behavior:

- Fighter, move, dummy, range, lane gap, mana, and dummy behavior are selectable.
- Dummy modes include idle, guard, invulnerable, and attack-loop.
- Pause, 60-Hz frame step, 1×/0.5×/0.25×, box overlays, reset, and telemetry are available.
- Telemetry includes attack phase, move time, animation frame, hitstop, hitbox profile, and hurtbox profile.
- Training dummy uses normal HP so damage impact is visible and regenerates after a short delay.
- Mobile has a small `MENU` button to leave battle/test.

## Current Fighters

### Wombat

Role: grounded bruiser.

Implemented:

- Basic attack
- Special
- Jump
- Air Bonk
- Ultimate: `Earthshaker Nap Slam`
- Ultimate FX sheet

Notes:

- Wombat ultimate was tuned to be more readable and better grounded.

### Discount Wizard

Role: ranged comedy caster.

Implemented:

- Basic wand attack
- Special fireball / miscast split
- Miscast allows movement so it is not too punishing
- Ultimate: `Clearance Orb`
- Ultimate behavior: teleports to the far side of the map, then fires a pink homing orb
- Ultimate FX sheet

Notes:

- Wizard enemy AI was adjusted to stay more at range so projectiles/miscasts are visible.
- Homing projectile support exists in `ProjectileSystem`.

### Budget Barbarian

Role: heavy melee.

Implemented:

- Basic axe swing
- Special: `Tiny Rage`
- Ultimate: `Warranty Void Axe Rain`
- Ultimate behavior: three red glowing axes fall in front of him and create small AoE strike zones
- Ultimate FX sheet

Important current special-case:

- Barbarian now uses `budget_barbarian_spritesheet_v2_160.png`, a rebuilt 160px transparent sheet generated from the high-resolution source art.
- The previous 128px runtime sheet is preserved as `budget_barbarian_spritesheet_128_reserve_before_v2.png` for rollback.
- Walk animation uses the alternating sequence `[4, 6, 5, 7]` from the rebuilt sheet.
- Jump, fall, landing, and Air Bonk now have dedicated frames in the rebuilt sheet instead of relying on generic fallback visuals.

If Barbarian still visually jitters, inspect the v2 sheet frame anchors before changing combat logic.

### Buster Bulldog

**Produktentscheidung 2026-09-03:** Nicht weiter optimieren und nicht ausliefern. Die vierbeinige Figur wird durch einen späteren, neu konzipierten zweibeinigen Fighter ersetzt. Bis dahin nur als technischer Prototyp behalten und aus Character Select sowie Wave-Rotation entfernen.

Role: heavy bruiser.

Implemented:

- Basic attack
- Special
- Ultimate: `Underbite Bulldozer`
- Ultimate behavior: short forward bulldoze burst with a large impact hitbox and dust/ring FX
- Jump
- Air Bonk animation

### Reference Fighter

Role: development-only animation reference.

Implemented:

- Uses selected coherent chunks from `public/assets/original/205103.png` converted into `public/assets/characters/reference-fighter/reference_fighter_selected_96.png`
- Source chunks are row 1 frames 1-4 for idle, row 3 frames 1-3 for walk/run, row 2 frames 1-4 for basic attack, the 4th row from the bottom frames 3-5 for the superpunch-style special, and the previous jump-kick frames as a dedicated Air Bonk block
- Previously available in Character Select for local animation/combat feel testing; it is now a Combat-Gym-only diagnostic.

Notes:

- This is not final project content. It exists to compare clean original-style sprite motion against the current combat system.
- Current visual test result: idle, walk, jump, and Air Bonk are acceptable as a diagnostic reference. Special is still weak and the fighter has no proper ultimate.
- Do not ship or build design direction around this asset unless licensing/provenance is resolved.

## Current Arenas

Implemented:

- Park Clash
- Scrapyard Scrap
- Rooftop Rumble

Arena data lives in:

```text
src/game/data/arenas.ts
```

Wave side-scrolling stage flow is now partially implemented. See:

```text
docs/19_WAVE_STAGE_SYSTEM_PLAN.md
```

## Important Code Paths

Core combat:

```text
src/game/combat/Fighter.ts
src/game/combat/BoxProfiles.ts
src/game/combat/CombatFaction.ts
src/game/combat/CombatResolver.ts
src/game/combat/CombatImpactOrchestrator.ts
src/game/combat/CombatFeedbackController.ts
src/game/combat/CombatPresentationController.ts
src/game/combat/HitFeedback.ts
src/game/combat/HitboxSystem.ts
src/game/combat/ProjectileSystem.ts
src/game/combat/PushboxSystem.ts
```

Battle orchestration:

```text
src/game/scenes/BattleScene.ts
```

Data:

```text
src/game/data/fighters.ts
src/game/data/attacks.ts
src/game/data/projectiles.ts
src/game/data/arenas.ts
src/game/data/stages.ts
```

Input:

```text
src/game/core/InputController.ts
src/game/core/MobileControls.ts
```

UI:

```text
src/game/ui/Hud.ts
```

Loading:

```text
src/game/scenes/PreloadScene.ts
```

## Input Controls

Desktop:

- Move: WASD / arrows
- Basic: J / Space
- Special: K / Shift
- Ultimate: U
- Jump: L
- Debug: H
- Restart: R
- Menu: M

Mobile:

- Left joystick
- ATK
- SP
- ULT
- JMP
- MENU

Touch joystick is intentionally full-speed after deadzone, not analog speed.

## Asset Rules

Read:

```text
docs/21_CHARACTER_ASSET_STANDARD.md
```

Important practical lesson:

- Do not trust generated spritesheets blindly.
- Verify alpha bounds and frame anchors.
- For character animation, stable foot/bottom anchor is more important than raw frame count.
- If a sheet jitters, prefer normalizing frames or using stable frame subsets before adding more runtime hacks.

Generated chroma-key intermediate files should not be committed.

Current ignore rule:

```text
public/assets/fx/**/*_chroma.png
```

## Current Known Risks

### Sprite Normalization

All five productive Body sheets currently pass deterministic whole-sheet, root, baseline, palette, and clipping gates. Future or edited sheets can regress and must use the same pipeline.

Recommended process:

1. Run `npm.cmd run assets:refresh`.
2. Review enlarged mirrored/non-mirrored loops.
3. Preview changed attacks at 0.25× in the Combat Gym.
4. Fix the source/master or deterministic pipeline instead of adding runtime offsets.

### Ultimate System

Ultimates are currently implemented case-by-case:

- Wombat: scene FX + large attack hitbox
- Wizard: teleport + homing projectile
- Barbarian: scripted axe strike zones

This is acceptable for now. Do not prematurely create a large generic ultimate framework unless duplication becomes painful.

### Mobile UI

Mobile controls are usable, but still need real-device QA.

Check:

- Portrait and landscape
- Fullscreen button behavior
- MENU button accessibility
- Touch controls not overlapping important UI

### Character Select

The character select received a compact readability pass during the historical Reference Fighter experiment:

- wider player/opponent cards
- larger touch arrow buttons
- shorter descriptions
- clearer `PLAYER` / `OPPONENT` / mode labels
- slightly smaller preview sprites so text and action buttons have more room

Still needs one real mobile/desktop visual QA pass before treating this as final.

### Wave Mode

Wave mode recently changed the most and is now the main regression risk:

- now uses staged sections
- now uses wave-only camera follow
- now uses real section bounds
- now supports multi-enemy sections

This is a meaningful upgrade, but it still needs a dedicated polish pass for:

- camera comfort
- section pacing
- spawn spacing
- mobile readability during wave play

### Bundle Size

Vite warns that the JS chunk is larger than 500 kB. This is not currently a blocker.

## Next Sensible Tasks

1. In BULK 4.2 separate Wombat Jab, Belly Slam, and Air Bonk body/contact-ground layers; replace Earthshaker's baked grass/soil plate with transparent reusable layers.
2. In BULK 4.3 migrate the remaining roster-signature VFX to the approved library grammar.
3. Measure density/performance and accessibility modes on target devices in BULK 4.4.
4. Verify SFX mix, haptics, mobile start-of-battle input, and combat readability on real devices.
5. Verify the new Wave camera, enemy separation, effect overdraw, and section pacing.
6. Re-check menu and character-select readability on real devices.
7. Expand content only after the visual combat slice passes these gates.

## Do Not Do Next

Avoid these until combat and assets are more stable:

- Full LF2-style air combat
- Juggling
- Knockdown/fall recovery system
- Multiplayer
- Shops/progression/meta systems
- Story mode
- Complex item system
- General-purpose teleport framework

## Current Git State At Handoff

The latest completed local milestones are BULK 1, BULK 2, and BULK 3. Use `git log -4 --oneline` for authoritative hashes instead of copying a potentially stale hash from this document.

Before starting new work, always run:

```powershell
git status --short
npm.cmd run build
```

## Recommended First Read For New Chat

1. `docs/22_HANDOFF_FOR_NEW_CHAT.md`
2. `docs/16_CURRENT_ROADMAP.md`
3. `docs/17_OPEN_TASKS.md`
4. `docs/19_WAVE_STAGE_SYSTEM_PLAN.md`
5. `docs/21_CHARACTER_ASSET_STANDARD.md`

Then inspect the relevant code path before editing.
