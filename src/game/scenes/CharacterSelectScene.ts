import Phaser from 'phaser';
import { GAME_HEIGHT } from '../GameConfig';
import type { FighterDefinition } from '../combat/Fighter';
import type { BattleMode, CharacterSelectSceneData, FighterId } from '../core/BattleModes';
import { arenaDefinitions, arenaOrder, type ArenaId } from '../data/arenas';
import { fighterDefinitions } from '../data/fighters';
import { PROTOTYPE_FIGHTERS, SHIPPABLE_DUEL_ENEMIES, SHIPPABLE_PLAYER_FIGHTERS } from '../data/roster';
import { registerCharacterAnimations } from '../core/CharacterAnimationRegistry';

type OptionCard = {
  id: FighterId;
  title: string;
  subtitle: string;
  description: string;
};

type PreviewCard = {
  titleText: Phaser.GameObjects.Text;
  subtitleText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  roleText: Phaser.GameObjects.Text;
  spriteBaseX: number;
  spriteBaseY: number;
  indexText?: Phaser.GameObjects.Text;
  lockText?: Phaser.GameObjects.Text;
};

const PLAYER_OPTIONS: OptionCard[] = [
  {
    id: 'wombat',
    title: 'Wombat',
    subtitle: 'Heavy bruiser',
    description: 'Solid all-rounder with grounded punches and a reliable slam.',
  },
  {
    id: 'discount_wizard',
    title: 'Discount Wizard',
    subtitle: 'Cheap ranged magic',
    description: 'Ranged pressure with cheap fireballs and unstable miscasts.',
  },
  {
    id: 'budget_barbarian',
    title: 'Budget Barbarian',
    subtitle: 'Slow axe bruiser',
    description: 'Large damage, slower feet, and heavy melee timing.',
  },
];

const DUEL_ENEMY_OPTIONS: OptionCard[] = [
  {
    id: 'angry_pigeon',
    title: 'Angry Pigeon',
    subtitle: 'Fast peck fighter',
    description: 'Quick little menace that closes distance and pecks often.',
  },
  {
    id: 'discount_wizard',
    title: 'Discount Wizard',
    subtitle: 'Unreliable spellcaster',
    description: 'Risky caster that can still zone with cheap fireballs.',
  },
  {
    id: 'budget_barbarian',
    title: 'Budget Barbarian',
    subtitle: 'Heavy melee fighter',
    description: 'Slower enemy with a punishing swing if you stand in front of him.',
  },
];

if (!PLAYER_OPTIONS.every((option) => SHIPPABLE_PLAYER_FIGHTERS.includes(option.id as (typeof SHIPPABLE_PLAYER_FIGHTERS)[number]))) {
  throw new Error('Character Select may only expose the shippable player roster.');
}
if (!DUEL_ENEMY_OPTIONS.every((option) => SHIPPABLE_DUEL_ENEMIES.includes(option.id as (typeof SHIPPABLE_DUEL_ENEMIES)[number]))) {
  throw new Error('Character Select may only expose the shippable Duel enemy roster.');
}
if (PROTOTYPE_FIGHTERS.some((fighterId) => PLAYER_OPTIONS.some((option) => option.id === fighterId) || DUEL_ENEMY_OPTIONS.some((option) => option.id === fighterId))) {
  throw new Error('Diagnostic fighter prototypes must stay out of Character Select.');
}

export class CharacterSelectScene extends Phaser.Scene {
  private mode: BattleMode = 'duel';
  private selectedPlayer: FighterId = 'wombat';
  private selectedEnemy: FighterId = 'angry_pigeon';
  private selectedArena: ArenaId = 'park';
  private playerIndex = 0;
  private enemyIndex = 0;
  private arenaIndex = 0;
  private playerCard!: PreviewCard;
  private enemyCard!: PreviewCard;
  private arenaTitleText!: Phaser.GameObjects.Text;
  private arenaSubtitleText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  init(data: CharacterSelectSceneData): void {
    this.mode = data.mode;
    this.selectedPlayer = data.selectedPlayer ?? 'wombat';
    this.selectedEnemy = data.selectedEnemy ?? 'angry_pigeon';
    this.selectedArena = data.selectedArena ?? 'park';
    this.playerIndex = this.findOptionIndex(PLAYER_OPTIONS, this.selectedPlayer);
    this.enemyIndex = this.findOptionIndex(DUEL_ENEMY_OPTIONS, this.selectedEnemy);
    this.arenaIndex = this.findArenaIndex(this.selectedArena);
  }

