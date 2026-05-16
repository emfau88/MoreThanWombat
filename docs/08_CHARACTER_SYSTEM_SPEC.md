# 08 — Character System Specification

## Fighter Data

Characters should be defined through data plus behavior.

Recommended shape:

```ts
export type FighterDefinition = {
  id: string;
  label: string;
  maxHp: number;
  moveSpeed: number;
  width: number;
  height: number;
  hurtbox: BoxDefinition;
  pushbox: BoxDefinition;
  attacks: {
    basic: string;
    special?: string;
  };
};
```

## Initial Player Character

### Wombat

Role:

- Short, heavy bruiser.
- Simple and satisfying.
- Not fast, but impactful.

Suggested stats:

```txt
maxHp: 100
moveSpeed: 150
body: short/wide
basic attack: Wombat Jab
special attack: Belly Slam
```

Personality:

- Stubborn.
- Overconfident.
- Physically absurd.

## Initial Enemy

### Angry Pigeon

Role:

- Weak but annoying enemy.
- Approaches, pecks, retreats slightly.

Suggested stats:

```txt
maxHp: 28
moveSpeed: 120
attack: Pigeon Peck
```

Personality:

- Aggressive over nothing.
- Tiny but convinced it is dangerous.

## Fighter States

Minimum states:

```txt
idle
walk
attack
special
hitstun
knockdown
getup
dead
```

## State Transition Rules

### idle

Can transition to:

- walk
- attack
- special
- hitstun
- dead

### walk

Can transition to:

- idle
- attack
- special
- hitstun
- dead

### attack/special

Can transition to:

- idle after recovery
- hitstun if interrupted, if interruption is allowed
- dead if HP reaches zero

### hitstun

Can transition to:

- idle after timer
- knockdown for heavy hits, optional
- dead

### dead

Terminal for MVP.

## Facing

Facing is only left or right for MVP.

Characters attack in their facing direction.

Auto-facing can be used on mobile:

- If attack pressed and enemy is nearby, face closest enemy before attack.
- Do not turn during active frames unless attack explicitly allows it.

## Animation Requirements

For placeholder phase:

- Use simple colored rectangles or temporary sprites.
- State changes must still exist even if visuals are primitive.

For first real sprite phase:

Minimum per character:

```txt
idle: 2 frames
walk: 4 frames
basic attack: 3 frames
hit: 1 frame
death/knockdown: 1-2 frames
special: 3 frames
```

## Foot Anchor Rule

Every animation frame must maintain a stable foot/base anchor.

If the base point jumps frame-to-frame, the character will jitter and look unusable.
