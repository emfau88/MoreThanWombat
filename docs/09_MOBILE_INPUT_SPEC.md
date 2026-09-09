# 09 — Mobile Input Specification

## Input Priority

Mobile input is a primary requirement, not a later porting concern.

The game must be playable on phone from the MVP phase.

## Control Layout

Recommended landscape layout:

```txt
[left side] virtual joystick
[right side] attack buttons
```

Buttons:

- Attack.
- Special.
- Jump.
- Ultimate.
- Defend: neutral Guard, with a strong direction Evade.

## Virtual Joystick

Requirements:

- Fixed or floating stick acceptable.
- Left half of screen only.
- Deadzone required.
- Output normalized vector `x`, `y`.
- Must not stick after touch end.

Recommended values:

```txt
stick radius: 52-70 px depending on resolution
inner knob radius: 24-32 px
deadzone: 0.15
```

G5 movement contract:

- A direction at 82% or more for 220 ms starts Run; no extra touch button or double-tap is required.
- Run continues while the stick remains outside the 28% release threshold and supports direction changes.
- Attack during Run starts the current fighter's committed Dash Attack.
- Jump and Air Bonk retain 82% air steering, including repeated horizontal and lane corrections during one jump.

## Attack Buttons

Requirements:

- Large enough for thumb input.
- Do not overlap critical combat area.
- Visual pressed state.
- Should trigger once per tap unless held behavior is explicitly implemented.

Recommended:

```txt
Attack button: largest, closest to thumb rest
Special button: slightly above or left of attack button
```

## Desktop Debug Controls

Required for development:

```txt
WASD / Arrow keys: move
J / Space: attack
K / Shift: special
F: defend; hold a direction for Evade
F1 or H: toggle debug boxes
```

Holding a full movement direction for 220 ms starts Run on keyboard as well. Repeated `J`/`Space` taps use the same three-step Basic-Chain and one-input queue as the mobile Attack button.

## Input Abstraction

Do not let game logic read raw keyboard/touch directly everywhere.

Create an input abstraction:

```ts
export type PlayerInputState = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  specialPressed: boolean;
  ultimatePressed: boolean;
  jumpPressed: boolean;
  defendPressed: boolean;
  debugTogglePressed: boolean;
};
```

Game logic consumes `PlayerInputState`.

## Mobile Auto-Facing

Because touch controls are less precise, implement optional auto-facing:

When player presses attack:

1. Find nearest living enemy within reasonable range.
2. If found, face toward that enemy's `x` position.
3. Start attack.

Do not constantly auto-turn during walking unless explicitly designed.

## Input Safety Rules

- Clear one-frame button presses after consumption.
- Prevent attack spam from bypassing recovery.
- Do not allow special to cancel every state unless specifically defined.
- Ensure touch end events reset movement.

## Manual Mobile Test

- Open game in mobile browser.
- Move in all directions.
- Release joystick and verify player stops.
- Tap attack repeatedly and verify recovery still matters.
- Hold the joystick fully for Run, add a second ATK touch and verify Dash Attack starts without losing the movement touch.
- During Air Bonk, steer left/right and between lanes more than once; the jump arc must continue.
- Tap special and verify it does not break state machine.
- Rotate device if supported and verify layout does not collapse.
