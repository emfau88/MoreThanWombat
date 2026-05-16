import Phaser from 'phaser';
import { gameConfig } from './game/GameConfig';
import { setupMobileViewport } from './mobileViewport';

import './style.css';

const game = new Phaser.Game(gameConfig);

setupMobileViewport(game);
