import type { HitFeedbackProfile } from './HitFeedback';
import type { HitFeedbackClass } from './MoveTimeline';

export type VfxQuality = 'full' | 'reduced' | 'minimal';

export type VfxLayer = {
  textureKey: string;
  durationMs: number;
  startScale: number;
  endScale: number;
  startAlpha?: number;
  endAlpha?: number;
  offsetX?: number;
  offsetY?: number;
  minQuality?: VfxQuality;
  directional?: boolean;
};

export type VfxRecipe = {
  id: string;
  anchor: 'contact' | 'ground' | 'motion';
  layers: VfxLayer[];
};

type ContactFamily = 'physical' | 'magic' | 'block' | 'armor' | 'invulnerable';

const CONTACT_RECIPES: Record<ContactFamily, Record<HitFeedbackClass, VfxRecipe>> = {
  physical: {
    light: recipe('physical.light', 'contact', [layer('vfx-style-physical-light-b', 108, 0.44, 0.64)]),
    medium: recipe('physical.medium', 'contact', [layer('vfx-style-physical-light-a', 128, 0.60, 0.90)]),
    heavy: recipe('physical.heavy', 'contact', [
      layer('vfx-style-physical-light-a', 154, 0.78, 1.14),
      layer('vfx-style-ground-impact-b', 180, 0.36, 0.52, { offsetY: 40, minQuality: 'reduced' }),
    ]),
    ultimate: recipe('physical.ultimate', 'contact', [
      layer('vfx-style-physical-light-a', 208, 1.02, 1.48),
      layer('vfx-style-ground-impact-a', 300, 0.60, 0.90, { offsetY: 44, minQuality: 'reduced' }),
      layer('vfx-library-dust-medium', 330, 0.46, 0.72, { offsetY: 52, minQuality: 'full' }),
    ]),
  },
  magic: {
    light: recipe('magic.light', 'contact', [layer('vfx-style-magic-light-b', 112, 0.45, 0.66)]),
    medium: recipe('magic.medium', 'contact', [layer('vfx-style-magic-light-a', 138, 0.58, 0.86)]),
    heavy: recipe('magic.heavy', 'contact', [layer('vfx-style-magic-light-a', 168, 0.76, 1.10)]),
    ultimate: recipe('magic.ultimate', 'contact', [layer('vfx-style-magic-light-a', 220, 0.98, 1.40)]),
  },
  block: {
    light: recipe('block', 'contact', [layer('vfx-library-block-contact', 96, 0.36, 0.54, { directional: true })]),
    medium: recipe('block', 'contact', [layer('vfx-library-block-contact', 96, 0.36, 0.54, { directional: true })]),
    heavy: recipe('block', 'contact', [layer('vfx-library-block-contact', 96, 0.36, 0.54, { directional: true })]),
    ultimate: recipe('block', 'contact', [layer('vfx-library-block-contact', 96, 0.36, 0.54, { directional: true })]),
  },
  armor: {
    light: recipe('armor', 'contact', [layer('vfx-library-armor-contact', 112, 0.38, 0.58)]),
    medium: recipe('armor', 'contact', [layer('vfx-library-armor-contact', 112, 0.38, 0.58)]),
    heavy: recipe('armor', 'contact', [layer('vfx-library-armor-contact', 112, 0.38, 0.58)]),
    ultimate: recipe('armor', 'contact', [layer('vfx-library-armor-contact', 112, 0.38, 0.58)]),
  },
  invulnerable: {
    light: recipe('invulnerable', 'contact', [layer('vfx-library-invulnerable-contact', 86, 0.54, 0.76)]),
    medium: recipe('invulnerable', 'contact', [layer('vfx-library-invulnerable-contact', 86, 0.54, 0.76)]),
    heavy: recipe('invulnerable', 'contact', [layer('vfx-library-invulnerable-contact', 86, 0.54, 0.76)]),
    ultimate: recipe('invulnerable', 'contact', [layer('vfx-library-invulnerable-contact', 86, 0.54, 0.76)]),
  },
};

