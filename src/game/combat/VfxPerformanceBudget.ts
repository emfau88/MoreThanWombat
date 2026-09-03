import type { VfxQuality } from './VfxRecipeRegistry';

export const VFX_ACTIVE_LAYER_LIMITS: Record<VfxQuality, number> = {
  full: 80,
  reduced: 48,
  minimal: 24,
};

export type VfxPerformanceDiagnostics = {
  activeLayers: number;
  peakActiveLayers: number;
  layerLimit: number;
  droppedResidue: number;
  reclaimedResidue: number;
  forcedCoreReclaims: number;
};
