# 16 - Current Roadmap

This file reflects the actual project state after the initial sandbox, roster, menu, combat-feel, and first wave-stage work.

The original roadmap in `05_ROADMAP.md` remains useful as the foundation plan.
This document is the current execution roadmap based on what is already built.

## 2026-09-02 Execution Update

- BULK 0 Combat Gym is complete.
- BULK 0.5 architecture safety work is complete: move timeline, contact resolution, input buffer, feedback, presentation FX, animation registration, mobile hit testing, and core tests are separated.
- BULK 1 is complete: deterministic normalization, whole-sheet QA, enlarged loop previews, and visual review are integrated.
- BULK 2 is complete: timeline-bound attack profiles, state-based hurtbox/pushbox profiles, explicit lane/height ranges, factions, real overlap contacts, pairwise crowd pushboxes, and Combat Gym profile telemetry are integrated.
- BULK 3 is complete: one contact event now drives strength/outcome-specific hitstop, short flash, shake, spark, SFX, optional haptics, and Combat Gym impact telemetry.
- BULK 4.0 and 4.1 are complete: the approved Punchy Comic Impact language now has transparent Source/Runtime assets, two deterministic manifests, outcome/strength recipes, pooled VFX layers, and Combat Gym recipe plus quality selection.
- Five Body sheets, ten Idle/Walk groups, and all expected production cells pass hard asset gates.
- Discount Wizard v2 was rebuilt from a canonical master and approved in Character Select and Combat Gym at 0.25×; body and spell VFX remain separate.
- Pigeon palette variation and Wombat/Barbarian pose-height warnings were reviewed and accepted as intentional animation changes.
- Wombat Jab and Belly Slam are the authored Early/Main/Late references; Air Bonk and Axe Rain use explicit data profiles, while unchanged moves retain a safe `main` fallback.
- Block, Armor, Invulnerable, physical hits, magic hits, and whiffs are explicitly distinct; buffered inputs no longer age during hitstop.
- BULK 4.2 and 4.3 are complete: Wombat body frames and ground effects are separated, Earthshaker is a transparent layered recipe, and all Wizard FX including projectiles use transparent pooled recipes.
- BULK 4.4 has a technical budget pass: Full/Reduced/Minimal cap active VFX layers at 80/48/24 and expose diagnostics in the Combat Gym; a weakest-target-device measurement remains manual QA.
- The remaining VFX acceptance block is a real weakest-target-device measurement for BULK 4.4; no productive effect may contain a baked arena or terrain background.
- New roster, stage, and meta content remains frozen until the polished combat slice proves these layers.

## Current State Summary

Implemented and usable today:

- Phaser + TypeScript + Vite project setup
- Boot, preload, main menu, character select, battle scene
- Duel mode
- Waves mode
- Combat Gym with fighter/move/dummy/range/lane/mana presets, pause, frame step, slow motion, boxes, VFX recipe/quality lab, and telemetry
- Arena select
- Arena background and mobile-friendly scaling
- Keyboard controls
- Touch joystick, attack, special, jump, ultimate, menu
- Wombat player character
- Angry Pigeon enemy
- Discount Wizard playable character
- Budget Barbarian playable character
- Buster Bulldog playable character
- Reference Fighter diagnostic character
- Basic attacks
- Specials
- Mana and ultimates
- Timeline-bound hitbox profiles, state-based hurtboxes/pushboxes, factions, contact markers, and debug rendering
- Damage, hitstun, knockback
- Profile-driven hitstop, 34–64 ms hit flash, accessible screen shake, contact sparks, impact SFX, and optional haptics
- Jump foundation with fake-z
- One minimal air attack (`air_bonk`)
- Projectile system for Discount Wizard
- Debug toggle in battle UI
- Character select presentation pass
- Main menu button presentation pass
- GitHub Pages deployment setup
- Deterministic character-sheet normalization and hard asset QA
- Deterministic VFX style-lock export and alpha/border QA
- Typecheck plus 33 automated combat/input/debug/box-profile/impact/VFX tests
- First staged Wave mode flow:
  - `junkyard_run`
  - 3 horizontal sections
  - section intro/clear flow
  - multi-enemy section support
  - section-specific combat bounds
  - wave-only camera follow and wider world rendering

