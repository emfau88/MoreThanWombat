# 01 — Tech Stack Decision

## Final Decision

Use:

- **Phaser** for the game engine.
- **TypeScript** for source code.
- **Vite** for local development and build tooling.
- **HTML5/WebGL/Canvas** through Phaser.

## Why Phaser

Phaser is the correct tool for a 2D mobile-first HTML5 brawler because it provides:

- 2D rendering.
- Sprite animation.
- Scene management.
- Input handling.
- Camera support.
- Lightweight physics options.
- Browser deployment.
- Good fit for prototype-to-production iteration.

## Why Not Three.js

Do not use Three.js for this project.

Reason:

- Three.js is a 3D rendering library.
- This game is 2D.
- Using Three.js would add unnecessary complexity around camera, 3D depth, lighting, geometry, and animation.
- The intended style is sprite-based pseudo-depth, not real 3D.

## Why Not Babylon.js

Do not use Babylon.js for this project.

Reason:

- Babylon.js is a powerful 3D engine.
- It is overkill for a 2D sprite brawler.
- It would push the project toward tech experiments instead of playable combat.

## Why Not Raw Canvas

Do not use raw Canvas for the first version.

Reason:

- Too much boilerplate.
- Input, animation, scenes, camera, asset loading, and timing would need custom implementation.
- Phaser already solves these problems.

## Recommended Initial Dependencies

Keep dependencies minimal.

Required:

```json
{
  "phaser": "latest",
  "typescript": "latest",
  "vite": "latest"
}
```

Optional later:

- None for MVP.

Do not add animation libraries, ECS libraries, UI libraries, physics engines, or asset pipelines until the MVP combat loop is stable.

## Target Runtime

- Mobile browser first.
- Desktop browser second.
- Android wrapper later if the browser version proves fun.

## Rendering Target

- Landscape orientation preferred for combat.
- Internal logical resolution: `960x540` or similar 16:9 base.
- Scale to fit mobile screens.
- Preserve readable character size.
