export type AttackDefinition = {
  id: string;
  label: string;
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  damage: number;
  hitstunMs: number;
  knockbackX: number;
  knockbackY: number;
  hitbox: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  canMoveDuringAttack?: boolean;
  canTurnDuringAttack?: boolean;
  manaCost?: number;
  projectileId?: string;
};

export const wombatJab: AttackDefinition = {
  id: 'wombat_jab',
  label: 'Jab',
  startupMs: 90,
  activeMs: 80,
  recoveryMs: 160,
  damage: 8,
  hitstunMs: 190,
  knockbackX: 130,
  knockbackY: 20,
  hitbox: {
    offsetX: 28,
    offsetY: -52,
    width: 42,
    height: 24,
  },
};

export const wombatBellySlam: AttackDefinition = {
  id: 'wombat_belly_slam',
  label: 'Belly Slam',
  startupMs: 220,
  activeMs: 140,
  recoveryMs: 360,
  damage: 18,
  hitstunMs: 420,
  knockbackX: 260,
  knockbackY: 80,
  hitbox: {
    offsetX: 24,
    offsetY: -56,
    width: 57,
    height: 38,
  },
  manaCost: 25,
};

export const wombatEarthshaker: AttackDefinition = {
  id: 'wombat_earthshaker',
  label: 'Earthshaker Nap Slam',
  startupMs: 240,
  activeMs: 190,
  recoveryMs: 520,
  damage: 28,
  hitstunMs: 560,
  knockbackX: 540,
  knockbackY: 165,
  hitbox: {
    offsetX: -180,
    offsetY: -132,
    width: 360,
    height: 184,
  },
  manaCost: 100,
};

export const pigeonPeck: AttackDefinition = {
  id: 'pigeon_peck',
  label: 'Peck',
  startupMs: 140,
  activeMs: 80,
  recoveryMs: 260,
  damage: 5,
  hitstunMs: 130,
  knockbackX: 80,
  knockbackY: 10,
  hitbox: {
    offsetX: 20,
    offsetY: -42,
    width: 33,
    height: 18,
  },
};

export const discountWandSmack: AttackDefinition = {
  id: 'discount_wand_smack',
  label: 'Wand Smack',
  startupMs: 105,
  activeMs: 80,
  recoveryMs: 175,
  damage: 6,
  hitstunMs: 145,
  knockbackX: 90,
  knockbackY: 8,
  hitbox: {
    offsetX: 24,
    offsetY: -50,
    width: 38,
    height: 28,
  },
};

export const discountFireballCast: AttackDefinition = {
  id: 'discount_fireball_cast',
  label: 'Discount Fireball',
  startupMs: 190,
  activeMs: 90,
  recoveryMs: 310,
  damage: 0,
  hitstunMs: 0,
  knockbackX: 0,
  knockbackY: 0,
  hitbox: {
    offsetX: 0,
    offsetY: 0,
    width: 1,
    height: 1,
  },
  manaCost: 22,
  projectileId: 'discount_fireball_projectile',
};

export const discountMiscast: AttackDefinition = {
  id: 'discount_miscast',
  label: 'Miscast',
  startupMs: 150,
  activeMs: 150,
  recoveryMs: 80,
  damage: 14,
  hitstunMs: 390,
  knockbackX: 220,
  knockbackY: 55,
  hitbox: {
    offsetX: -12,
    offsetY: -68,
    width: 118,
    height: 58,
  },
  canMoveDuringAttack: true,
};

export const discountClearanceOrb: AttackDefinition = {
  id: 'discount_clearance_orb',
  label: 'Clearance Orb',
  startupMs: 380,
  activeMs: 150,
  recoveryMs: 520,
  damage: 0,
  hitstunMs: 0,
  knockbackX: 0,
  knockbackY: 0,
  hitbox: {
    offsetX: 0,
    offsetY: 0,
    width: 1,
    height: 1,
  },
  manaCost: 100,
  projectileId: 'discount_ultimate_orb_projectile',
};