## Phase A - Stabilization

Goal:
Make the current playable build reliable across desktop, mobile, and GitHub Pages.

Focus:

- Verify GitHub Pages build and asset loading end-to-end
- Verify start-of-battle input responsiveness on touch
- Verify fullscreen behavior on mobile browsers
- Verify current menu and character-select visuals on real devices
- Remove remaining awkward UI or control friction before adding more content

Exit criteria:

- GitHub Pages version matches local build visually
- No missing asset paths on hosted build
- Mobile controls respond immediately and predictably
- Menus and character select are readable and touch-friendly
- No known stuck-state or startup-input confusion

## Phase B - Combat Feel and Control Pass

Goal:
Improve movement readability and combat pacing without expanding the system too aggressively.

Focus:

- Evaluate smoother movement feel for player controls
- Keep current movement buffs readable on both desktop and touch
- Tune enemy pacing if they feel too aggressive or too close too quickly
- Preserve responsiveness while reducing chaotic contact pressure
- Keep touch controls simple and readable

Specific review items already identified:

- Investigate slightly smoother player control if it improves feel without adding lag
- Re-check jump height, air-bonk reliability, and melee spacing after the recent feel pass
- Consider making enemy approach behavior a little slower if combat currently feels too sticky
- Verify that movement feels good on both keyboard and touch, not only one input method

Exit criteria:

- Player movement feels responsive but less abrupt if smoothing is added
- Enemy pressure remains fair and readable
- No input stickiness introduced by control changes

## Phase C - Wave Mode Polish Pass

Goal:
Make the first staged Wave mode feel intentionally playable instead of merely technically working.

Focus:

- Verify `junkyard_run` section pacing
- Verify camera follow comfort on desktop and mobile
- Tune spawn spacing, section pressure, and transition timing
- Ensure section bounds do not feel artificially cramped
- Confirm Duel/Test remain stable after wave-specific changes

Specific observations already raised:

- Wave mode was recently upgraded from fixed-arena waves to staged section flow
- Camera and bounds now behave differently in Waves than in Duel/Test
- This needs a focused playtest pass before adding more content

Exit criteria:

- Wave mode feels like its own mode, not Duel with respawns
- Camera does not fight readability
- Section progression feels clear and stable
- No Wave-only regressions in battle flow

## Phase D - Enemy Pacing and Wizard Identity Pass

Goal:
Make the enemy roster and especially Discount Wizard read more clearly as distinct fighters.

Focus:

- Rebalance enemy approach pacing and spacing behavior
- Give Discount Wizard more opportunities to show projectile gameplay at range
- Make humor beats such as miscasts visible in real fights instead of disappearing into melee pressure
- Review AI decision timing, desired spacing, and attack range thresholds

Exit criteria:

- Wizard more often demonstrates ranged behavior
- Miscast moments are visible often enough to matter
- Enemy pressure remains fun, not passive

## Phase E - Content Presentation and Light Content Pass

Goal:
Make the current content feel presentable, then add only narrow, low-risk content.

Potential scope:

- Real-device UI review for menu and character select
- One more small wave-stage polish pass
- Additional arena/background only if readability stays high
- One narrow fighter/content addition only after wave/combat confidence improves

Guardrails:

- No multiplayer
- No meta progression
- No giant system rewrite
- No full LF2 air-combat expansion unless deliberately planned later
- No broad content burst before wave/combat stability is proven

## Phase F - Documentation and Production Hygiene

Goal:
Keep the project maintainable as the feature set grows.

Focus:

- Keep roadmap and backlog synchronized with reality
- Log balancing decisions that materially affect game feel
- Track deployment assumptions for GitHub Pages
- Track known control and mobile issues explicitly
- Keep the wave-stage docs synchronized with the real implementation state

Exit criteria:

- Documentation matches the shipped prototype closely enough for handoff or pause-and-return work
