# 18 - Next Steps

**Current order — 2026-09-11:** G0 is complete and G1–G7 are implemented and technically verified. In the pre-G8 Battle-UI correction, UI-R0–R4 are complete. Next execute R5 (transition/integration and physical-device acceptance). G8 then measures full runs and tunes HP, MP, damage, duration and pressure. Use the [UI-R4 report](qa/ui-r4-2026-09-11/README.md), [layout contract](32_BATTLE_UI_R0_LAYOUT_CONTRACT.md) and [G7 report](qa/g7-runtime-2026-09-09/README.md).

The blocks below are historical recommendations. Camera, feel and device checks remain relevant, but their old order and content restrictions do not supersede the scoped G1–G11 work.

## Block 1 - Wave Mode Polish

Goal:
Make the first staged Wave mode feel solid before adding more content again.

Reason:

- The wave-stage architecture is now in place
- It needs feel validation before expansion
- This is the highest-risk recent change set

Current direction:

- Verify camera follow comfort
- Tune section pacing and multi-enemy spacing
- Keep Duel/Test unchanged while improving Waves only

## Block 2 - Combat Feel Verification

Goal:
Re-check the recent combat-feel pass under real play conditions.

Focus:

- Verify jump and air-bonk coverage across the roster
- Check that current movement and range changes still feel good
- Continue tuning mobile HUD readability and control feel

## Block 3 - UI And Device QA

Goal:
Verify that the improved menu and character select are truly done.

Focus:

- Main menu readability
- Character select readability
- Touch comfort on real devices

## Block 4 - New Content Only After Stability

Goal:
Add narrow new content only after Waves, combat feel, and UI verification are stable.

Guardrails:

- No teleport as a first pass unless clearly justified
- No major AI rewrite
- No complex combo system expansion
- No broad roster/content burst before the current prototype feels stable
