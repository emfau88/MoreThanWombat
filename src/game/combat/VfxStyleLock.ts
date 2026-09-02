import type { PresentedImpactStyle } from './HitFeedback';

export type VfxStyleLockMode = 'reference' | 'comic-a' | 'comic-b';

const MODES: VfxStyleLockMode[] = ['reference', 'comic-a', 'comic-b'];

const CONTACT_TEXTURES: Record<Exclude<VfxStyleLockMode, 'reference'>, Record<'physical' | 'magic', string>> = {
  'comic-a': {
    physical: 'vfx-style-physical-light-a',
    magic: 'vfx-style-magic-light-a',
  },
  'comic-b': {
    physical: 'vfx-style-physical-light-b',
    magic: 'vfx-style-magic-light-b',
  },
};

const GROUND_TEXTURES: Record<Exclude<VfxStyleLockMode, 'reference'>, string> = {
  'comic-a': 'vfx-style-ground-impact-a',
  'comic-b': 'vfx-style-ground-impact-b',
};

export function cycleVfxStyleLockMode(mode: VfxStyleLockMode): VfxStyleLockMode {
  return MODES[(MODES.indexOf(mode) + 1) % MODES.length];
}

export function getVfxStyleLockLabel(mode: VfxStyleLockMode): string {
  if (mode === 'reference') {
    return 'Ref';
  }
  return mode === 'comic-a' ? 'Comic A' : 'Comic B';
}

export function getStyleLockContactTexture(
  mode: VfxStyleLockMode,
  style: PresentedImpactStyle,
): string | null {
  if (mode === 'reference' || (style !== 'physical' && style !== 'magic')) {
    return null;
  }
  return CONTACT_TEXTURES[mode][style];
}

export function getStyleLockGroundTexture(mode: VfxStyleLockMode): string | null {
  return mode === 'reference' ? null : GROUND_TEXTURES[mode];
}
