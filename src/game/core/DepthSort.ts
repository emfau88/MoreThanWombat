import Phaser from 'phaser';

export function applyDepthSort(gameObject: Phaser.GameObjects.Components.Depth, y: number): void {
  gameObject.setDepth(y);
}
