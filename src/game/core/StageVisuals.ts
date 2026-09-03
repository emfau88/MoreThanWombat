export type RasterSize = {
  width: number;
  height: number;
};

/**
 * Scale one tile of a stage background until it completely covers the combat
 * viewport. Keeping both axes at the same scale preserves the painted ground
 * projection when a larger source is used in a scrolling TileSprite.
 */
export function getStageTileScale(source: RasterSize, viewport: RasterSize): number {
  if (source.width <= 0 || source.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    throw new Error('Stage and viewport raster sizes must be positive.');
  }

  return Math.max(viewport.width / source.width, viewport.height / source.height);
}
