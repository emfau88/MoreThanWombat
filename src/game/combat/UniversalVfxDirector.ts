import Phaser from 'phaser';
import { VFX_ACTIVE_LAYER_LIMITS, type VfxPerformanceDiagnostics } from './VfxPerformanceBudget';
import { shouldRenderVfxLayer, type VfxQuality, type VfxRecipe } from './VfxRecipeRegistry';

type ActiveVfxLayer = {
  image: Phaser.GameObjects.Image;
  elapsedMs: number;
  durationMs: number;
  startScale: number;
  endScale: number;
  startAlpha: number;
  endAlpha: number;
  importance: 'core' | 'residue';
};

export class UniversalVfxDirector {
  private readonly availableByTexture = new Map<string, Phaser.GameObjects.Image[]>();
  private readonly active: ActiveVfxLayer[] = [];
  private peakActiveLayers = 0;
  private droppedResidue = 0;
  private reclaimedResidue = 0;
  private forcedCoreReclaims = 0;

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
      const importance = layer.importance ?? 'core';
      if (!this.reserveLayer(importance, quality)) {
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
        importance,
      });
      this.peakActiveLayers = Math.max(this.peakActiveLayers, this.active.length);
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

  getDiagnostics(quality: VfxQuality): VfxPerformanceDiagnostics {
    return {
      activeLayers: this.active.length,
      peakActiveLayers: this.peakActiveLayers,
      layerLimit: VFX_ACTIVE_LAYER_LIMITS[quality],
      droppedResidue: this.droppedResidue,
      reclaimedResidue: this.reclaimedResidue,
      forcedCoreReclaims: this.forcedCoreReclaims,
    };
  }

  resetDiagnostics(): void {
    this.peakActiveLayers = this.active.length;
    this.droppedResidue = 0;
    this.reclaimedResidue = 0;
    this.forcedCoreReclaims = 0;
  }

  trimToBudget(quality: VfxQuality): void {
    const limit = VFX_ACTIVE_LAYER_LIMITS[quality];
    while (this.active.length > limit) {
      const residueIndex = this.active.findIndex((layer) => layer.importance === 'residue');
      const index = residueIndex >= 0 ? residueIndex : 0;
      const [removed] = this.active.splice(index, 1);
      this.release(removed.image);
      if (residueIndex >= 0) {
        this.reclaimedResidue += 1;
      } else {
        this.forcedCoreReclaims += 1;
      }
    }
  }

  private reserveLayer(importance: 'core' | 'residue', quality: VfxQuality): boolean {
    const limit = VFX_ACTIVE_LAYER_LIMITS[quality];
    if (this.active.length < limit) {
      return true;
    }
    if (importance === 'residue') {
      this.droppedResidue += 1;
      return false;
    }

    const residueIndex = this.active.findIndex((layer) => layer.importance === 'residue');
    if (residueIndex >= 0) {
      this.release(this.active[residueIndex].image);
      this.active.splice(residueIndex, 1);
      this.reclaimedResidue += 1;
      return true;
    }

    this.release(this.active[0].image);
    this.active.splice(0, 1);
    this.forcedCoreReclaims += 1;
    return true;
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
