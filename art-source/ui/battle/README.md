# Battle control source assets

UI-R2 uses the built-in ImageGen workflow. The five existing action-button PNGs were retained after in-game review because they already satisfy the requested hand-painted raster quality and remain distinct at 64–86 logical pixels. Their layout and hierarchy were corrected in UI-R1. The generated flat joystick pair below is preserved as an alternate source experiment, but the runtime returned to `joystick_base.png` and `joystick_knob.png` after the full battle view showed stronger affordance and contrast in the original pair.

New source masters:

- `joystick_base_topdown_source.png`
- `joystick_knob_topdown_source.png`

Alternate exports are alpha-cropped square downscales under `public/assets/ui/battle/`:

- `joystick_base_topdown.png` — 384×384
- `joystick_knob_topdown.png` — 256×256

## Final prompt set

### Base

Use case `stylized-concept`; transparent mobile-game virtual joystick base. Match the existing hand-painted industrial battle buttons, with a perfectly circular concentric gunmetal ring, dark blue-black movement well, restrained cyan orientation ring, subtle direction ticks and light wear. Exact orthographic top-down view, symmetric true circle, no knob, text, scenery, square backing, perspective, ellipse, pedestal or bloom. Crisp at 112 pixels.

### Knob

Use case `stylized-concept`; transparent mobile-game joystick thumb pad. A separate minimal flat circular disk made almost entirely from dark navy matte rubber, with three shallow concentric tactile grooves, a razor-thin continuous gunmetal edge and restrained cyan hairline. Exact orthographic top-down view, symmetric true circle, no segmented plates, bolts, marker, icon, text, checkerboard, perspective, ellipse, dome or base plate. Crisp at 70 pixels.

## UI-R3 HUD chassis

UI-R3 replaces the cropped player/boss frame pair with one neutral, mirrorable chassis. The bitmap only supplies material and bevel treatment; `HudLayout.ts` owns the portrait socket and exact HP/MP geometry.

- Source master: `hud_chassis_neutral_source.png` (2163×727)
- Runtime export: `public/assets/ui/battle/hud_chassis_neutral.png` (792×240)
- Processing: non-destructive alpha-bounds crop, high-quality proportional fit and transparent padding; no generative post-edit

### Final HUD prompt

Use case `stylized-concept`; create one compact transparent combat-HUD chassis for a polished 2D mobile lane brawler. Use the prior HUD only as a worn industrial material reference and the top-down joystick as the gunmetal/cyan finish reference. Approximately 3.3:1 horizontal silhouette, exact orthographic front view: a fully enclosed circular portrait socket on the left, connected to one broad empty upper resource panel and one slimmer empty lower panel on the right. Dark navy and gunmetal, restrained cyan edge accents, small bolts and believable wear. Keep all outer edges and the complete circle inside the canvas. No portrait, character, text, numbers, icons, colored bar fills, background, checkerboard, perspective, cropped circle, glow bloom or loose parts. Actual transparent alpha outside the object; crisp and readable at roughly 238×72 logical pixels.

## UI-R4 portrait set

ImageGen produced one square, transparent head-and-upper-torso portrait per core fighter. Each prompt used the fighter's existing model sheet or runtime sprite as a strict identity reference, requested a three-quarter combat pose facing right, strong ink/cel-painted mobile-brawler rendering, about 82% canvas use, circular-crop-safe padding, true alpha, and explicitly excluded frames, scenery, text, weapons and full bodies. The Wombat and Angry Pigeon received a second edit pass that removed a baked checkerboard while preserving character pixels. Runtime exports are 256×256 PNGs and receive deterministic circular alpha through `scripts/mask-hud-portraits.mjs`.

- Source masters: `portraits/*_portrait_source.png`
- Runtime exports: `public/assets/ui/battle/portraits/*.png`
- Core set: Wombat, Angry Pigeon, Discount Wizard, Budget Barbarian, Mara Breach, Buster Bulldog and Reference Fighter
- Prototype reuse: Scrap Heavy/Acting Foreman/Overtime Supervisor use Buster; Scrap Flanker uses Reference Fighter, matching their current gameplay art.
