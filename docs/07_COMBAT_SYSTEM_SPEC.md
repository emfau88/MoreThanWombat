# 07 — Combat System Specification

## Combat Model

The game uses 2D pseudo-depth beat 'em up combat.

Characters exist on a floor plane:

- `x`: horizontal position.
- `y`: depth position.
- `z`: temporary vertical offset for jumps, knockups, or visual arcs.

## Fighter Boxes

Every fighter must have at least:

### Hurtbox

Area where the fighter can be hit.

### Hitbox

Temporary attack area active during attack active frames.

### Pushbox

Approximate body volume used to prevent complete overlap.

## Attack Phases

Every attack uses three mandatory phases:

```txt
startup → active → recovery
```

### Startup

The attack is being prepared.

- No damage yet.
- Player usually cannot move freely.
- Telegraph must be visible later through animation.

### Active

The attack can hit.

- Hitbox enabled.
- Collision checked against enemy hurtboxes.
- Each target usually hit once per attack instance.

### Recovery

Attack has ended but fighter is not ready yet.

- Hitbox disabled.
- Fighter waits before returning to idle/walk.

## Attack Data Shape

Recommended TypeScript shape:

```ts
export type AttackDefinition = {
  id: string;
  label: string;
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  damage: number;
  hitstunMs: number;
  knockbackX: number;
  knockbackY: number;
  hitbox: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  canMoveDuringAttack?: boolean;
  canTurnDuringAttack?: boolean;
};
```

## Initial Player Attacks

### Wombat Jab

Purpose: fast basic hit.

Suggested values:

```txt
startup: 90 ms
active: 80 ms
recovery: 160 ms
damage: 8
hitstun: 220 ms
knockbackX: 130
knockbackY: 20
```

### Wombat Belly Slam

Purpose: slower but stronger special.

Suggested values:

```txt
startup: 220 ms
active: 140 ms
recovery: 360 ms
damage: 18
hitstun: 420 ms
knockbackX: 260
knockbackY: 80
```

## Initial Enemy Attack

### Pigeon Peck

Suggested values:

```txt
startup: 140 ms
active: 80 ms
recovery: 260 ms
damage: 5
hitstun: 160 ms
knockbackX: 80
knockbackY: 10
```

## Hit Rules

- One attack instance should not hit the same target repeatedly unless explicitly marked as multi-hit.
- Dead fighters cannot be hit.
- Fighters in knockdown may optionally be invulnerable.
- Friendly fire disabled for MVP.

## Hitstop

Add brief hitstop after successful hits.

Suggested:

- Light hit: 50 ms.
- Heavy hit: 80 ms.
- Special hit: 100 ms.

Hitstop should pause combat feel briefly, not freeze UI forever.

## Knockback

Knockback direction depends on attacker's facing direction.

```txt
facing right → knockbackX positive
facing left → knockbackX negative
```

`knockbackY` can push enemies slightly up/down on the floor plane, but keep it controlled.

## Hitstun

A fighter in hitstun:

- Cannot attack.
- Cannot start a new move.
- May slide due to knockback.
- Returns to idle after timer expires.

## Death

When HP <= 0:

- Enter `dead` state.
- Disable hitbox/hurtbox.
- Play death animation or placeholder.
- Remove after delay or keep body briefly.

## Debug Requirements

Debug mode must show:

- Hurtbox in one color.
- Hitbox in another color.
- Pushbox in another color.
- Fighter state label.
- Attack phase label.
- HP value.
