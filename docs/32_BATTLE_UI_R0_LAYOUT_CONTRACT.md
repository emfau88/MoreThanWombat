# Battle UI R0 layout contract

**Status:** R0 accepted; UI-R1 through UI-R4 implemented and technically verified  
**Date:** 2026-09-10  
**Scope:** touch-control and combat-HUD geometry only; no production art or gameplay tuning

## 1. Decision

The current pre-G8 UI pass is treated as a visual prototype, not an accepted final implementation. UI-R1 through UI-R5 must follow this contract instead of continuing to tune the existing monolithic HUD frames and tall action-button fan.

The target combines:

- a two-row right-thumb action cluster suited to a lane brawler;
- separate visual and touch geometry;
- a bounded floating joystick by default;
- modular portrait, resource-bar and frame layers;
- mode-specific HUD semantics for duel, normal waves, midboss and boss encounters.

## 2. Target viewports

Every R1-R5 acceptance pass must cover these logical browser viewports:

| Viewport | Purpose |
| --- | --- |
| 568 x 320 | smallest supported landscape class |
| 844 x 390 | common wide phone class |
| 932 x 430 | extra-wide phone and safe-area stress case |
| 960 x 540 | design-space and desktop reference |

Control placement is derived from the usable safe rectangle, not raw screen edges. The CSS safe-area insets must be translated into Phaser logical coordinates before layout is resolved.

## 3. Action hierarchy and geometry

Visual order, from the resting right thumb outward:

```text
SPECIAL   ULTIMATE   BLOCK
     JUMP       ATTACK
```

- Attack remains the largest and most prominent action.
- Jump is the second-largest visible action.
- Block is the closest secondary action to Attack because it is reaction-critical.
- Ultimate sits directly beside Block but does not occupy a separate upper row.
- Special occupies the outer-left position.
- The complete cluster should stay near 220 x 160 logical pixels and must not recreate the current tall tower.

Initial target dimensions for UI-R1:

| Action | Visible diameter | Minimum hit diameter |
| --- | ---: | ---: |
| Attack | 86 | 92 |
| Jump | 74 | 82 |
| Block | 68 | 82 |
| Ultimate | 64 | 82 |
| Special | 64 | 82 |

Minimum hit size is a runtime constraint. If the canvas-to-CSS scale would render a frequent target below 48 CSS pixels, the logical hit diameter grows while visible art remains unchanged. Overlapping hit areas resolve to the closest normalized button center; array order must not decide the action.

Unavailable actions retain their position and use a disabled visual state. They do not disappear during combat.

## 4. Joystick contract

- Default mode: bounded floating joystick.
- Activation region: lower-left movement region, excluding menu/HUD and safe-area exclusions.
- Initial touch becomes the stick origin, clamped so the entire active stick remains usable.
- Base and knob are top-down circles with no elliptical perspective.
- The visible knob occupies 72-78% of the inner well's diameter after transparent padding is removed.
- The base fades strongly while idle; it becomes fully legible on movement.
- Fixed mode remains an implementation-ready option for later device settings.

## 5. HUD construction contract

HUDs are modular. Production artwork may skin these modules but must not own their geometry.

Layer order:

1. chassis/background;
2. resource tracks;
3. clipped HP/MP fills;
4. frame/bevel overlay;
5. portrait bezel and portrait mask;
6. labels, values and state markers.

Each skin definition owns explicit pixel rectangles for `portrait`, `hp`, `mp`, `label` and optional `phaseMarkers`. Percentage-based guesses are not accepted. Bar tests must cover 0%, 1%, 50% and 100%, with no fill touching or crossing the inner bevel.

The player HUD target is 10-15% smaller than the current 270-pixel frame and substantially shorter. The starting greybox envelope is 238 x 72 logical pixels, including the portrait bezel. Text is not scaled below the legibility floor merely to fit this envelope.

Each fighter definition receives an explicit HUD portrait source and crop. A masked full-body gameplay frame is not a valid portrait.

## 6. HUD semantics by mode

| Mode | Persistent HUD | Enemy feedback |
| --- | --- | --- |
| Duel | player left; opponent right; both with portrait, HP and MP | no local duplicate bars |
| Normal wave | player left; compact wave/remaining count at top | recently damaged normal enemies receive a short-lived local HP bar |
| Midboss | player left; persistent midboss strip centered at top | adds only use local bars and never replace the midboss |
| Final boss | player left; persistent boss strip with phase markers | adds only use local bars and never replace the boss |
| Gym | player left; compact dummy/opponent module right | follows duel semantics |

Enemy MP is hidden unless a player-facing mechanic makes that resource strategically meaningful.

## 7. R0 acceptance gates

UI-R0 is accepted only when the greybox demonstrates that:

- the action cluster is visibly shorter and Ultimate is adjacent to Block;
- touch targets remain usable even though secondary artwork is smaller;
- the joystick is top-down and its activation region is clear;
- player bars sit inside explicit slots and behind the bevel;
- every persistent portrait socket contains a real portrait region;
- normal waves do not display an arbitrary enemy in a global portrait HUD;
- boss and adds cannot compete for the same HUD slot;
- safe areas do not intersect controls in any target viewport;
- the transition prop remains unchanged and transition lifecycle only clears stale HUD state.

## 8. Explicit non-goals

- No production ImageGen assets in R0.
- No gameplay, balance, camera or audio changes.
- No redesign of the current zone-transition prop.
- No complete drag-and-drop controls editor before real-device evidence requires it.

## 9. Execution status

- UI-R0 was accepted by the project owner with the instruction to continue.
- UI-R1 now implements the safe-area-aware layout, separate visual and hit geometry, nearest-center overlap resolution and a bounded floating joystick.
- Automated verification covers all four target viewport classes, simulated asymmetric safe areas, rotation, five edge touches, floating joystick movement, Dash Attack, release cleanup and menu priority.
- Production artwork is deliberately unchanged in R1. Joystick and final action-button art evaluation belong to UI-R2; HUD construction and portrait semantics belong to UI-R3/UI-R4.
- UI-R2 retains the accepted ImageGen action-button family. Its generated flat joystick pair passed geometry checks but was later rejected in the full game view because the dark concentric forms read as an empty hatch. Runtime therefore uses the clearer original pair at the R1 compact size while retaining bounded floating behavior. The experiment and current decision are recorded in the [UI-R2 report](qa/ui-r2-2026-09-10/README.md).
- UI-R3 replaces the cropped monolithic HUD bitmaps with one complete mirrorable chassis and code-owned pixel slots for portrait, HP, MP and label. Browser gates cover 0%, 1%, 50% and 100% fills at the smallest and common phone classes. Portrait sources and mode-specific encounter semantics remain UI-R4.
- UI-R4 adds seven dedicated transparent portraits. Normal waves use a compact remaining-enemy header and short-lived local damage bars, never an arbitrary persistent opponent. Duel retains the mirrored opponent HUD; Midboss and Boss use a centered priority chassis, with the Boss lower slot dedicated to phase state. The former centered `Full` browser control is now a compact top-right fullscreen icon.

[UI-R1 evidence](qa/ui-r1-2026-09-10/README.md)

[UI-R3 evidence](qa/ui-r3-2026-09-10/README.md)

[UI-R4 evidence](qa/ui-r4-2026-09-11/README.md)
