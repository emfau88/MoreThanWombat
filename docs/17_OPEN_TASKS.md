# 17 - Open Tasks

This is the current practical task list based on the implemented build, not the original zero-state backlog.

## P0 - Current Arcade-Quality Work

### TASK-AQ-004 - Build BULK 4 Unified VFX Language

Goal:
Replace the restrained code-native contact-spark reference with a coherent, reusable, mobile-budgeted VFX library on the completed `CombatImpact` event.

Execution plan:
`27_BULK_4_UNIFIED_VFX_PRODUCTION_PLAN.md`. BULK 4.0 through 4.3 are implemented and documented; BULK 4.4 has the technical budget pass. The remaining VFX acceptance task is a measurement on the weakest intended target device.

Current BULK 4.0/4.1 result:

- six transparent ImageGen Source-Master and six deterministic Runtime exports exist,
- `npm.cmd run vfx:refresh` validates transparency, canvas, edge padding, and manifest targets,
- Combat Gym cycles universal recipes with `V` and VFX quality with `Q`,
- Park/1×, Scrapyard/0.25×, and Rooftop/0.5× visual checks pass,
- approved production split: Comic B for Light/Small, Comic A vocabulary for Medium/Heavy,
- `VfxRecipeRegistry` selects normal contact effects from outcome and strength; `UniversalVfxDirector` pools the active image layers.

Acceptance:

- Light, medium, heavy, magic, block, armor, and invulnerable effects share one art language
- Every runtime effect has real alpha transparency and contains no baked arena, grass, soil, asphalt, sky, or solid chroma background
- Normal hits never hide defender pose/reaction for more than a few frames
- Wombat Air Bonk body/ground effect separation and Earthshaker anticipation/impact/decay are reviewed
- Warning and impact geometry stay aligned for Axe Rain
- Object lifetime and overdraw remain safe for mobile crowd combat
- Existing 33 tests and Combat Gym outcome presets remain green

## Completed Arcade-Quality Milestones

### TASK-AQ-003 - Complete BULK 3 Hit Confirm And Impact Orchestration

Completed 2026-09-02:

- One `CombatImpact` path now owns short flash, spark, SFX, optional haptics, Hitstop, and camera shake.
- Light/Medium/Heavy/Ultimate plus Block/Armor/Invulnerable profiles are explicit and testable.
- Armor takes damage without hitstun or knockback; Whiffs never emit impact feedback.
- Wizard contacts use a distinct magic profile; Earthshaker's former 24-ms exception is retuned to 105 ms.
- Input buffers do not age during hitstop.
- Full/Reduced/Off shake modes apply to contact and move-cue camera shake.
- Eight CC0 Kenney impact sounds are integrated.
- Typecheck/build pass and 31/31 automated tests are green.

### TASK-AQ-002 - Implement BULK 2 Box Profiles

Completed 2026-09-02:

- Attack profiles support exact Early/Main/Late windows and multiple boxes.
- Wombat Jab and Belly Slam are authored references; Air Bonk and Axe Rain use explicit data profiles.
- All fighter definitions expose standing, moving, attacking, airborne, hit, and knockdown box states.
- Airborne/knockdown pushboxes no longer block the ground lane.
- Melee, projectiles, and Axe Rain use the actual overlap center and explicit lane/height limits.
- Player/enemy/neutral factions prevent friendly fire; Wave enemies resolve pushboxes pairwise.
- Combat Gym shows active hitbox/hurtbox profiles and the contact marker.
- Typecheck passes and 23/23 automated tests are green.

### TASK-AQ-001 - Close BULK 1 Art Review Warnings

Completed 2026-09-02:

- Discount Wizard v2 uses one approved costume identity across 20 valid body frames.
- Angry Pigeon palette variation was reviewed as a pose-dependent wing-area change.
- Wombat Walk height variation was accepted as intentional gait with stable root and baseline.
- Budget Barbarian height variation and `[4, 6, 5, 7]` sequence were accepted as intentional heavy movement.
- `npm.cmd run assets:refresh` passes 5/5 sheets and the whole-sheet gate.

