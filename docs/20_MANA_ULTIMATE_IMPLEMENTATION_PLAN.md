# 20 - Mana and Ultimate Implementation Plan

This plan defines a safe rollout for mana, special costs, and one future high-impact ultimate attack slot.

## Goal

Add a mobile-friendly resource system that limits special attack spam and creates room for rare, visually spectacular character abilities.

The system should support:

- Basic attack without mana cost
- Current special attack with mana cost
- Future ultimate attack with high mana cost
- Mobile button feedback for available and unavailable actions
- HUD mana bars under HP bars

## Non-Goals

This first rollout should not add all ultimate attacks at once.

Do not add:

- Keyboard-style input combinations
- Full combo trees
- Skill trees
- Meta progression
- Complex RPG stats
- Multiple mana types
- Large combat rewrites

## Phase 1 - Mana Foundation

Scope:

- Add `mana`, `maxMana`, and `manaRegenPerSecond` to `Fighter`
- Add mana config to fighter definitions
- Regenerate mana during normal updates
- Clamp mana between 0 and max
- Preserve current combat behavior except for special-cost checks

Acceptance:

- All fighters start with configured mana
- Mana regenerates over time
- No existing attacks break
- Build passes

## Phase 2 - Special Cost

Scope:

- Add `manaCost` to attack definitions
- Current special attacks cost mana
- Basic attacks stay free
- If mana is missing, special does not start
- Add a small visual or button feedback later if the first pass needs it

Recommended first costs:

- Wombat Belly Slam: 25
- Discount Fireball / Miscast: 22
- Budget Barbarian Tiny Rage: 30
- Buster Bulldog Bash: 28

Acceptance:

- Specials cannot be spammed indefinitely
- Specials still feel usable
- Basic attacks remain unchanged
- Wizard special remains readable and not over-punished

## Phase 3 - HUD Mana Bars

Scope:

- Add mana bars under HP bars
- Player mana on left
- Enemy mana on right if enemy exists
- Keep HUD compact and away from mobile controls

Acceptance:

- HP and mana are both readable
- Test mode hides enemy bars cleanly
- No overlap with debug button or mobile HUD

## Phase 4 - Ultimate Input Slot

Scope:

- Add an `ultimatePressed` input field
- Add desktop key, recommended `U`
- Add mobile `ULT` button
- Do not implement every ultimate yet
- Button should be visibly unavailable if mana is too low in a later polish pass

Acceptance:

- Input plumbing exists
- Mobile layout remains usable
- No accidental triggering
- Existing `ATK`, `SP`, and `JMP` remain unchanged

## Phase 5 - First Test Ultimate

Scope:

- Implement one ultimate only
- Recommended first candidate: Wombat
- Keep it as one clear attack with startup, active, recovery, mana cost, and one or more large hitboxes/projectiles
- Use existing combat systems where possible

Recommended Wombat concept:

`Earthshaker Nap Slam`

- High mana cost: 100
- Short startup
- Big impact visual
- Ground shockwave in both directions
- Moderate-high damage
- Strong knockback
- Cannot be spammed due to mana cost

Acceptance:

- One ultimate works end-to-end
- It feels clearly bigger than current specials
- It does not require a new full combat architecture
- It does not break mobile input

## Phase 6 - Per-Character Ultimates

Only after the first ultimate proves stable.

Possible concepts:

- Discount Wizard: `Questionable Meteor Sale`
- Budget Barbarian: `Cardboard Bonkstorm`
- Buster Bulldog: `Underbite Bulldozer`
- Future mobile hybrid fighter: fast ranged burst or dash-shot ultimate

Each ultimate should be its own small task with:

- Design note
- FX plan
- Attack data
- Manual tests

## Technical Notes

Recommended data additions:

```ts
type FighterResourceConfig = {
  maxMana: number;
  manaRegenPerSecond: number;
  startingMana?: number;
};

type AttackDefinition = {
  manaCost?: number;
};
```

Recommended runtime rules:

- Mana cost is paid only when the attack successfully starts
- Failed attacks do not spend mana
- Grounded special remains blocked while airborne as today
- Air Bonk remains free for now
- Enemy AI must check whether it can afford specials before choosing them

## Manual Test Checklist

After Phase 1-3:

- Start Duel
- Verify player mana bar appears
- Verify enemy mana bar appears
- Use basic attack repeatedly
- Confirm basic attack does not consume mana
- Use special repeatedly
- Confirm mana decreases
- Confirm special stops when mana is too low
- Wait and confirm mana regenerates
- Test Wizard special and miscast
- Test Test mode with no enemy
- Test mobile layout

After Phase 4-5:

- Press ultimate key on desktop
- Press `ULT` on mobile
- Confirm ultimate only starts with enough mana
- Confirm ultimate spends mana once
- Confirm no repeated trigger while holding
- Confirm existing attacks still work
