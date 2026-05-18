# 17 - Open Tasks

This is the current practical task list based on the implemented build, not the original zero-state backlog.

## P0 - Immediate Verification

### TASK-CUR-001 - Verify GitHub Pages Live Build

Goal:
Confirm that the hosted Pages build loads the correct assets and behaves like local.

Acceptance:

- Main menu background loads correctly
- Character sprites load correctly
- Battle scene loads correctly
- No broken asset paths in hosted build

### TASK-CUR-002 - Verify Mobile Start-of-Battle Input

Goal:
Confirm that battle input works immediately after entering a match on touch devices.

Acceptance:

- Player can move immediately after battle start
- No delayed first input caused by menu touch carry-over
- Behavior is consistent across repeated battle starts

## P1 - UI and Flow

### TASK-CUR-003 - Finish Character Select Layout Pass

Goal:
Finalize the current character select so it reads cleanly on desktop and mobile.

Acceptance:

- Player and enemy sides are obvious
- Fighter previews are readable
- Arrows are easy to press
- Layout does not feel cluttered

### TASK-CUR-004 - Review Main Menu Readability

Goal:
Make sure menu buttons remain readable over the current background art.

Acceptance:

- Buttons remain readable on desktop and mobile
- Background supports the menu instead of fighting it

## P2 - Controls and Feel

### TASK-CUR-005 - Evaluate Smoother Player Control

Goal:
Test whether slightly smoother control improves the game feel without making the game sluggish.

Notes:

- This does not automatically mean inertia-heavy movement
- The game should stay responsive
- Any smoothing should be subtle

Acceptance:

- Movement still feels direct
- If smoothing is used, it improves readability rather than adding lag

### TASK-CUR-006 - Review Enemy Movement Speed

Goal:
Assess whether enemy fighters should move a little slower overall.

Reason:

- Current pressure may feel slightly too immediate in some matchups

Acceptance:

- Enemy pressure remains threatening
- Enemy movement no longer feels needlessly sticky or rushed
- Change is small, not a full rebalance overhaul

## P3 - Wizard Identity

### TASK-CUR-007 - Improve Discount Wizard Ranged Presence

Goal:
Make Discount Wizard actually read as a ranged-comedy fighter during normal matches.

Current issue:

- The wizard often collapses into melee too quickly
- Projectiles do not get enough room to matter
- Miscasts are technically present but can go unnoticed during play

Acceptance:

- Wizard uses projectile spacing more often
- Fireballs are visible enough to define the character
- Miscasts appear often enough to be noticed
- Wizard does not simply become another close-range fighter

### TASK-CUR-008 - Review Wizard AI or Spacing Logic

Goal:
Adjust behavior or spacing rules so the wizard can keep more distance when appropriate.

Acceptance:

- Wizard identity is clearer than generic melee AI
- Behavior remains simple and stable
- No major AI rewrite required

## P4 - Combat and Presentation Polish

### TASK-CUR-009 - Audio Integration Pass

Goal:
Use the available sound assets to improve hit and movement feedback.

Acceptance:

- Core hit feedback has at least basic SFX
- Sounds do not overwhelm readability

### TASK-CUR-010 - Map Variety Pass

Goal:
Add one or more additional usable arena backgrounds once current systems are stable.

Acceptance:

- New map supports combat readability
- Menu or duel flow can surface the map choice cleanly if enabled

## P5 - Documentation

### TASK-CUR-011 - Keep Current Roadmap Updated

Goal:
Avoid divergence between the codebase and the docs again.

Acceptance:

- Major implemented systems are reflected in roadmap/backlog docs
- Open issues are listed in one current place
