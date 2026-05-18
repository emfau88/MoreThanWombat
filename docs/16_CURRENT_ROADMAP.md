# 16 - Current Roadmap

This file reflects the actual project state after the initial sandbox, roster, and menu work.

The original roadmap in `05_ROADMAP.md` remains useful as the foundation plan.
This document is the current execution roadmap based on what is already built.

## Current State Summary

Implemented and usable today:

- Phaser + TypeScript + Vite project setup
- Boot, preload, main menu, character select, battle scene
- Duel mode
- Wave mode
- Arena background and mobile-friendly scaling
- Keyboard controls
- Touch joystick, attack, special, jump
- Wombat player character
- Angry Pigeon enemy
- Discount Wizard playable character
- Budget Barbarian playable character
- Buster Bulldog playable character
- Basic attacks
- Specials
- Hitboxes, hurtboxes, pushboxes, debug rendering
- Damage, hitstun, knockback
- Hitstop, hit flash, screen shake
- Jump foundation with fake-z
- One minimal air attack (`air_bonk`)
- Projectile system for Discount Wizard
- Debug toggle in battle UI
- GitHub Pages deployment setup

## Phase A - Stabilization

Goal:
Make the current playable build reliable across desktop, mobile, and GitHub Pages.

Focus:

- Verify GitHub Pages build and asset loading end-to-end
- Verify start-of-battle input responsiveness on touch
- Verify fullscreen behavior on mobile browsers
- Clean up character select layout and readability
- Remove remaining awkward UI or control friction before adding more content

Exit criteria:

- GitHub Pages version matches local build visually
- No missing asset paths on hosted build
- Mobile controls respond immediately and predictably
- Character select is readable and touch-friendly
- No known stuck-state or startup-input confusion

## Phase B - Combat Feel and Control Pass

Goal:
Improve movement readability and combat pacing without expanding the system too aggressively.

Focus:

- Evaluate smoother movement feel for player controls
- Review whether acceleration, deceleration, or input filtering would improve readability
- Tune enemy pacing if they feel too aggressive or too close too quickly
- Preserve responsiveness while reducing chaotic contact pressure
- Keep touch controls simple and readable

Specific review items already identified:

- Investigate slightly smoother player control if it improves feel without adding lag
- Consider making enemy approach behavior a little slower if combat currently feels too sticky
- Verify that movement feels good on both keyboard and touch, not only one input method

Exit criteria:

- Player movement feels responsive but less abrupt if smoothing is added
- Enemy pressure remains fair and readable
- No input stickiness introduced by control changes

## Phase C - Enemy Pacing and Wizard Identity Pass

Goal:
Make the enemy roster and especially Discount Wizard read more clearly as distinct fighters.

Focus:

- Rebalance enemy approach pacing and spacing behavior
- Give Discount Wizard more opportunities to show projectile gameplay at range
- Make humor beats such as miscasts visible in real fights instead of disappearing into melee pressure
- Review AI decision timing, desired spacing, and attack range thresholds

Specific observations already raised:

- Some enemies may be slightly too fast or too eager to collapse distance
- Discount Wizard often ends up in melee too quickly
- Miscast comedy and projectile identity are underrepresented during actual play

Exit criteria:

- Wizard more often demonstrates ranged behavior
- Miscast moments are visible often enough to matter
- Enemy pressure remains fun, not passive

## Phase D - Content Presentation Pass

Goal:
Make the existing content read better before expanding the roster much further.

Focus:

- Finish the character select presentation
- Improve menu polish where needed
- Verify all fighter previews and labels are readable on mobile
- Review map presentation and variation

Exit criteria:

- Character select feels intentional and understandable
- Menus do not fight the player
- Existing content feels presentable enough for wider testing

## Phase E - Content Expansion

Goal:
Add more game content only after the current sandbox feels stable and readable.

Potential scope:

- Additional arena backgrounds
- Additional fighter characters
- Additional enemy behaviors within the existing combat model
- Better wave progression structure

Guardrails:

- No multiplayer
- No meta progression
- No giant system rewrite
- No full LF2 air-combat expansion unless deliberately planned later

## Phase F - Documentation and Production Hygiene

Goal:
Keep the project maintainable as the feature set grows.

Focus:

- Keep roadmap and backlog synchronized with reality
- Log balancing decisions that materially affect game feel
- Track deployment assumptions for GitHub Pages
- Track known control and mobile issues explicitly

Exit criteria:

- Documentation matches the shipped prototype closely enough for handoff or pause-and-return work

