# 02 — Game Design Pillars

## Pillar 1 — Combat Must Feel Immediate

The game lives or dies by hit feel.

Every attack must have:

- Clear anticipation.
- Clear active impact window.
- Clear recovery.
- Visible hit reaction.
- Knockback.
- Brief hitstop.
- Sound hook later.

If attacks feel vague, no amount of content will save the game.

## Pillar 2 — Mobile Readability Comes First

Everything must be readable on a phone.

Rules:

- Large silhouettes.
- Strong outlines.
- Limited visual noise.
- Clear team/enemy color accents.
- Few but expressive animation frames.
- Big buttons.
- Forgiving input.

## Pillar 3 — Pseudo-Depth, Not Real 3D

The arena uses 2D coordinates:

- `x`: left/right.
- `y`: depth on floor plane.
- `z`: temporary vertical offset for jumps/knockups only.

Rendering order depends on `y`.

Characters lower on the screen appear in front of characters higher on the screen.

## Pillar 4 — Simple Systems, Strong Feedback

Prefer simple mechanics with strong feedback over complex mechanics with weak feedback.

Good:

- One satisfying punch.
- One reliable special.
- One enemy that behaves clearly.

Bad:

- Five attacks that all feel the same.
- Ten enemies with broken AI.
- Flashy particles hiding unreadable combat.

## Pillar 5 — Comedy Through Mechanics

The humor should come from readable slapstick combat.

Examples:

- Wombat belly slam.
- Pigeon panic flap.
- Raccoon trash-lid shield.
- Frog jump kick.
- Kangaroo office worker boxing stance.

Do not rely only on text jokes.

## Pillar 6 — Expand Only After the Core Works

Content expansion begins only after:

- Movement works.
- Combat works.
- Enemy behavior works.
- Touch controls work.
- Performance is stable.
- Code remains modular.
