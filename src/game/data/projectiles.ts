export type ProjectileDefinition = {
  id: string;
  sourceAttackId: string;
  textureKey: string;
  animationKey?: string;
  impactAnimationKey: string;
  speed: number;
  lifetimeMs: number;
  damage: number;
  hitstunMs: number;
  knockbackX: number;
  knockbackY: number;
  spawnOffsetX: number;
  spawnOffsetY: number;
  scale: number;
  /** Decorative rotation for static transparent VFX textures. */
  spinRadiansPerSecond?: number;
  laneTolerance: number;
  heightTolerance: number;
  homingStrength?: number;
  hitbox: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
};

export const discountFireballProjectile: ProjectileDefinition = {
  id: 'discount_fireball_projectile',
  sourceAttackId: 'discount_fireball_cast',
  textureKey: 'vfx-roster-wizard-cast',
  impactAnimationKey: 'magic.cast',
  speed: 330,
  lifetimeMs: 850,
  damage: 9,
  hitstunMs: 240,
  knockbackX: 150,
  knockbackY: 12,
  spawnOffsetX: 54,
  spawnOffsetY: -50,
  scale: 0.48,
  spinRadiansPerSecond: 5.2,
  laneTolerance: 38,
  heightTolerance: 92,
  hitbox: {
    offsetX: -17,
    offsetY: -12,
    width: 34,
    height: 24,
  },
};

export const discountUltimateOrbProjectile: ProjectileDefinition = {
  id: 'discount_ultimate_orb_projectile',
  sourceAttackId: 'discount_clearance_orb',
  textureKey: 'vfx-roster-wizard-cast',
  impactAnimationKey: 'magic.phase',
  speed: 245,
  lifetimeMs: 2600,
  damage: 30,
  hitstunMs: 560,
  knockbackX: 285,
  knockbackY: 62,
  spawnOffsetX: 72,
  spawnOffsetY: -54,
  scale: 0.82,
  spinRadiansPerSecond: 2.3,
  laneTolerance: 64,
  heightTolerance: 180,
  homingStrength: 2.4,
  hitbox: {
    offsetX: -27,
    offsetY: -24,
    width: 54,
    height: 48,
  },
};

export const projectilesById: Record<string, ProjectileDefinition> = {
  [discountFireballProjectile.id]: discountFireballProjectile,
  [discountUltimateOrbProjectile.id]: discountUltimateOrbProjectile,
};
