import Phaser from 'phaser';

type AnimationSpec = {
  key: string;
  textureKey: string;
  frames: { start: number; end: number } | number[];
  frameRate: number;
  repeat: number;
};

const ANIMATIONS: AnimationSpec[] = [
  { key: 'wombat-idle', textureKey: 'wombat', frames: { start: 0, end: 3 }, frameRate: 5, repeat: -1 },
  { key: 'wombat-walk', textureKey: 'wombat', frames: { start: 4, end: 7 }, frameRate: 8, repeat: -1 },
  // Frames 10 and 14 contain legacy embedded ground/contact art. The Wombat
  // body stays clean; its effects are emitted through the universal VFX recipes.
  { key: 'wombat-jab', textureKey: 'wombat', frames: [8, 9, 11], frameRate: 14, repeat: 0 },
  { key: 'wombat-belly-slam', textureKey: 'wombat', frames: [12, 13, 15], frameRate: 10, repeat: 0 },
  { key: 'wombat-hit', textureKey: 'wombat', frames: { start: 16, end: 17 }, frameRate: 8, repeat: 0 },
  { key: 'wombat-dead', textureKey: 'wombat', frames: { start: 18, end: 19 }, frameRate: 5, repeat: 0 },
  { key: 'wombat-air-bonk', textureKey: 'wombat', frames: [12, 13, 15], frameRate: 12, repeat: 0 },
  { key: 'angry-pigeon-idle', textureKey: 'angry-pigeon', frames: { start: 0, end: 3 }, frameRate: 5, repeat: -1 },
  { key: 'angry-pigeon-walk', textureKey: 'angry-pigeon', frames: { start: 4, end: 7 }, frameRate: 8, repeat: -1 },
  { key: 'angry-pigeon-peck', textureKey: 'angry-pigeon', frames: { start: 8, end: 11 }, frameRate: 14, repeat: 0 },
  { key: 'angry-pigeon-hit', textureKey: 'angry-pigeon', frames: { start: 12, end: 15 }, frameRate: 9, repeat: 0 },
  { key: 'angry-pigeon-dead', textureKey: 'angry-pigeon', frames: { start: 16, end: 19 }, frameRate: 7, repeat: 0 },
  { key: 'discount-wizard-idle', textureKey: 'discount-wizard', frames: { start: 0, end: 3 }, frameRate: 5, repeat: -1 },
  { key: 'discount-wizard-walk', textureKey: 'discount-wizard', frames: { start: 4, end: 7 }, frameRate: 8, repeat: -1 },
  { key: 'discount-wizard-fireball', textureKey: 'discount-wizard', frames: { start: 8, end: 11 }, frameRate: 11, repeat: 0 },
  { key: 'discount-wizard-miscast', textureKey: 'discount-wizard', frames: { start: 12, end: 15 }, frameRate: 9, repeat: 0 },
  { key: 'discount-wizard-hit', textureKey: 'discount-wizard', frames: { start: 16, end: 17 }, frameRate: 8, repeat: 0 },
  { key: 'discount-wizard-dead', textureKey: 'discount-wizard', frames: { start: 18, end: 19 }, frameRate: 5, repeat: 0 },
  { key: 'budget-barbarian-idle', textureKey: 'budget-barbarian', frames: { start: 0, end: 3 }, frameRate: 4, repeat: -1 },
  { key: 'budget-barbarian-walk', textureKey: 'budget-barbarian', frames: { start: 4, end: 7 }, frameRate: 7, repeat: -1 },
  { key: 'budget-barbarian-axe-swing', textureKey: 'budget-barbarian', frames: { start: 8, end: 10 }, frameRate: 11, repeat: 0 },
  { key: 'budget-barbarian-tiny-rage', textureKey: 'budget-barbarian', frames: { start: 12, end: 14 }, frameRate: 9, repeat: 0 },
  { key: 'budget-barbarian-hit', textureKey: 'budget-barbarian', frames: { start: 15, end: 15 }, frameRate: 8, repeat: 0 },
  { key: 'budget-barbarian-dead', textureKey: 'budget-barbarian', frames: { start: 16, end: 17 }, frameRate: 5, repeat: 0 },
  { key: 'budget-barbarian-jump', textureKey: 'budget-barbarian', frames: { start: 20, end: 20 }, frameRate: 8, repeat: 0 },
  { key: 'budget-barbarian-fall', textureKey: 'budget-barbarian', frames: { start: 21, end: 21 }, frameRate: 8, repeat: 0 },
  { key: 'budget-barbarian-landing', textureKey: 'budget-barbarian', frames: { start: 22, end: 22 }, frameRate: 8, repeat: 0 },
  { key: 'budget-barbarian-air-bonk', textureKey: 'budget-barbarian', frames: { start: 24, end: 26 }, frameRate: 12, repeat: 0 },
  { key: 'mara-breach-idle', textureKey: 'mara-breach', frames: { start: 0, end: 3 }, frameRate: 5, repeat: -1 },
  { key: 'mara-breach-walk', textureKey: 'mara-breach', frames: { start: 4, end: 7 }, frameRate: 8, repeat: -1 },
  { key: 'mara-breach-gate-kick', textureKey: 'mara-breach', frames: { start: 8, end: 11 }, frameRate: 14, repeat: 0 },
  { key: 'mara-breach-step', textureKey: 'mara-breach', frames: { start: 12, end: 15 }, frameRate: 11, repeat: 0 },
  { key: 'mara-breach-hit', textureKey: 'mara-breach', frames: { start: 16, end: 17 }, frameRate: 8, repeat: 0 },
  { key: 'mara-breach-dead', textureKey: 'mara-breach', frames: { start: 18, end: 19 }, frameRate: 5, repeat: 0 },
  { key: 'mara-breach-jump', textureKey: 'mara-breach', frames: [20], frameRate: 8, repeat: 0 },
  { key: 'mara-breach-fall', textureKey: 'mara-breach', frames: [21], frameRate: 8, repeat: 0 },
  { key: 'mara-breach-air-kick', textureKey: 'mara-breach', frames: [20, 22, 21], frameRate: 13, repeat: 0 },
  { key: 'mara-breach-landing', textureKey: 'mara-breach', frames: [23], frameRate: 8, repeat: 0 },
  { key: 'mara-breach-red-line-barrage', textureKey: 'mara-breach', frames: { start: 24, end: 27 }, frameRate: 10, repeat: 0 },
  { key: 'buster-bulldog-idle', textureKey: 'buster-bulldog', frames: { start: 0, end: 3 }, frameRate: 5, repeat: -1 },
  { key: 'buster-bulldog-walk', textureKey: 'buster-bulldog', frames: { start: 4, end: 7 }, frameRate: 8, repeat: -1 },
  { key: 'buster-bulldog-underbite-jab', textureKey: 'buster-bulldog', frames: { start: 8, end: 11 }, frameRate: 13, repeat: 0 },
  { key: 'buster-bulldog-bash', textureKey: 'buster-bulldog', frames: { start: 12, end: 15 }, frameRate: 11, repeat: 0 },
  { key: 'buster-bulldog-hit', textureKey: 'buster-bulldog', frames: { start: 16, end: 17 }, frameRate: 8, repeat: 0 },
  { key: 'buster-bulldog-dead', textureKey: 'buster-bulldog', frames: { start: 18, end: 19 }, frameRate: 5, repeat: 0 },
  { key: 'buster-bulldog-air-bonk', textureKey: 'buster-bulldog-air-bonk', frames: { start: 0, end: 2 }, frameRate: 12, repeat: 0 },
  { key: 'reference-fighter-idle', textureKey: 'reference-fighter', frames: { start: 0, end: 3 }, frameRate: 6, repeat: -1 },
  { key: 'reference-fighter-walk', textureKey: 'reference-fighter', frames: { start: 4, end: 6 }, frameRate: 10, repeat: -1 },
  { key: 'reference-fighter-basic', textureKey: 'reference-fighter', frames: { start: 7, end: 10 }, frameRate: 15, repeat: 0 },
  { key: 'reference-fighter-special', textureKey: 'reference-fighter', frames: { start: 11, end: 13 }, frameRate: 14, repeat: 0 },
  { key: 'reference-fighter-hit', textureKey: 'reference-fighter', frames: [11], frameRate: 8, repeat: 0 },
  { key: 'reference-fighter-dead', textureKey: 'reference-fighter', frames: [11], frameRate: 8, repeat: 0 },
  { key: 'reference-fighter-jump', textureKey: 'reference-fighter', frames: [14, 15], frameRate: 10, repeat: 0 },
  { key: 'reference-fighter-fall', textureKey: 'reference-fighter', frames: [17], frameRate: 10, repeat: 0 },
  { key: 'reference-fighter-landing', textureKey: 'reference-fighter', frames: [3], frameRate: 8, repeat: 0 },
  { key: 'reference-fighter-air-bonk', textureKey: 'reference-fighter', frames: [14, 15, 16, 17], frameRate: 13, repeat: 0 },
  { key: 'budget-barbarian-axe-fall', textureKey: 'budget-barbarian-ultimate-fx', frames: { start: 0, end: 3 }, frameRate: 16, repeat: 0 },
  { key: 'budget-barbarian-axe-impact', textureKey: 'budget-barbarian-ultimate-fx', frames: { start: 4, end: 7 }, frameRate: 14, repeat: 0 },
  { key: 'budget-barbarian-axe-stuck', textureKey: 'budget-barbarian-ultimate-fx', frames: { start: 8, end: 11 }, frameRate: 7, repeat: 0 },
];

export function registerCharacterAnimations(scene: Phaser.Scene): void {
  for (const animation of ANIMATIONS) {
    if (scene.anims.exists(animation.key)) {
      continue;
    }

    const frames = Array.isArray(animation.frames)
      ? animation.frames.map((frame) => ({ key: animation.textureKey, frame }))
      : scene.anims.generateFrameNumbers(animation.textureKey, animation.frames);
    scene.anims.create({
      key: animation.key,
      frames,
      frameRate: animation.frameRate,
      repeat: animation.repeat,
    });
  }
}
