export type ProjectileDefinition = {
  id: string;
  textureKey: string;
  animationKey: string;
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
  hitbox: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
};

export const discountFireballProjectile: ProjectileDefinition = {
  id: 'discount_fireball_projectile',
  textureKey: 'discount-wizard-fx',
  animationKey: 'discount-wizard-fx-fireball',
  impactAnimationKey: 'discount-wizard-fx-hit-puff',
  speed: 330,
  lifetimeMs: 850,
  damage: 9,
  hitstunMs: 240,
  knockbackX: 150,
  knockbackY: 12,
  spawnOffsetX: 54,
  spawnOffsetY: -50,
  scale: 0.92,
  hitbox: {
    offsetX: -17,
    offsetY: -12,
    width: 34,
    height: 24,
  },
};

export const projectilesById: Record<string, ProjectileDefinition> = {
  [discountFireballProjectile.id]: discountFireballProjectile,
};
