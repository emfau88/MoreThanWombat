import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { BattleScene } from './scenes/BattleScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { BASE_GAME_WIDTH, GAME_HEIGHT as ADAPTIVE_GAME_HEIGHT, getBrowserAdaptiveGameViewport } from './core/AdaptiveViewport';

export const GAME_WIDTH = BASE_GAME_WIDTH;
export const GAME_HEIGHT = ADAPTIVE_GAME_HEIGHT;

const initialViewport = getBrowserAdaptiveGameViewport();

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: initialViewport.width,
  height: initialViewport.height,
  backgroundColor: '#1b2430',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialViewport.width,
    height: initialViewport.height,
  },
  scene: [BootScene, PreloadScene, MainMenuScene, CharacterSelectScene, BattleScene],
};
