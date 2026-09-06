# More Than Wombat - Docs Index

This folder contains both the original foundation documents and the current project handoff for **More Than Wombat**, a mobile-first Phaser/TypeScript/Vite 2D pseudo-depth arena brawler.

## Read This First

The project has moved beyond the original combat sandbox MVP. Use the docs in this order for current work:

1. `31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md`
2. `22_HANDOFF_FOR_NEW_CHAT.md`
3. `23_ARCADE_QUALITY_COMBAT_VFX_PLAN.md`
4. `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md`
5. `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md`
6. `26_BULK_3_HIT_CONFIRM_IMPLEMENTATION.md`
7. `27_BULK_4_UNIFIED_VFX_PRODUCTION_PLAN.md`
8. `28_BULK_4_0_VFX_STYLE_LOCK.md`
9. `16_CURRENT_ROADMAP.md`
10. `17_OPEN_TASKS.md`
11. `21_CHARACTER_ASSET_STANDARD.md`
12. Relevant implementation spec from `07` to `13` only when touching that system

## Current Truth

These files describe the current built prototype and near-term work:

- `qa/gameplay-baseline-2026-09-05/README.md` - verified G0 snapshot: 55 tests, four normal player fighters, three current encounters, technical logs and explicitly open manual/release gates
- `qa/gameplay-run-template.md` - copy for every measured run, including defeats; common definitions for timing, damage, pressure and HP/MP checkpoints
- `31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md` - current priority order from a stable combat prototype to a complete seven-encounter Wave run; use this as the gameplay execution plan when older roadmaps conflict
- `16_CURRENT_ROADMAP.md` - actual execution roadmap based on what is already built
- `17_OPEN_TASKS.md` - practical current task list
- `18_NEXT_STEPS.md` - recommended short development block order
- `19_WAVE_STAGE_SYSTEM_PLAN.md` - wave-stage plan plus implementation status notes
- `20_MANA_ULTIMATE_IMPLEMENTATION_PLAN.md` - mana and ultimate rollout notes
- `21_CHARACTER_ASSET_STANDARD.md` - character animation and asset quality rules
- `22_HANDOFF_FOR_NEW_CHAT.md` - compact handoff with a current G0 update; older milestone details are historical
- `23_ARCADE_QUALITY_COMBAT_VFX_PLAN.md` - full prioritized audit and production plan for arcade quality, combat feel, hitboxes, character sheets, VFX, audio, mobile UX, and the vertical slice
- `24_BULK_1_CHARACTER_ASSET_IMPLEMENTATION.md` - completed deterministic sheet pipeline, Discount Wizard v2 rebuild, whole-sheet QA, visual decisions, and the required asset workflow
- `25_BULK_2_BOX_PROFILE_IMPLEMENTATION.md` - completed data-driven hitbox/hurtbox/pushbox profiles, faction rules, overlap contacts, authored Wombat reference moves, and Combat Gym QA
- `26_BULK_3_HIT_CONFIRM_IMPLEMENTATION.md` - completed centralized Hit Confirm, strength/outcome profiles, short flashes, contact sparks, impact SFX/haptics, Armor, shake accessibility, and frame-step QA
- `27_BULK_4_UNIFIED_VFX_PRODUCTION_PLAN.md` - detailed execution order for a transparent, reusable, comic-style VFX library; includes the current asset audit, Wombat background/layer fixes, style-lock gate, mobile budgets, and Definition of Done
- `28_BULK_4_0_VFX_STYLE_LOCK.md` - approved Punchy Comic Impact style board, visual/technical QA, production decision, and its 4.1 recipe-library integration

## Foundation Docs

These files remain valid as design intent, architecture guardrails, and scope protection. They are not a complete description of the current shipped prototype:

- `00_PROJECT_BRIEF.md`
- `01_TECH_STACK_DECISION.md`
- `02_GAME_DESIGN_PILLARS.md`
- `03_ARCHITECTURE_RULES.md`
- `04_AGENT_RULES.md`
- `05_ROADMAP.md`
- `06_MVP_SCOPE.md`
- `07_COMBAT_SYSTEM_SPEC.md`
- `08_CHARACTER_SYSTEM_SPEC.md`
- `09_MOBILE_INPUT_SPEC.md`
- `10_ASSET_PIPELINE_SPEC.md`
- `11_SCENE_STRUCTURE_SPEC.md`
- `12_ACCEPTANCE_CRITERIA.md`
- `13_TESTING_CHECKLIST.md`
- `14_TASK_BACKLOG.md`
- `15_DECISIONS.md`

## Non-Negotiable Guardrail

Combat feel, mobile readability, and stable architecture remain more important than adding content.

Do not use the old MVP documents as permission to remove existing systems such as character select, arenas, mana, ultimates, waves, or the current roster. Use them to protect the project from broad scope creep such as multiplayer, story, shops, meta progression, complex RPG systems, or large rewrites.

## Current Working Rule

G0 is complete as a documentation and technical baseline. G1 is implemented and technically verified; its manual gameplay acceptance remains open before G2. Use the [G1 report](qa/g1-runtime-2026-09-05/README.md) for current tests and the dated G0 snapshot for the historical baseline. Scripted browser diagnostics do not replace balance or real-device acceptance. Older numeric test counts describe their original milestones.

Before implementing:

1. Check `31_GAMEPLAY_AND_WAVE_COMPLETION_PLAN.md` for priority and bulk scope.
2. Check `22_HANDOFF_FOR_NEW_CHAT.md` for the compact project handoff.
3. Check `16_CURRENT_ROADMAP.md` and `17_OPEN_TASKS.md` for older open work that still applies.
4. Inspect the relevant code path.
5. Make the smallest isolated change that advances the current gameplay bulk.
6. Run `npm.cmd run build` when code or assets change.
7. Run `npm.cmd run assets:refresh` whenever a character Body sheet or its manifest changes.
8. Run `npm.cmd run vfx:refresh` whenever a BULK 4 style-lock Source, Runtime target, or manifest entry changes.
