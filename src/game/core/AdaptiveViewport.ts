export const BASE_GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export type GameViewport = {
  width: number;
  height: number;
};

/**
 * Wide landscape displays gain horizontal game space while preserving the
 * 540px combat height. This avoids both horizontal stretching and ENVELOP's
 * vertical crop of HUD and touch controls.
 */
export function getAdaptiveGameViewport(viewportWidth: number, viewportHeight: number): GameViewport {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) {
    return { width: BASE_GAME_WIDTH, height: GAME_HEIGHT };
  }

  const landscapeWidth = Math.round(GAME_HEIGHT * (viewportWidth / viewportHeight));
  return {
    width: Math.max(BASE_GAME_WIDTH, landscapeWidth),
    height: GAME_HEIGHT,
  };
}

export function getBrowserAdaptiveGameViewport(): GameViewport {
  return getAdaptiveGameViewport(window.innerWidth, window.innerHeight);
}

/**
 * Keeps resize work idempotent: browser chrome can emit several resize events
 * for one rotation, but the Phaser logical canvas only needs one update when
 * its actual game-space dimensions change.
 */
export function shouldResizeAdaptiveViewport(current: GameViewport, next: GameViewport): boolean {
  return current.width !== next.width || current.height !== next.height;
}
