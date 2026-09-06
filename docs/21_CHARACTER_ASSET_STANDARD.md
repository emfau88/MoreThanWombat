# 21 - Character Asset Standard

This file defines the target animation and sheet standard for playable fighters in More Than Wombat.

The goal is not to copy another game directly.
The goal is to learn from stronger sprite pipelines and make our own roster more stable, readable, and consistent.

## Why This Exists

Current characters are functional, but not yet fully standardized.

Known gaps:

- some fighters still use fallback visuals for air attacks
- idle and anchor consistency needed manual fixes
- special and ultimate presentation can be stronger
- not every character has the same animation coverage depth

This standard is the reference for future asset creation and upgrades.

## Core Principles

- Every fighter uses one stable frame size per main sheet
- Every frame is aligned to a consistent ground anchor
- Feet and body mass should not drift left/right between idle frames unless intentional
- Main body animations and attack FX should be separated when that improves clarity
- Effects should read clearly on mobile and on smaller screens
- Character silhouette must stay readable at gameplay scale

## Required Baseline Animation Coverage

Every playable fighter should eventually have at least these states:

- `idle`
- `walk`
- `basic attack`
- `special attack`
- `jump`
- `fall`
- `air attack`
- `hit`
- `dead`

Recommended minimum frame targets:

- `idle`: 4
- `walk`: 4
- `basic attack`: 3-4
- `special attack`: 3-5
- `jump`: 2
- `fall`: 1-2
- `air attack`: 3
- `hit`: 1-2
- `dead`: 2

## Recommended Extended Coverage

These are not required for every character immediately, but they are strong upgrade targets:

- `run` or faster movement variant
- `landing`
- `recover from knockdown`
- `cast charge`
- `cast release`
- `ultimate startup`
- `ultimate release`
- `ultimate recovery`

## Sheet Structure Guidance

Preferred approach:

- one main character sheet for body animations
- separate FX sheets for:
  - projectiles
  - impact bursts
  - shockwaves
  - charge glows
  - ultimate effects

This keeps:

- body animation reusable
- effects easier to tune
- large spectacular moves easier to stage without bloating every character sheet

## Anchor and Layout Rules

All frames in a main sheet should follow these rules:

- same frame dimensions across the whole sheet
- same baseline / foot contact line
- body centered consistently unless the move intentionally lunges
- enough padding to avoid clipping during export or scale normalization
- head, torso, and weapon positions can move, but contact with the ground should stay coherent

If a move intentionally shifts the body:

- the shift should be readable as motion
- the gameplay pivot still needs to feel stable
- any correction offsets should be data-driven and minimal, not used to hide sloppy packing

## Readability Rules

At gameplay scale:

- hands, head, and attack direction must read quickly
- special attacks need a tell before release
- air attacks must read differently from ground attacks
- ultimate attacks must look clearly larger than specials

Good visual hierarchy:

1. pose / anticipation
2. release frame
3. effect frame
4. fade / recovery

## Ultimate Asset Standard

Every ultimate should aim for:

- one clear anticipation pose
- one strong release moment
- one readable large effect
- one fade / recovery visual

Recommended split:

- character body stays in main fighter sheet or uses existing strong pose
- spectacular part lives in separate FX sheet

This is the preferred pattern for our project because it is cheaper and safer than creating giant all-in-one sheets.

## Mobile-First Constraints

Assets should be judged at real gameplay size, not only full-image preview size.

Requirements:

- silhouettes readable on phone viewport
- effects not too thin or too low-contrast
- floor contact easy to read
- no noisy micro-detail in the playable area

## Current Asset-Pipeline Status

**Current-state note — 2026-09-05:** This section records asset-pipeline coverage, not the shippable gameplay roster. The current roster and acceptance status are authoritative in `31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md` and `qa/gameplay-baseline-2026-09-05/README.md`: Wombat, Discount Wizard, Budget Barbarian, and Mara Breach are normal players; Buster Bulldog and Reference Fighter are Combat-Gym diagnostics; Angry Pigeon and Wizard are normal Duel enemies. Full current run and real-device acceptance remains open.

As of 2026-09-05, the six QA-covered Body sheets use the deterministic pipeline documented in `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md`.

- Wombat, Discount Wizard v2, Budget Barbarian, Mara Breach, Buster Bulldog, and Angry Pigeon use normalized Runtime sheets.
- All six pass hard Idle/Walk gates plus a whole-sheet gate for baseline, inferred root stability, empty cells, and frame-edge clipping.
- Runtime offset patches for Wombat, Wizard, and Pigeon Idle have been removed.
- Barbarian has dedicated jump/fall/landing/Air Bonk frames in its 160px main sheet; its old 1.7x frame-scale pop is removed.
- Wizard still uses a fallback body animation for Air Bonk and needs a dedicated mini-sheet.
- Discount Wizard v2 is derived from the retained master and five raw source rows under `public/assets/characters/discount-wizard/source/`; it must be rebuilt with `npm.cmd run assets:wizard`, never hand-edited in the composed or normalized sheet.
- Palette and pose-height warnings remain visible in `docs/qa/character-assets-latest.md`; their current visual decisions are recorded in `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md`.

Current normal player roster:

- `Wombat`
- `Discount Wizard`
- `Budget Barbarian`
- `Mara Breach`

Combat-Gym diagnostic:

- `Buster Bulldog`

Current character coverage status:

- `Wombat`: strong reference fighter, has dedicated air attack coverage
- `Discount Wizard`: functional air attack via fallback, should receive dedicated air attack frames later
- `Budget Barbarian`: dedicated jump, fall, landing, and air-attack coverage in the 160px main sheet
- `Mara Breach`: dedicated jump, fall, landing, and air-kick coverage in the 160px main sheet
- `Buster Bulldog`: diagnostic-only; has dedicated air attack coverage

Enemy-only currently:

- `Angry Pigeon`

If promoted to full playable fighter later:

- should receive the same baseline coverage as the main roster

## Recommended Next Asset Upgrades

Priority order:

1. `Discount Wizard` dedicated air attack mini-sheet
2. `Budget Barbarian` dedicated air attack mini-sheet
3. `Wombat` dedicated ultimate pose/body support if needed
4. future fighters created directly against this standard

## Review Checklist For New Character Sheets

Before integrating a new sheet:

- frame size consistent
- baseline consistent
- idle does not jitter
- walk loops cleanly
- attack direction is obvious
- hit and dead frames read instantly
- jump and air attack do not look like reused ground frames unless intentionally stylized
- special and ultimate are visually distinct
- mobile readability checked at gameplay scale

## Practical Rule For This Project

Do not chase maximum frame count.

Prefer:

- fewer clean frames
- stronger posing
- clear anchor consistency
- separate readable FX

over:

- many inconsistent frames
- drifting feet
- bloated sheets with weak gameplay readability
