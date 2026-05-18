import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const assetBase = `${import.meta.env.BASE_URL}assets/`;

    this.load.image('main-menu-background', `${assetBase}2.png`);
    this.load.image('duel-park-background', `${assetBase}arenas/park/duel_park_background.png`);
    this.load.image('scrapyard-background', `${assetBase}arenas/scrapyard/scrapyard_background.png`);
    this.load.image('rooftop-background', `${assetBase}arenas/rooftop/rooftop_background.png`);
    this.load.spritesheet('wombat', `${assetBase}characters/wombat/wombat_spritesheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('wombat-air-bonk', `${assetBase}characters/wombat/wombat_air_bonk_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('wombat-earthshaker-fx', `${assetBase}fx/wombat/wombat_earthshaker_sheet_256.png`, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet('angry-pigeon', `${assetBase}characters/angry-pigeon/angry_pigeon_spritesheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('discount-wizard', `${assetBase}characters/discount-wizard/discount_wizard_spritesheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian', `${assetBase}characters/budget-barbarian/budget_barbarian_spritesheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('buster-bulldog', `${assetBase}characters/buster-bulldog/buster_bulldog_spritesheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('buster-bulldog-air-bonk', `${assetBase}characters/buster-bulldog/buster_bulldog_air_bonk_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('discount-wizard-fx', `${assetBase}fx/discount-wizard/discount_wizard_fx_64.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('discount-wizard-ultimate-fx', `${assetBase}fx/discount-wizard/discount_wizard_ultimate_sheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian-ultimate-fx', `${assetBase}fx/budget-barbarian/budget_barbarian_ultimate_sheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
