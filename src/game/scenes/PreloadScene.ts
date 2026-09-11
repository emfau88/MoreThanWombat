import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const publicBase = import.meta.env.BASE_URL;
    const assetBase = `${publicBase}assets/`;

    this.load.image('main-menu-background', `${assetBase}2.png`);
    this.load.image('main-menu-button-panel', `${assetBase}ui/main-menu/menu_button_panel.png`);
    this.load.image('duel-park-background', `${assetBase}arenas/park/duel_park_background.png`);
    this.load.image('scrapyard-background', `${assetBase}arenas/scrapyard/scrapyard_background.png`);
    this.load.image('junkyard-run-scrap-gate', `${assetBase}arenas/junkyard-run/scrap_gate.png`);
    this.load.image('junkyard-run-furnace-yard', `${assetBase}arenas/junkyard-run/furnace_yard.png`);
    this.load.image('junkyard-run-neon-dump', `${assetBase}arenas/junkyard-run/neon_dump.png`);
    this.load.image('junkyard-zone-transition', `${assetBase}arenas/junkyard-run/zone_transition.png`);
    this.load.image('rooftop-background', `${assetBase}arenas/rooftop/rooftop_background.png`);
    this.load.image('cs-background', `${assetBase}ui/character-select/character_select_backstage.png`);
    this.load.image('cs-panel-player', `${assetBase}ui/character-select/panel_player.png`);
    this.load.image('cs-panel-enemy', `${assetBase}ui/character-select/panel_enemy.png`);
    this.load.image('cs-arena-strip', `${assetBase}ui/character-select/arena_strip.png`);
    this.load.image('cs-arrow-left', `${assetBase}ui/character-select/arrow_left.png`);
    this.load.image('cs-arrow-right', `${assetBase}ui/character-select/arrow_right.png`);
    this.load.image('cs-arrow-player-left', `${assetBase}ui/character-select/arrow_player_left.png`);
    this.load.image('cs-arrow-player-right', `${assetBase}ui/character-select/arrow_player_right.png`);
    this.load.image('cs-arrow-enemy-left', `${assetBase}ui/character-select/arrow_enemy_left.png`);
    this.load.image('cs-arrow-enemy-right', `${assetBase}ui/character-select/arrow_enemy_right.png`);
    this.load.image('cs-arrow-arena-left', `${assetBase}ui/character-select/arrow_arena_left.png`);
    this.load.image('cs-arrow-arena-right', `${assetBase}ui/character-select/arrow_arena_right.png`);
    this.load.image('cs-selection-glow', `${assetBase}ui/character-select/selection_glow.png`);
    this.load.image('ui-button-attack', `${assetBase}ui/battle/attack_button.png`);
    this.load.image('ui-button-jump', `${assetBase}ui/battle/jump_button.png`);
    this.load.image('ui-button-special', `${assetBase}ui/battle/special_button.png`);
    this.load.image('ui-button-defend', `${assetBase}ui/battle/defend_button.png`);
    this.load.image('ui-button-ultimate', `${assetBase}ui/battle/ultimate_button.png`);
    this.load.image('ui-joystick-base', `${assetBase}ui/battle/joystick_base.png`);
    this.load.image('ui-joystick-knob', `${assetBase}ui/battle/joystick_knob.png`);
    this.load.image('ui-hud-chassis-neutral', `${assetBase}ui/battle/hud_chassis_neutral.png`);
    this.load.image('hud-portrait-wombat', `${assetBase}ui/battle/portraits/wombat.png`);
    this.load.image('hud-portrait-angry-pigeon', `${assetBase}ui/battle/portraits/angry_pigeon.png`);
    this.load.image('hud-portrait-discount-wizard', `${assetBase}ui/battle/portraits/discount_wizard.png`);
    this.load.image('hud-portrait-budget-barbarian', `${assetBase}ui/battle/portraits/budget_barbarian.png`);
    this.load.image('hud-portrait-mara-breach', `${assetBase}ui/battle/portraits/mara_breach.png`);
    this.load.image('hud-portrait-buster-bulldog', `${assetBase}ui/battle/portraits/buster_bulldog.png`);
    this.load.image('hud-portrait-reference-fighter', `${assetBase}ui/battle/portraits/reference_fighter.png`);
    this.load.image('ui-button-compact', `${assetBase}ui/battle/compact_button.png`);
    this.load.spritesheet('wombat', `${assetBase}characters/wombat/wombat_spritesheet_128_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('angry-pigeon', `${assetBase}characters/angry-pigeon/angry_pigeon_spritesheet_128_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('discount-wizard', `${assetBase}characters/discount-wizard/discount_wizard_spritesheet_v2_128_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian', `${assetBase}characters/budget-barbarian/budget_barbarian_spritesheet_128_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian-walk', `${assetBase}characters/budget-barbarian/budget_barbarian_walk_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('mara-breach', `${assetBase}characters/mara/mara_breach_spritesheet_160_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('mara-breach-walk', `${assetBase}characters/mara/mara_breach_walk_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('buster-bulldog', `${assetBase}characters/buster-bulldog/buster_bulldog_spritesheet_128_normalized.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('reference-fighter', `${assetBase}characters/reference-fighter/reference_fighter_selected_96.png`, {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('buster-bulldog-air-bonk', `${assetBase}characters/buster-bulldog/buster_bulldog_air_bonk_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('budget-barbarian-ultimate-fx', `${assetBase}fx/budget-barbarian/budget_barbarian_ultimate_sheet_128.png`, {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.image('vfx-style-physical-light-a', `${assetBase}fx/style-lock/physical-light-a.png`);
    this.load.image('vfx-style-physical-light-b', `${assetBase}fx/style-lock/physical-light-b.png`);
    this.load.image('vfx-style-magic-light-a', `${assetBase}fx/style-lock/magic-light-a.png`);
    this.load.image('vfx-style-magic-light-b', `${assetBase}fx/style-lock/magic-light-b.png`);
    this.load.image('vfx-style-ground-impact-a', `${assetBase}fx/style-lock/ground-impact-a.png`);
    this.load.image('vfx-style-ground-impact-b', `${assetBase}fx/style-lock/ground-impact-b.png`);
    this.load.image('vfx-library-block-contact', `${assetBase}fx/library/block-contact.png`);
    this.load.image('vfx-library-armor-contact', `${assetBase}fx/library/armor-contact.png`);
    this.load.image('vfx-library-invulnerable-contact', `${assetBase}fx/library/invulnerable-contact.png`);
    this.load.image('vfx-library-whiff-trail', `${assetBase}fx/library/whiff-trail.png`);
    this.load.image('vfx-library-dust-medium', `${assetBase}fx/library/dust-medium.png`);
    this.load.image('vfx-roster-wizard-cast', `${assetBase}fx/roster/wizard-cast.png`);
    this.load.image('vfx-roster-wizard-phase', `${assetBase}fx/roster/wizard-phase.png`);
    this.load.image('vfx-roster-warning-ring', `${assetBase}fx/roster/warning-ring.png`);
    this.load.image('vfx-roster-shock-ring', `${assetBase}fx/roster/shock-ring.png`);
    const impactAudioBase = `${publicBase}kenney_impact-sounds/Audio/`;
    this.load.audio('impact-light', `${impactAudioBase}impactGeneric_light_002.ogg`);
    this.load.audio('impact-medium', `${impactAudioBase}impactPunch_medium_001.ogg`);
    this.load.audio('impact-heavy', `${impactAudioBase}impactPunch_heavy_002.ogg`);
    this.load.audio('impact-ultimate', `${impactAudioBase}impactMetal_heavy_003.ogg`);
    this.load.audio('impact-magic', `${impactAudioBase}impactGlass_medium_003.ogg`);
    this.load.audio('impact-block', `${impactAudioBase}impactMetal_light_001.ogg`);
    this.load.audio('impact-armor', `${impactAudioBase}impactMetal_medium_003.ogg`);
    this.load.audio('impact-invulnerable', `${impactAudioBase}impactGlass_light_001.ogg`);
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
