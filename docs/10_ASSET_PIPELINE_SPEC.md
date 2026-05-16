# 10 — Asset Pipeline Specification

## Initial Rule

Use placeholders first.

Do not block combat implementation on final art.

## Visual Direction

Style target:

- Cartoon pixel brawler.
- Thick outline.
- Expressive animal characters.
- Readable at phone size.
- Simple color palette.
- Humorous but not visually noisy.

## Sprite Requirements

For first production-style sprites:

```txt
frame size: 128x128 recommended
background: transparent
orientation: side/three-quarter brawler view
base/feet anchor: stable across all frames
shadow: not baked into sprite
outline: consistent
```

## Do Not Bake Shadows Into Sprites

Character shadows should be rendered separately in code.

Reason:

- Better depth readability.
- Easier animation consistency.
- Avoids shadows jittering with animation frames.

## Minimum Animation Set

Per fighter:

```txt
idle: 2 frames
walk: 4 frames
basic attack: 3 frames
special: 3 frames
hit: 1 frame
knockdown/death: 1-2 frames
```

Do not generate 20-frame animations early. More frames increase jitter risk.

## Sprite Sheet Layout Example

```txt
row 0: idle frames
row 1: walk frames
row 2: basic attack frames
row 3: special frames
row 4: hit/death frames
```

Each frame should have identical dimensions.

## Naming Convention

```txt
assets/characters/wombat/wombat_spritesheet.png
assets/characters/wombat/wombat.json
assets/characters/pigeon/pigeon_spritesheet.png
assets/characters/pigeon/pigeon.json
assets/arenas/park/park_background.png
```

## Animation Timing

Initial suggested frame rates:

```txt
idle: 3-5 fps
walk: 8-10 fps
attack: timing-driven by combat data, not only animation fps
hit: instant/short
special: timing-driven
```

Combat timing must not depend only on animation playback finishing.

## Asset Acceptance Criteria

An asset is usable only if:

- Frame size is consistent.
- Foot/base anchor does not jitter.
- Character silhouette is readable at small scale.
- Background is transparent.
- Attack direction is clear.
- Sprite does not include inconsistent lighting or camera angle changes.

## AI Asset Warning

AI-generated sprite sheets often fail because:

- Each frame changes perspective.
- Limbs morph.
- Feet shift position.
- Body size changes.
- Attack frames do not align.
- Shadows are baked inconsistently.

Keep early animation extremely simple.
