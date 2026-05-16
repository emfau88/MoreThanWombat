import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.load.image('main-menu-background', '/assets/2.png');
    this.load.image('duel-park-background', '/assets/arenas/park/duel_park_background.png');
    this.load.spritesheet('wombat', '/assets/characters/wombat/wombat_spritesheet_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('wombat-air-bonk', '/assets/characters/wombat/wombat_air_bonk_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('angry-pigeon', '/assets/characters/angry-pigeon/angry_pigeon_spritesheet_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('discount-wizard', '/assets/characters/discount-wizard/discount_wizard_spritesheet_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian', '/assets/characters/budget-barbarian/budget_barbarian_spritesheet_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('buster-bulldog', '/assets/characters/buster-bulldog/buster_bulldog_spritesheet_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('buster-bulldog-air-bonk', '/assets/characters/buster-bulldog/buster_bulldog_air_bonk_128.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('discount-wizard-fx', '/assets/fx/discount-wizard/discount_wizard_fx_64.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