export const budgetCrackedAxeSwing: AttackDefinition = {
  id: 'budget_cracked_axe_swing',
  label: 'Cracked Axe Swing',
  startupMs: 150,
  activeMs: 105,
  recoveryMs: 245,
  damage: 12,
  hitstunMs: 225,
  knockbackX: 150,
  knockbackY: 18,
  hitbox: {
    offsetX: 28,
    offsetY: -56,
    width: 64,
    height: 32,
  },
};

export const budgetTinyRage: AttackDefinition = {
  id: 'budget_tiny_rage',
  label: 'Tiny Rage',
  startupMs: 270,
  activeMs: 85,
  recoveryMs: 430,
  damage: 22,
  hitstunMs: 460,
  knockbackX: 290,
  knockbackY: 72,
  hitbox: {
    offsetX: 22,
    offsetY: -58,
    width: 68,
    height: 42,
  },
  manaCost: 30,
};

export const budgetAxeRain: AttackDefinition = {
  id: 'budget_axe_rain',
  label: 'Warranty Void Axe Rain',
  startupMs: 330,
  activeMs: 620,
  recoveryMs: 540,
  damage: 0,
  hitstunMs: 0,
  knockbackX: 0,
  knockbackY: 0,
  hitbox: {
    offsetX: 0,
    offsetY: 0,
    width: 1,
    height: 1,
  },
  manaCost: 100,
};

export const busterUnderbiteJab: AttackDefinition = {
  id: 'buster_underbite_jab',
  label: 'Underbite Jab',
  startupMs: 110,
  activeMs: 90,
  recoveryMs: 190,
  damage: 9,
  hitstunMs: 200,
  knockbackX: 125,
  knockbackY: 16,
  hitbox: {
    offsetX: 28,
    offsetY: -46,
    width: 46,
    height: 28,
  },
};

export const busterBulldogBash: AttackDefinition = {
  id: 'buster_bulldog_bash',
  label: 'Bulldog Bash',
  startupMs: 180,
  activeMs: 120,
  recoveryMs: 300,
  damage: 14,
  hitstunMs: 340,
  knockbackX: 220,
  knockbackY: 46,
  hitbox: {
    offsetX: 22,
    offsetY: -52,
    width: 70,
    height: 38,
  },
  manaCost: 28,
};

export const busterUnderbiteBulldozer: AttackDefinition = {
  id: 'buster_underbite_bulldozer',
  label: 'Underbite Bulldozer',
  startupMs: 190,
  activeMs: 160,
  recoveryMs: 430,
  damage: 27,
  hitstunMs: 520,
  knockbackX: 340,
  knockbackY: 64,
  hitbox: {
    offsetX: 18,
    offsetY: -58,
    width: 122,
    height: 48,
  },
  manaCost: 100,
};

export const airBonk: AttackDefinition = {
  id: 'air_bonk',
  label: 'Air Bonk',
  startupMs: 80,
  activeMs: 120,
  recoveryMs: 140,
  damage: 7,
  hitstunMs: 165,
  knockbackX: 100,
  knockbackY: 22,
  hitbox: {
    offsetX: 18,
    offsetY: -26,
    width: 62,
    height: 92,
  },
  canTurnDuringAttack: false,
};

export const attacksById: Record<string, AttackDefinition> = {
  [wombatJab.id]: wombatJab,
  [wombatBellySlam.id]: wombatBellySlam,
  [wombatEarthshaker.id]: wombatEarthshaker,
  [pigeonPeck.id]: pigeonPeck,
  [discountWandSmack.id]: discountWandSmack,
  [discountFireballCast.id]: discountFireballCast,
  [discountMiscast.id]: discountMiscast,
  [discountClearanceOrb.id]: discountClearanceOrb,
  [budgetCrackedAxeSwing.id]: budgetCrackedAxeSwing,
  [budgetTinyRage.id]: budgetTinyRage,
  [budgetAxeRain.id]: budgetAxeRain,
  [busterUnderbiteJab.id]: busterUnderbiteJab,
  [busterBulldogBash.id]: busterBulldogBash,
  [busterUnderbiteBulldozer.id]: busterUnderbiteBulldozer,
  [airBonk.id]: airBonk,
};