  create(): void {
    const viewportWidth = this.scale.width;
    const centerX = viewportWidth / 2;
    registerCharacterAnimations(this);
    this.add.image(centerX, GAME_HEIGHT / 2, 'cs-background').setDisplaySize(viewportWidth, GAME_HEIGHT).setDepth(-20);
    this.add.rectangle(centerX, GAME_HEIGHT / 2, viewportWidth, GAME_HEIGHT, 0x061018, 0.2).setDepth(-10);

    this.createArenaSelector();
    this.playerCard = this.createPreviewCard(centerX - 228, 306, 340, 292, 'PLAYER', false, true, 0x88c0ff, () => {
      this.cyclePlayer(-1);
    }, () => {
      this.cyclePlayer(1);
    });

    if (this.mode === 'duel') {
      this.enemyCard = this.createPreviewCard(centerX + 228, 306, 340, 292, 'OPPONENT', true, true, 0xff9a5a, () => {
        this.cycleEnemy(-1);
      }, () => {
        this.cycleEnemy(1);
      });
    } else if (this.mode === 'test') {
      this.enemyCard = this.createPreviewCard(centerX + 228, 306, 340, 292, 'TRAINING TOOLS', true, false, 0x67d5b5);
      this.updatePreviewCard(this.enemyCard, DUEL_ENEMY_OPTIONS[0], true);
      this.enemyCard.titleText.setText('Combat Gym');
      this.enemyCard.subtitleText.setText('Frame step + dummy presets');
      this.enemyCard.indexText?.setVisible(false);
    } else {
      this.enemyCard = this.createPreviewCard(centerX + 228, 306, 340, 292, 'WAVE ENEMY', true, false, 0xff9a5a);
      this.enemyCard.lockText = this.add.text(centerX + 228, 446, 'Fixed for this mode', {
        color: '#8da1b5',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
      }).setOrigin(0.5);
    }

    this.refreshPlayerCard();
    this.refreshEnemyCard();
    this.refreshArenaSelection();

    this.createActionButton(centerX - 194, 512, 212, 42, 'Back', () => {
      this.scene.start('MainMenuScene');
    });
    this.createActionButton(centerX + 194, 512, 252, 42, 'Start Battle', () => {
      this.scene.start('BattleScene', {
        mode: this.mode,
        playerFighterId: this.selectedPlayer,
        enemyFighterId: this.mode === 'duel' ? this.selectedEnemy : 'angry_pigeon',
        arenaId: this.selectedArena,
      });
    });
  }

