# UI-R4 acceptance — portraits and encounter HUD semantics

**Status:** implemented and technically verified on 2026-09-11.

## Outcome

- Seven dedicated 256×256 transparent portrait assets replace gameplay-sprite frame crops.
- Every fighter definition explicitly selects its HUD portrait. Current role prototypes deliberately reuse the same identity as their gameplay art.
- Duel retains player-left/opponent-right HP and MP HUDs.
- Normal Waves never promote an arbitrary target to the persistent top HUD. The compact header communicates encounter index, remaining enemies and section name; a damaged enemy receives a 50×6 local world-space HP bar for 1.65 seconds.
- Acting Foreman and Overtime Supervisor use one stable centered priority chassis. The Midboss omits meaningless mana; the Boss uses the lower slot as a two-phase indicator.
- The unrelated browser `Full` pill was identified and replaced with a compact, accessible 44×44 fullscreen icon at the safe top-right edge.
- Portraits are pre-masked into circular alpha, avoiding Phaser geometry-mask/WebGL instability.

## Verification

- `npm.cmd test`: PASS — 112/112 tests.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run build`: PASS.
- Adaptive browser flow at 844×390, 390×844 and 932×430: PASS with no browser errors.
- G6 runtime regression: PASS — 51 checks.
- G7 runtime regression: PASS — 63 checks, including both Boss phase HUD states.
- Asset gate checks all seven runtime portraits for 256×256 dimensions, true alpha and adequate socket utilization.

## Evidence

- [Normal Wave HUD](refresh/wave-landscape.png)
- [Boss priority HUD with portrait and phase slot](g7-fixed/runtime-844x390.png)
- [Adaptive browser metrics](refresh/mobile-metrics.json)
- [G7 runtime log](g7-fixed/runtime-844x390.log)

## Remaining for UI-R5

- Physical-device acceptance on the weakest target phone, including thumb reach, portrait readability and safe-area behavior.
- Final transition-state cleanup review across all zone changes.
- Revisit the joystick artwork in the complete game view; its mechanics and touch geometry pass, but visual acceptance remains open.
