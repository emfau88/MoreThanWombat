export type RasterSize = {
  width: number;
  height: number;
};

export type CombatBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type StageVisualContract = {
  viewport: RasterSize;
  combatBounds: CombatBounds;
  /** The first safe world row below the painted horizon/obstacle line. */
  groundStartY: number;
  /** The last safe row before foreground art begins to obscure fighters. */
  groundEndY: number;
};

export const COMBAT_VIEWPORT: RasterSize = { width: 960, height: 540 };

/**
 * Shared fair-play contract for the current flat Duel/Test arenas. Stage art
 * may change, but it may not silently change the available combat lane.
 */
export const FLAT_ARENA_VISUAL_CONTRACT: StageVisualContract = {
  viewport: COMBAT_VIEWPORT,
  combatBounds: { minX: 72, maxX: 888, minY: 248, maxY: 474 },
  groundStartY: 230,
  groundEndY: 482,
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

/** Returns human-readable violations so stage data can be tested without Phaser. */
export function getStageVisualContractViolations(
  contract: StageVisualContract,
  bounds: CombatBounds,
): string[] {
  const violations: string[] = [];

  if (contract.groundStartY > contract.groundEndY) {
    violations.push('ground band is inverted');
  }
  if (bounds.minX < 0 || bounds.maxX > contract.viewport.width || bounds.minX >= bounds.maxX) {
    violations.push('horizontal combat bounds leave the viewport or are inverted');
  }
  if (bounds.minY < contract.groundStartY || bounds.maxY > contract.groundEndY || bounds.minY >= bounds.maxY) {
    violations.push('vertical combat bounds leave the painted ground band or are inverted');
  }

  return violations;
}