  private createPreviewCard(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    flipPreview: boolean,
    showArrows: boolean,
    accentColor: number,
    onPrev?: () => void,
    onNext?: () => void,
  ): PreviewCard {
    const panelKey = accentColor === 0xff9a5a ? 'cs-panel-enemy' : 'cs-panel-player';
    this.add.image(x, y, panelKey).setDisplaySize(width + 34, height + 34).setDepth(1);

    const roleText = this.add.text(x, y - 132, label, {
      color: Phaser.Display.Color.IntegerToColor(accentColor).brighten(80).rgba,
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    const spriteBaseX = x;
    const spriteBaseY = y + 8;
    const sprite = this.add.sprite(spriteBaseX, spriteBaseY, 'wombat', 0).setOrigin(0.5, 1).setFlipX(flipPreview).setDepth(4);
    const titleText = this.add.text(x, y + 58, '', {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '22px',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    const subtitleText = this.add.text(x, y + 86, '', {
      color: '#e9c46a',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
    }).setOrigin(0.5).setDepth(5);

    let indexText: Phaser.GameObjects.Text | undefined;

    if (showArrows && onPrev && onNext) {
      const arrowVariant = accentColor === 0xff9a5a ? 'enemy' : 'player';
      this.createArrowButton(x - width / 2 - 24, y + 2, '<', arrowVariant, accentColor, onPrev);
      this.createArrowButton(x + width / 2 + 24, y + 2, '>', arrowVariant, accentColor, onNext);
      indexText = this.add.text(x, y + 30, '', {
        color: '#8da1b5',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
      }).setOrigin(0.5).setDepth(5);
    }

    const card: PreviewCard = {
      titleText,
      subtitleText,
      sprite,
      roleText,
      spriteBaseX,
      spriteBaseY,
      indexText,
    };

    sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, () => {
      const definition = sprite.getData('previewDefinition') as FighterDefinition | undefined;
      const previewFlip = Boolean(sprite.getData('previewFlip'));

      if (!definition) {
        return;
      }

      this.applyPreviewSpriteOffset(card, definition, previewFlip);
    });

    return card;
  }

  private createArrowButton(
    x: number,
    y: number,
    label: string,
    variant: 'player' | 'enemy' | 'arena',
    accentColor: number,
    onClick: () => void,
  ): void {
    const direction = label === '<' ? 'left' : 'right';
    const textureKey = `cs-arrow-${variant}-${direction}`;
    const panel = this.add.image(x, y - 2, textureKey).setDisplaySize(38, 38).setDepth(8);
    const baseScaleX = panel.scaleX;
    const baseScaleY = panel.scaleY;
    this.add.circle(x, y, 25, accentColor, 0.04).setDepth(7);

    panel.setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        panel.setTint(0xffffff);
        panel.setScale(baseScaleX * 1.06, baseScaleY * 1.06);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.clearTint();
        panel.setScale(baseScaleX, baseScaleY);
      })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        panel.setScale(baseScaleX * 0.94, baseScaleY * 0.94);
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        panel.setScale(baseScaleX, baseScaleY);
        onClick();
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.setScale(baseScaleX, baseScaleY);
      });
  }

  private refreshPlayerCard(): void {
    const option = PLAYER_OPTIONS[this.playerIndex];
    this.selectedPlayer = option.id;
    this.updatePreviewCard(this.playerCard, option, false, PLAYER_OPTIONS.length, this.playerIndex);
  }

  private refreshEnemyCard(): void {
    if (this.mode === 'test') {
      return;
    }

    if (this.mode === 'waves') {
      const waveOption = DUEL_ENEMY_OPTIONS[0];
      this.selectedEnemy = waveOption.id;
      this.updatePreviewCard(this.enemyCard, waveOption, true);
      return;
    }

    const option = DUEL_ENEMY_OPTIONS[this.enemyIndex];
    this.selectedEnemy = option.id;
    this.updatePreviewCard(this.enemyCard, option, true, DUEL_ENEMY_OPTIONS.length, this.enemyIndex);
  }

  private updatePreviewCard(
    card: PreviewCard,
    option: OptionCard,
    flipPreview: boolean,
    total?: number,
    index?: number,
  ): void {
    const definition = fighterDefinitions[option.id];
    const idleAnimation = definition.sprite?.animations.idle;
    const textureKey = definition.sprite?.textureKey ?? '';
    const spriteScale = this.getPreviewScale(definition);

    card.titleText.setText(option.title);
    card.subtitleText.setText(option.subtitle);
    card.sprite.setTexture(textureKey, 0);
    card.sprite.setScale(spriteScale);
    card.sprite.setFlipX(flipPreview);
    card.sprite.setData('previewDefinition', definition);
    card.sprite.setData('previewFlip', flipPreview);

    if (idleAnimation) {
      card.sprite.play(idleAnimation, true);
    } else {
      card.sprite.stop();
    }

    this.applyPreviewSpriteOffset(card, definition, flipPreview);

    if (card.indexText && total !== undefined && index !== undefined) {
      card.indexText.setText(`${index + 1} / ${total}`);
    }
  }

  private applyPreviewSpriteOffset(card: PreviewCard, definition: FighterDefinition, flipPreview: boolean): void {
    const animationKey = card.sprite.anims.currentAnim?.key;
    const frameOffsets = animationKey ? definition.sprite?.frameOffsetSets?.[animationKey] : undefined;

    if (!frameOffsets || frameOffsets.length === 0) {
      card.sprite.setPosition(card.spriteBaseX, card.spriteBaseY);
      return;
    }

    const frameName = Number(card.sprite.frame.name);
    const frameIndex = Number.isFinite(frameName) ? frameName : 0;
    const offset = frameOffsets[frameIndex] ?? frameOffsets[frameOffsets.length - 1] ?? { x: 0, y: 0 };
    const facingDirection = flipPreview ? -1 : 1;
    card.sprite.setPosition(card.spriteBaseX + offset.x * facingDirection, card.spriteBaseY + offset.y);
  }

  private cyclePlayer(direction: number): void {
    this.playerIndex = Phaser.Math.Wrap(this.playerIndex + direction, 0, PLAYER_OPTIONS.length);
    this.refreshPlayerCard();
  }

  private cycleEnemy(direction: number): void {
    if (this.mode !== 'duel') {
      return;
    }

    this.enemyIndex = Phaser.Math.Wrap(this.enemyIndex + direction, 0, DUEL_ENEMY_OPTIONS.length);
    this.refreshEnemyCard();
  }

  private createArenaSelector(): void {
    const centerX = this.scale.width / 2;
    const arenaY = 76;
    this.add.image(centerX, arenaY, 'cs-arena-strip').setDisplaySize(456, 74).setDepth(1);
    this.add.text(centerX, arenaY - 17, 'ARENA', {
      color: '#9fb5c9',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);
    this.arenaTitleText = this.add.text(centerX, arenaY - 2, '', {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '18px',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);
    this.arenaSubtitleText = this.add.text(centerX, arenaY + 16, '', {
      color: '#e9c46a',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '11px',
    }).setOrigin(0.5).setDepth(6);

    this.createArrowButton(centerX - 258, arenaY, '<', 'arena', 0x67d5b5, () => {
      this.cycleArena(-1);
    });
    this.createArrowButton(centerX + 258, arenaY, '>', 'arena', 0x67d5b5, () => {
      this.cycleArena(1);
    });
  }

  private refreshArenaSelection(): void {
    const arena = arenaDefinitions[this.selectedArena];
    this.arenaTitleText.setText(arena.title);
    this.arenaSubtitleText.setText(arena.subtitle);
  }

  private cycleArena(direction: number): void {
    this.arenaIndex = Phaser.Math.Wrap(this.arenaIndex + direction, 0, arenaOrder.length);
    this.selectedArena = arenaOrder[this.arenaIndex];
    this.refreshArenaSelection();
  }

  private getPreviewScale(definition: FighterDefinition): number {
    const baseScale = definition.sprite?.scale ?? 0.86;
    return baseScale * 0.9;
  }

  private createActionButton(x: number, y: number, width: number, height: number, label: string, onClick: () => void): void {
    const panel = this.add.rectangle(x, y, width, height, 0x324156, 0.97).setStrokeStyle(3, 0xe9c46a);
    this.add.text(x, y, label, {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5);

    panel.setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        panel.setFillStyle(0x42556d, 0.99);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.setFillStyle(0x324156, 0.97);
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        onClick();
      });
  }

  private findOptionIndex(options: OptionCard[], fighterId: FighterId): number {
    const index = options.findIndex((option) => option.id === fighterId);
    return index >= 0 ? index : 0;
  }

  private findArenaIndex(arenaId: ArenaId): number {
    const index = arenaOrder.indexOf(arenaId);
    return index >= 0 ? index : 0;
  }
}
