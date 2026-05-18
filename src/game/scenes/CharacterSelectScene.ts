import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../GameConfig';
import type { FighterDefinition } from '../combat/Fighter';
import type { BattleMode, CharacterSelectSceneData, FighterId } from '../core/BattleModes';
import { arenaDefinitions, arenaOrder, type ArenaId } from '../data/arenas';
import { fighterDefinitions } from '../data/fighters';

type OptionCard = {
  id: FighterId;
  title: string;
  subtitle: string;
  description: string;
};

type PreviewCard = {
  titleText: Phaser.GameObjects.Text;
  subtitleText: Phaser.GameObjects.Text;
  descriptionText: Phaser.GameObjects.Text;
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
    description: 'Throws bargain fireballs and occasionally embarrasses himself.',
  },
  {
    id: 'budget_barbarian',
    title: 'Budget Barbarian',
    subtitle: 'Slow axe bruiser',
    description: 'Large damage, slower feet, and a very serious cardboard helmet.',
  },
  {
    id: 'buster_bulldog',
    title: 'Buster Bulldog',
    subtitle: 'Underbite bruiser',
    description: 'Short, dense bulldog pressure with high knockback and stubborn HP.',
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
    description: 'Risky enemy caster that can still zone you with cheap fireballs.',
  },
  {
    id: 'budget_barbarian',
    title: 'Budget Barbarian',
    subtitle: 'Heavy melee fighter',
    description: 'Slower enemy with a punishing swing if you stand in front of him.',
  },
  {
    id: 'buster_bulldog',
    title: 'Buster Bulldog',
    subtitle: 'Short heavy bruiser',
    description: 'Compact tank that trades speed for impact and crowding pressure.',
  },
];

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
    this.createCharacterAnimations();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1420);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x162232, 0.92);
    this.add.rectangle(GAME_WIDTH / 2, 58, 560, 48, 0x0f1824, 0.52).setStrokeStyle(1, 0x344960, 0.72);

    this.add.text(GAME_WIDTH / 2, 52, 'Character Select', {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '26px',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add.text(
      GAME_WIDTH / 2,
      72,
      this.mode === 'duel' ? 'Choose fighter and opponent' : this.mode === 'test' ? 'Choose your fighter for solo sandbox' : 'Choose your fighter',
      {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '13px',
      },
    ).setOrigin(0.5);

    this.createArenaSelector();
    this.playerCard = this.createPreviewCard(270, 294, 284, 300, 'PLAYER SIDE', false, true, 0x88c0ff, () => {
      this.cyclePlayer(-1);
    }, () => {
      this.cyclePlayer(1);
    });

    if (this.mode === 'duel') {
      this.enemyCard = this.createPreviewCard(690, 294, 284, 300, 'ENEMY SIDE', true, true, 0xff9a5a, () => {
        this.cycleEnemy(-1);
      }, () => {
        this.cycleEnemy(1);
      });
    } else if (this.mode === 'test') {
      this.enemyCard = this.createPreviewCard(690, 294, 284, 300, 'SOLO SANDBOX', true, false, 0x67d5b5);
      this.enemyCard.titleText.setText('No Enemy');
      this.enemyCard.subtitleText.setText('Free practice');
      this.enemyCard.descriptionText.setText('Move, jump, basic, special, and air attack without combat pressure.');
      this.enemyCard.sprite.setVisible(false);
      this.enemyCard.indexText?.setVisible(false);
    } else {
      this.enemyCard = this.createPreviewCard(690, 294, 284, 300, 'WAVE ENEMY', true, false, 0xff9a5a);
      this.enemyCard.lockText = this.add.text(690, 438, 'Fixed for this mode', {
        color: '#8da1b5',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
      }).setOrigin(0.5);
    }

    this.refreshPlayerCard();
    this.refreshEnemyCard();
    this.refreshArenaSelection();

    this.createActionButton(280, 512, 190, 42, 'Back', () => {
      this.scene.start('MainMenuScene');
    });
    this.createActionButton(680, 512, 230, 42, 'Start Battle', () => {
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
    const outerPanel = this.add.rectangle(x, y, width, height, 0x101923, 0.94).setStrokeStyle(3, accentColor, 0.9);
    const roleBand = this.add.rectangle(x, y - 120, width - 26, 26, accentColor, 0.16).setStrokeStyle(1, accentColor, 0.58);
    const divider = this.add.rectangle(x, y + 26, width - 36, 2, accentColor, 0.18);
    outerPanel.setDepth(1);
    roleBand.setDepth(2);
    divider.setDepth(2);

    const roleText = this.add.text(x, y - 120, label, {
      color: Phaser.Display.Color.IntegerToColor(accentColor).brighten(80).rgba,
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    const spriteBaseX = x;
    const spriteBaseY = y + 10;
    const sprite = this.add.sprite(spriteBaseX, spriteBaseY, 'wombat', 0).setOrigin(0.5, 1).setFlipX(flipPreview).setDepth(4);
    const titleText = this.add.text(x, y + 52, '', {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '24px',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    const subtitleText = this.add.text(x, y + 80, '', {
      color: '#e9c46a',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '14px',
    }).setOrigin(0.5).setDepth(5);
    const descriptionText = this.add.text(x, y + 120, '', {
      color: '#d5dde4',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '13px',
      align: 'center',
      wordWrap: { width: width - 56, useAdvancedWrap: true },
    }).setOrigin(0.5).setDepth(5);

    let indexText: Phaser.GameObjects.Text | undefined;

    if (showArrows && onPrev && onNext) {
      this.createArrowButton(x - width / 2 - 24, y + 2, '<', accentColor, onPrev);
      this.createArrowButton(x + width / 2 + 24, y + 2, '>', accentColor, onNext);
      indexText = this.add.text(x, y + 32, '', {
        color: '#8da1b5',
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
      }).setOrigin(0.5).setDepth(5);
    }

    const card: PreviewCard = {
      titleText,
      subtitleText,
      descriptionText,
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

  private createArrowButton(x: number, y: number, label: string, accentColor: number, onClick: () => void): void {
    const panel = this.add.circle(x, y, 22, 0x263547, 0.96).setStrokeStyle(2, accentColor, 0.9);
    const text = this.add.text(x, y - 1, label, {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5);

    panel.setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => {
        panel.setFillStyle(0x33475e, 0.98);
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.setFillStyle(0x263547, 0.96);
      })
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        panel.setScale(0.94);
        text.setScale(0.94);
      })
      .on(Phaser.Input.Events.POINTER_UP, () => {
        panel.setScale(1);
        text.setScale(1);
        onClick();
      })
      .on(Phaser.Input.Events.POINTER_OUT, () => {
        panel.setScale(1);
        text.setScale(1);
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
    card.descriptionText.setText(option.description);
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
    this.add.rectangle(GAME_WIDTH / 2, 108, 420, 42, 0x0f1824, 0.78).setStrokeStyle(2, 0x4b647c, 0.8);
    this.add.text(GAME_WIDTH / 2, 94, 'ARENA', {
      color: '#9fb5c9',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arenaTitleText = this.add.text(GAME_WIDTH / 2, 108, '', {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '18px',
      stroke: '#101720',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.arenaSubtitleText = this.add.text(GAME_WIDTH / 2, 126, '', {
      color: '#e9c46a',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '11px',
    }).setOrigin(0.5);

    this.createArrowButton(GAME_WIDTH / 2 - 234, 108, '<', 0x67d5b5, () => {
      this.cycleArena(-1);
    });
    this.createArrowButton(GAME_WIDTH / 2 + 234, 108, '>', 0x67d5b5, () => {
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
    return baseScale * 0.98;
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

  private createCharacterAnimations(): void {
    this.createAnimationOnce('wombat-idle', 'wombat', 0, 3, 5, -1);
    this.createAnimationOnce('angry-pigeon-idle', 'angry-pigeon', 0, 3, 5, -1);
    this.createAnimationOnce('discount-wizard-idle', 'discount-wizard', 0, 3, 5, -1);
    this.createAnimationOnce('budget-barbarian-idle', 'budget-barbarian', 0, 1, 4, -1);
    this.createAnimationOnce('buster-bulldog-idle', 'buster-bulldog', 0, 3, 5, -1);
  }

  private createAnimationOnce(
    key: string,
    textureKey: string,
    start: number,
    end: number,
    frameRate: number,
    repeat: number,
  ): void {
    if (this.anims.exists(key)) {
      return;
    }

    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(textureKey, { start, end }),
      frameRate,
      repeat,
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