## P0 - Immediate Verification

### TASK-CUR-001 - Verify GitHub Pages Live Build

Goal:
Confirm that the hosted Pages build loads the correct assets and behaves like local.

Acceptance:

- Main menu background loads correctly
- Character sprites load correctly
- Battle scene loads correctly
- No broken asset paths in hosted build

### TASK-CUR-002 - Verify Mobile Start-of-Battle Input

Goal:
Confirm that battle input works immediately after entering a match on touch devices.

Acceptance:

- Player can move immediately after battle start
- No delayed first input caused by menu touch carry-over
- Behavior is consistent across repeated battle starts

## P1 - Wave Mode Verification And Polish

### TASK-CUR-003 - Validate New Wave Camera Feel

Goal:
Make sure the new Wave-only camera follow improves the mode instead of making combat harder to read.

Acceptance:

- Camera follow feels stable
- Camera does not overreact during close combat
- Desktop and mobile remain readable
- Duel and Test still feel unchanged

### TASK-CUR-004 - Tune Wave Section Pacing

Goal:
Make `junkyard_run` feel intentional section-by-section.

Acceptance:

- Section 1 is not awkwardly empty or cramped
- Section 2 and 3 multi-enemy pressure stays fair
- Section intro and clear timing feel clean
- Bounds do not make specials or movement feel artificially broken

## P2 - Controls and Feel

### TASK-CUR-005 - Evaluate Smoother Player Control

Goal:
Test whether slightly smoother control improves the game feel without making the game sluggish.

Notes:

- This does not automatically mean inertia-heavy movement
- The game should stay responsive
- Any smoothing should be subtle

Acceptance:

- Movement still feels direct
- If smoothing is used, it improves readability rather than adding lag

### TASK-CUR-006 - Review Enemy Movement Speed

Goal:
Assess whether enemy fighters should move a little slower overall.

Reason:

- Current pressure may feel slightly too immediate in some matchups

Acceptance:

- Enemy pressure remains threatening
- Enemy movement no longer feels needlessly sticky or rushed
- Change is small, not a full rebalance overhaul

## P3 - Wizard Identity

### TASK-CUR-007 - Improve Discount Wizard Ranged Presence

Goal:
Make Discount Wizard actually read as a ranged-comedy fighter during normal matches.

Current issue:

- The wizard often collapses into melee too quickly
- Projectiles do not get enough room to matter
- Miscasts are technically present but can go unnoticed during play

Acceptance:

- Wizard uses projectile spacing more often
- Fireballs are visible enough to define the character
- Miscasts appear often enough to be noticed
- Wizard does not simply become another close-range fighter

### TASK-CUR-008 - Review Wizard AI or Spacing Logic

Goal:
Adjust behavior or spacing rules so the wizard can keep more distance when appropriate.

Acceptance:

- Wizard identity is clearer than generic melee AI
- Behavior remains simple and stable
- No major AI rewrite required

## P4 - UI Verification And Presentation Polish

### TASK-CUR-009 - Verify Character Select On Real Devices

Goal:
Confirm the current character select is actually finished enough on desktop and mobile.

Acceptance:

- Cards are readable
- Arrows are clean and touch-friendly
- Arena strip reads clearly
- No layout break on smaller screens

### TASK-CUR-010 - Verify Main Menu Presentation

Goal:
Confirm the new button-asset-based main menu holds up across screens.

Acceptance:

- Buttons remain readable on desktop and mobile
- Background title remains visible
- Menu spacing feels intentional

### TASK-CUR-011 - Audio Integration Pass

Goal:
Use the available sound assets to improve hit and movement feedback.

Acceptance:

- Core hit feedback has at least basic SFX
- Sounds do not overwhelm readability

## P5 - Documentation

### TASK-CUR-012 - Keep Current Roadmap Updated

Goal:
Avoid divergence between the codebase and the docs again.

Acceptance:

- Major implemented systems are reflected in roadmap/backlog docs
- Open issues are listed in one current place
