import Phaser from 'phaser';
import { GAME_HEIGHT, getBrowserAdaptiveGameViewport, shouldResizeAdaptiveViewport } from './game/core/AdaptiveViewport';

const FULLSCREEN_BUTTON_CLASS = 'fullscreen-button';

export function setupMobileViewport(game: Phaser.Game): void {
  const fullscreenSupported = document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = FULLSCREEN_BUTTON_CLASS;
  button.textContent = 'Full';
  button.setAttribute('aria-label', 'Play in fullscreen');
  button.hidden = !fullscreenSupported;
  document.body.appendChild(button);

  let refreshPending = false;
  const refreshScale = (): void => {
    if (refreshPending) return;
    refreshPending = true;
    window.requestAnimationFrame(() => {
      refreshPending = false;
      const nextViewport = getBrowserAdaptiveGameViewport();
      const currentViewport = {
        width: game.scale.gameSize.width,
        height: GAME_HEIGHT,
      };
      if (shouldResizeAdaptiveViewport(currentViewport, nextViewport)) {
        // FIT needs the display aspect ratio updated as well as the backing canvas.
        game.scale.setGameSize(nextViewport.width, nextViewport.height);
      }
      else game.scale.refresh();
    });
  };

  const syncFullscreenClass = (): void => {
    document.body.classList.toggle('is-fullscreen', document.fullscreenElement !== null);
    refreshScale();
  };

  button.addEventListener('click', () => {
    void enterFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreenClass);
  window.addEventListener('resize', refreshScale, { passive: true });
  window.addEventListener('orientationchange', refreshScale, { passive: true });
  window.visualViewport?.addEventListener('resize', refreshScale, { passive: true });
  refreshScale();
}

async function enterFullscreen(): Promise<void> {
  const target = document.getElementById('game') ?? document.documentElement;

  if (!document.fullscreenElement && typeof target.requestFullscreen === 'function') {
    try {
      await target.requestFullscreen();
    } catch {
      // Some mobile browsers, especially iOS Safari, restrict fullscreen for regular pages.
    }
  }
}
