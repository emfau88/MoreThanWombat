import Phaser from 'phaser';
import { gameConfig } from './game/GameConfig';
import { setupMobileViewport } from './mobileViewport';

import './style.css';

const game = new Phaser.Game(gameConfig);

if (import.meta.env.DEV) {
  Object.defineProperty(window, '__MORE_THAN_WOMBAT_GAME__', {
    value: game,
    configurable: true,
  });
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    document.documentElement.dataset.gameScenes = game.scene.getScenes(true)
      .map((scene) => scene.scene.key)
      .join(',');
  });
}

setupMobileViewport(game);
