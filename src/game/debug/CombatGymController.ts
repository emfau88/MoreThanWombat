import Phaser from 'phaser';
import { GAME_WIDTH } from '../GameConfig';
import type { Fighter } from '../combat/Fighter';
import type { CombatFeedbackController } from '../combat/CombatFeedbackController';
import { getVfxLabLabel, type VfxLabRecipeId, type VfxQuality } from '../combat/VfxRecipeRegistry';
import { CombatClock } from './CombatClock';
import { fighterDefinitions } from '../data/fighters';
import {
  COMBAT_GYM_DUMMY_MODES,
  COMBAT_GYM_LANE_GAPS,
  COMBAT_GYM_MANA_RATIOS,
  COMBAT_GYM_RANGES,
  cycleCombatGymSetting,
  getSelectedCombatGymMove,
  type CombatGymSettings,
} from './CombatGymModel';

type GymButton = {
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type CombatGymCallbacks = {
  onSettingsChanged: (settings: CombatGymSettings) => void;
  onFireMove: () => void;
  onReset: () => void;
  onToggleDebug: () => void;
  onCycleShakeMode: () => void;
  onCycleVfxLabRecipe: () => VfxLabRecipeId;
  getVfxLabRecipe: () => VfxLabRecipeId;
  onCycleVfxQuality: () => VfxQuality;
  getVfxQuality: () => VfxQuality;
};

export class CombatGymController {
  readonly clock = new CombatClock();
  private settings: CombatGymSettings;
  private readonly container: Phaser.GameObjects.Container;
  private readonly pauseButton: GymButton;
  private readonly speedButton: GymButton;
  private readonly debugButton: GymButton;
  private readonly shakeButton: GymButton;
  private readonly vfxStyleButton: GymButton;
  private readonly vfxQualityButton: GymButton;
  private readonly playerButton: GymButton;
  private readonly moveButton: GymButton;
  private readonly dummyButton: GymButton;
  private readonly rangeButton: GymButton;
  private readonly laneButton: GymButton;
  private readonly manaButton: GymButton;
  private readonly dummyModeButton: GymButton;
  private readonly telemetryText: Phaser.GameObjects.Text;
  private readonly keys: {
    pause: Phaser.Input.Keyboard.Key;
    step: Phaser.Input.Keyboard.Key;
    speed: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    togglePanel: Phaser.Input.Keyboard.Key;
    shake: Phaser.Input.Keyboard.Key;
    vfxLabRecipe: Phaser.Input.Keyboard.Key;
    vfxQuality: Phaser.Input.Keyboard.Key;
  };
  private panelVisible = true;

  constructor(
    private readonly scene: Phaser.Scene,
    settings: CombatGymSettings,
    private readonly callbacks: CombatGymCallbacks,
  ) {
    this.settings = settings;
    this.container = scene.add.container(GAME_WIDTH / 2, 128).setDepth(2400).setScrollFactor(0);
    const background = scene.add
      .rectangle(0, 0, 920, 148, 0x07111c, 0.92)
      .setStrokeStyle(2, 0x67d5b5, 0.78);
    const title = scene.add.text(-444, -62, 'COMBAT GYM', {
      color: '#9ff7dc',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const hint = scene.add.text(-444, 64, 'P pause  O step  I speed  T fire  V VFX recipe  Q VFX quality  G shake  F2 panel', {
      color: '#91a7b8',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '10px',
    }).setOrigin(0, 0.5);

    this.container.add([background, title, hint]);
    this.pauseButton = this.createButton(-252, -52, 92, () => this.clock.togglePause());
    this.createButton(-150, -52, 92, () => this.clock.requestFrameStep(), 'Step');
    this.speedButton = this.createButton(-48, -52, 92, () => this.clock.cycleTimeScale());
    this.debugButton = this.createButton(62, -52, 112, this.callbacks.onToggleDebug);
    this.createButton(180, -52, 104, this.callbacks.onReset, 'Reset');
    this.vfxStyleButton = this.createButton(292, -52, 104, this.callbacks.onCycleVfxLabRecipe, 'VFX P Light');
    this.shakeButton = this.createButton(402, -52, 100, this.callbacks.onCycleShakeMode, 'Shake Full');

    this.playerButton = this.createButton(-342, -16, 178, () => this.cycleSetting('player'));
    this.moveButton = this.createButton(-112, -16, 270, () => this.cycleSetting('move'));
    this.dummyButton = this.createButton(166, -16, 178, () => this.cycleSetting('dummy'));
    this.rangeButton = this.createButton(-346, 22, 146, () => this.cycleSetting('range'));
    this.laneButton = this.createButton(-188, 22, 144, () => this.cycleSetting('lane'));
    this.manaButton = this.createButton(-48, 22, 116, () => this.cycleSetting('mana'));
    this.dummyModeButton = this.createButton(104, 22, 176, () => this.cycleSetting('dummyMode'));
    this.createButton(288, 22, 128, () => {
      this.callbacks.onFireMove();
    }, 'Fire Move');
    this.vfxQualityButton = this.createButton(410, 22, 88, this.callbacks.onCycleVfxQuality, 'VFX Full');
    this.telemetryText = scene.add.text(0, 50, '', {
      color: '#f5f0d8',
      fontFamily: 'Consolas, monospace',
      fontSize: '10px',
      align: 'center',
    }).setOrigin(0.5);
    this.container.add(this.telemetryText);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Combat Gym requires keyboard input for debug controls.');
    }
    this.keys = keyboard.addKeys({
      pause: Phaser.Input.Keyboard.KeyCodes.P,
      step: Phaser.Input.Keyboard.KeyCodes.O,
      speed: Phaser.Input.Keyboard.KeyCodes.I,
      fire: Phaser.Input.Keyboard.KeyCodes.T,
      togglePanel: Phaser.Input.Keyboard.KeyCodes.F2,
      shake: Phaser.Input.Keyboard.KeyCodes.G,
      vfxLabRecipe: Phaser.Input.Keyboard.KeyCodes.V,
      vfxQuality: Phaser.Input.Keyboard.KeyCodes.Q,
    }) as CombatGymController['keys'];
    this.refreshLabels(false);
  }

  update(player: Fighter, dummy: Fighter | null, feedback: CombatFeedbackController, debugEnabled: boolean): void {
    this.consumeKeyboard();
    this.refreshLabels(debugEnabled);

    const playerAnimation = player.getAnimationDebugInfo();
    const dummyAnimation = dummy?.getAnimationDebugInfo();
    const playerMove = player.getCurrentAttack();
    const dummyMove = dummy?.getCurrentAttack();
    const playerLine = `P ${player.state}/${player.getAttackPhase()} ${playerMove?.id ?? '-'} ${Math.round(player.getAttackElapsedMs())}ms rem ${Math.round(player.getAttackPhaseRemainingMs())} | hit ${player.getActiveHitboxProfileId()} hurt ${player.getHurtboxProfileId()} | ${playerAnimation.animationKey} f${playerAnimation.frameIndex}`;
    const dummyLine = dummy
      ? `D ${dummy.state}/${dummy.getAttackPhase()} ${dummyMove?.id ?? '-'} | ${dummyAnimation?.animationKey ?? 'none'} f${dummyAnimation?.frameIndex ?? 0}`
      : 'D none';
    const freeze = feedback.isHitstopActive() ? ` | hitstop ${Math.ceil(feedback.getHitstopRemainingMs())}ms` : '';
    const impact = feedback.getLastImpactDebugInfo();
    const impactLine = impact
      ? `impact ${impact.outcome}/${impact.feedbackClass} ${impact.sparkStyle} sfx ${impact.sound}`
      : 'impact none';
    this.shakeButton.label.setText(`Shake ${feedback.getShakeMode()}`);
    this.telemetryText.setText(`${playerLine}${freeze}\n${dummyLine} | ${impactLine}`);

    if (import.meta.env.DEV) {
      document.documentElement.dataset.combatGym = JSON.stringify({
        settings: this.settings,
        paused: this.clock.isPaused(),
        timeScale: this.clock.getTimeScale(),
        debugEnabled,
        player: {
          health: player.hp,
          mana: player.mana,
          state: player.state,
          attackId: playerMove?.id ?? null,
          phase: player.getAttackPhase(),
          hitboxProfile: player.getActiveHitboxProfileId(),
          hurtboxProfile: player.getHurtboxProfileId(),
        },
        dummy: dummy ? {
          health: dummy.hp,
          state: dummy.state,
          attackId: dummyMove?.id ?? null,
          response: dummy.getCombatResponse(),
          hitboxProfile: dummy.getActiveHitboxProfileId(),
          hurtboxProfile: dummy.getHurtboxProfileId(),
        } : null,
        hitstopMs: feedback.getHitstopRemainingMs(),
        shakeMode: feedback.getShakeMode(),
        vfxRecipe: this.callbacks.getVfxLabRecipe(),
        vfxQuality: this.callbacks.getVfxQuality(),
        lastImpact: impact,
      });
    }
  }

  getSettings(): CombatGymSettings {
    return { ...this.settings };
  }

  destroy(): void {
    if (import.meta.env.DEV) {
      delete document.documentElement.dataset.combatGym;
    }
    this.container.destroy(true);
  }

  private consumeKeyboard(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      this.clock.togglePause();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.step)) {
      this.clock.requestFrameStep();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.speed)) {
      this.clock.cycleTimeScale();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.fire)) {
      this.callbacks.onFireMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.togglePanel)) {
      this.setPanelVisible(!this.panelVisible);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.shake)) {
      this.callbacks.onCycleShakeMode();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.vfxLabRecipe)) {
      this.callbacks.onCycleVfxLabRecipe();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.vfxQuality)) {
      this.callbacks.onCycleVfxQuality();
    }
  }

  private setPanelVisible(visible: boolean): void {
    this.panelVisible = visible;
    this.container.setVisible(visible);
  }

  private cycleSetting(key: Parameters<typeof cycleCombatGymSetting>[1]): void {
    this.settings = cycleCombatGymSetting(this.settings, key);
    this.callbacks.onSettingsChanged(this.getSettings());
  }

  private refreshLabels(debugEnabled: boolean): void {
    const move = getSelectedCombatGymMove(this.settings);
    this.pauseButton.label.setText(this.clock.isPaused() ? 'Resume' : 'Pause');
    this.speedButton.label.setText(`${this.clock.getTimeScale()}x Speed`);
    this.debugButton.label.setText(`Boxes ${debugEnabled ? 'On' : 'Off'}`);
    this.vfxStyleButton.label.setText(`VFX ${getVfxLabLabel(this.callbacks.getVfxLabRecipe())}`);
    this.vfxQualityButton.label.setText(`VFX ${this.callbacks.getVfxQuality()}`);
    this.playerButton.label.setText(`Player: ${fighterDefinitions[this.settings.playerId].label}`);
    this.moveButton.label.setText(`Move: ${move.attack.label}`);
    this.dummyButton.label.setText(`Dummy: ${fighterDefinitions[this.settings.dummyId].label}`);
    this.rangeButton.label.setText(`Range: ${COMBAT_GYM_RANGES[this.settings.rangeIndex]}px`);
    this.laneButton.label.setText(`Lane: ${COMBAT_GYM_LANE_GAPS[this.settings.laneIndex]}px`);
    this.manaButton.label.setText(`MP: ${COMBAT_GYM_MANA_RATIOS[this.settings.manaIndex] * 100}%`);
    this.dummyModeButton.label.setText(`Dummy: ${COMBAT_GYM_DUMMY_MODES[this.settings.dummyModeIndex]}`);
  }

  private createButton(x: number, y: number, width: number, onClick: () => void, label = ''): GymButton {
    const panel = this.scene.add
      .rectangle(x, y, width, 27, 0x22354a, 0.98)
      .setStrokeStyle(1, 0xaac6d6, 0.62)
      .setInteractive({ useHandCursor: true })
      .on(Phaser.Input.Events.POINTER_OVER, () => panel.setFillStyle(0x34526b, 1))
      .on(Phaser.Input.Events.POINTER_OUT, () => panel.setFillStyle(0x22354a, 0.98))
      .on(Phaser.Input.Events.POINTER_UP, onClick);
    const text = this.scene.add.text(x, y, label, {
      color: '#fff7e6',
      fontFamily: 'Verdana, Geneva, sans-serif',
      fontSize: '10px',
      align: 'center',
    }).setOrigin(0.5);
    this.container.add([panel, text]);
    return { panel, label: text };
  }
}