const AUXILIARY_RECIPES: Record<'motion.whiff' | 'ground.small' | 'ground.medium' | 'ground.heavy', VfxRecipe> = {
  'motion.whiff': recipe('motion.whiff', 'motion', [layer('vfx-library-whiff-trail', 84, 0.38, 0.62, { directional: true })]),
  'ground.small': recipe('ground.small', 'ground', [layer('vfx-style-ground-impact-b', 170, 0.30, 0.46)]),
  'ground.medium': recipe('ground.medium', 'ground', [
    layer('vfx-style-ground-impact-b', 210, 0.46, 0.68),
    layer('vfx-library-dust-medium', 260, 0.34, 0.52, { minQuality: 'reduced' }),
  ]),
  'ground.heavy': recipe('ground.heavy', 'ground', [
    layer('vfx-style-ground-impact-a', 300, 0.62, 0.90),
    layer('vfx-library-dust-medium', 340, 0.54, 0.80, { minQuality: 'reduced' }),
  ]),
};

export const VFX_LAB_RECIPE_IDS = [
  'physical.light',
  'physical.medium',
  'physical.heavy',
  'physical.ultimate',
  'magic.light',
  'magic.medium',
  'magic.heavy',
  'magic.ultimate',
  'block',
  'armor',
  'invulnerable',
  'motion.whiff',
  'ground.small',
  'ground.medium',
  'ground.heavy',
] as const;

export type VfxLabRecipeId = typeof VFX_LAB_RECIPE_IDS[number];

export function getImpactVfxRecipe(profile: HitFeedbackProfile): VfxRecipe {
  return CONTACT_RECIPES[profile.sparkStyle][profile.feedbackClass];
}

export function getAuxiliaryVfxRecipe(id: keyof typeof AUXILIARY_RECIPES): VfxRecipe {
  return AUXILIARY_RECIPES[id];
}

export function getVfxLabRecipe(id: VfxLabRecipeId): VfxRecipe {
  if (id in AUXILIARY_RECIPES) {
    return AUXILIARY_RECIPES[id as keyof typeof AUXILIARY_RECIPES];
  }
  if (id === 'block' || id === 'armor' || id === 'invulnerable') {
    return CONTACT_RECIPES[id].light;
  }
  const [family, feedbackClass] = id.split('.') as [ContactFamily, HitFeedbackClass];
  return CONTACT_RECIPES[family][feedbackClass];
}

export function getVfxLabLabel(id: VfxLabRecipeId): string {
  const labels: Record<VfxLabRecipeId, string> = {
    'physical.light': 'P Light',
    'physical.medium': 'P Medium',
    'physical.heavy': 'P Heavy',
    'physical.ultimate': 'P Ult',
    'magic.light': 'M Light',
    'magic.medium': 'M Medium',
    'magic.heavy': 'M Heavy',
    'magic.ultimate': 'M Ult',
    block: 'Block',
    armor: 'Armor',
    invulnerable: 'Phase',
    'motion.whiff': 'Whiff',
    'ground.small': 'G Small',
    'ground.medium': 'G Medium',
    'ground.heavy': 'G Heavy',
  };
  return labels[id];
}

export function cycleVfxQuality(quality: VfxQuality): VfxQuality {
  return quality === 'full' ? 'reduced' : quality === 'reduced' ? 'minimal' : 'full';
}

export function shouldRenderVfxLayer(layer: VfxLayer, quality: VfxQuality): boolean {
  if (quality === 'full') return true;
  if (quality === 'reduced') return layer.minQuality !== 'full';
  return !layer.minQuality;
}

function recipe(id: string, anchor: VfxRecipe['anchor'], layers: VfxLayer[]): VfxRecipe {
  return { id, anchor, layers };
}

function layer(
  textureKey: string,
  durationMs: number,
  startScale: number,
  endScale: number,
  options: Omit<VfxLayer, 'textureKey' | 'durationMs' | 'startScale' | 'endScale'> = {},
): VfxLayer {
  return { textureKey, durationMs, startScale, endScale, ...options };
}
