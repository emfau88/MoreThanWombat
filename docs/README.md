# More Than Wombat - Docs Index

This folder contains both the original foundation documents and the current project handoff for **More Than Wombat**, a mobile-first Phaser/TypeScript/Vite 2D pseudo-depth arena brawler.

## Read This First

The project has moved beyond the original combat sandbox MVP. Use the docs in this order for current work:

1. `22_HANDOFF_FOR_NEW_CHAT.md`
2. `16_CURRENT_ROADMAP.md`
3. `17_OPEN_TASKS.md`
4. `21_CHARACTER_ASSET_STANDARD.md`
5. Relevant implementation spec from `07` to `13` only when touching that system

## Current Truth

These files describe the current built prototype and near-term work:

- `16_CURRENT_ROADMAP.md` - actual execution roadmap based on what is already built
- `17_OPEN_TASKS.md` - practical current task list
- `18_NEXT_STEPS.md` - recommended short development block order
- `19_WAVE_STAGE_SYSTEM_PLAN.md` - wave-stage plan plus implementation status notes
- `20_MANA_ULTIMATE_IMPLEMENTATION_PLAN.md` - mana and ultimate rollout notes
- `21_CHARACTER_ASSET_STANDARD.md` - character animation and asset quality rules
- `22_HANDOFF_FOR_NEW_CHAT.md` - compact current handoff; read this first

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

Before implementing:

1. Check `22_HANDOFF_FOR_NEW_CHAT.md`.
2. Check `16_CURRENT_ROADMAP.md` and `17_OPEN_TASKS.md`.
3. Inspect the relevant code path.
4. Make the smallest isolated change that advances the current roadmap.
5. Run `npm.cmd run build` when code or assets change.
