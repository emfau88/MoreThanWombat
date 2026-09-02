import Phaser from 'phaser';
import { shouldRenderVfxLayer, type VfxQuality, type VfxRecipe } from './VfxRecipeRegistry';

type ActiveVfxLayer = {
  image: Phaser.GameObjects.Image;
  elapsedMs: number;
  durationMs: number;
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
};

export class UniversalVfxDirector {
  private readonly availableByTexture = new Map<string, Phaser.GameObjects.Image[]>();
  private readonly active: ActiveVfxLayer[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  spawn(
    recipe: VfxRecipe,
    x: number,
    y: number,
    depth: number,
    quality: VfxQuality,
    direction = 1,
  ): void {
    for (const layer of recipe.layers) {
      if (!shouldRenderVfxLayer(layer, quality)) {
        continue;
      }
      const image = this.checkout(layer.textureKey);
      image
        .setPosition(x + (layer.offsetX ?? 0) * direction, y + (layer.offsetY ?? 0))
        .setDepth(depth)
        .setOrigin(0.5)
        .setFlipX(Boolean(layer.directional && direction < 0))
        .setScale(layer.startScale)
        .setAlpha(layer.startAlpha ?? 1)
        .setActive(true)
        .setVisible(true);
      this.active.push({
        image,
        elapsedMs: 0,
        durationMs: layer.durationMs,
        startScale: layer.startScale,
        endScale: layer.endScale,
        startAlpha: layer.startAlpha ?? 1,
        endAlpha: layer.endAlpha ?? 0,
      });
    }
  }

  update(deltaMs: number): void {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const layer = this.active[index];
      layer.elapsedMs += Math.max(0, deltaMs);
      const progress = Phaser.Math.Clamp(layer.elapsedMs / layer.durationMs, 0, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      layer.image
        .setScale(Phaser.Math.Linear(layer.startScale, layer.endScale, eased))
        .setAlpha(Phaser.Math.Linear(layer.startAlpha, layer.endAlpha, progress));
      if (progress >= 1) {
        this.release(layer.image);
        this.active.splice(index, 1);
      }
    }
  }

  clear(): void {
    for (const layer of this.active) {
      this.release(layer.image);
    }
    this.active.length = 0;
  }

  getActiveLayerCount(): number {
    return this.active.length;
  }

  private checkout(textureKey: string): Phaser.GameObjects.Image {
    const pool = this.availableByTexture.get(textureKey);
    const image = pool?.pop() ?? this.scene.add.image(0, 0, textureKey).setVisible(false).setActive(false);
    return image;
  }

  private release(image: Phaser.GameObjects.Image): void {
    const textureKey = image.texture.key;
    image.setVisible(false).setActive(false).setAlpha(1).setScale(1).setFlipX(false);
    const pool = this.availableByTexture.get(textureKey) ?? [];
    pool.push(image);
    this.availableByTexture.set(textureKey, pool);
  }
}
