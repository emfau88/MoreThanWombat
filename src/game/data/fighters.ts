import type { FighterDefinition } from '../combat/Fighter';
import type { FighterBoxProfiles, LocalBox } from '../combat/BoxProfiles';
import type { FighterId } from '../core/BattleModes';

function createHurtboxProfiles(base: LocalBox): FighterBoxProfiles {
  return {
    standing: base,
    moving: {
      offsetX: base.offsetX + 2,
      offsetY: base.offsetY + 1,
      width: base.width - 4,
      height: base.height - 1,
    },
    attacking: base,
    airborne: {
      offsetX: base.offsetX + 3,
      offsetY: base.offsetY + 5,
      width: base.width - 6,
      height: base.height - 8,
    },
    hit: {
      offsetX: base.offsetX - 2,
      offsetY: base.offsetY + 3,
      width: base.width + 4,
      height: base.height - 3,
    },
    knockdown: null,
  };
}

function createPushboxProfiles(base: LocalBox): FighterBoxProfiles {
  return {
    standing: base,
    moving: base,
    attacking: base,
    airborne: null,
    hit: base,
    knockdown: null,
  };
}

function createFighterBoxProfiles(hurtbox: LocalBox, pushbox: LocalBox): Pick<FighterDefinition, 'hurtboxProfiles' | 'pushboxProfiles'> {
  return {
    hurtboxProfiles: createHurtboxProfiles(hurtbox),
    pushboxProfiles: createPushboxProfiles(pushbox),
  };
}

export const wombatDefinition: FighterDefinition = {
  id: 'wombat',
  label: 'Wombat',
  fillColor: 0xa67c52,
  outlineColor: 0x3c2a1e,
  maxHp: 100,
  maxMana: 100,
  manaRegenPerSecond: 4.5,
  moveSpeed: 187,
  width: 54,
  height: 68,
  hurtbox: {
    offsetX: -20,
    offsetY: -60,
    width: 40,
    height: 56,
  },
  pushbox: {
    offsetX: -16,
    offsetY: -22,
    width: 32,
    height: 20,
  },
  ...createFighterBoxProfiles(
    { offsetX: -20, offsetY: -60, width: 40, height: 56 },
    { offsetX: -16, offsetY: -22, width: 32, height: 20 },
  ),
  attacks: {
    basic: 'wombat_jab',
    special: 'wombat_belly_slam',
    ultimate: 'wombat_earthshaker',
  },
  sprite: {
    textureKey: 'wombat',
    scale: 0.86,
    animations: {
      idle: 'wombat-idle',
      walk: 'wombat-walk',
      attack: 'wombat-jab',
      special: 'wombat-belly-slam',
      hitstun: 'wombat-hit',
      dead: 'wombat-dead',
    },
    attackAnimations: {
      air_bonk: 'wombat-air-bonk',
      wombat_earthshaker: 'wombat-belly-slam',
    },
  },
};

export const angryPigeonDefinition: FighterDefinition = {
  id: 'angry_pigeon',
  label: 'Angry Pigeon',
  fillColor: 0x7d8597,
  outlineColor: 0x1f2937,
  maxHp: 64,
  maxMana: 70,
  manaRegenPerSecond: 4,
  moveSpeed: 130,
  width: 46,
  height: 62,
  hurtbox: {
    offsetX: -18,
    offsetY: -54,
    width: 36,
    height: 50,
  },
  pushbox: {
    offsetX: -15,
    offsetY: -20,
    width: 30,
    height: 18,
  },
  ...createFighterBoxProfiles(
    { offsetX: -18, offsetY: -54, width: 36, height: 50 },
    { offsetX: -15, offsetY: -20, width: 30, height: 18 },
  ),
  attacks: {
    basic: 'pigeon_peck',
  },
  sprite: {
    textureKey: 'angry-pigeon',
    scale: 0.82,
    animations: {
      idle: 'angry-pigeon-idle',
      walk: 'angry-pigeon-walk',
      attack: 'angry-pigeon-peck',
      special: 'angry-pigeon-peck',
      hitstun: 'angry-pigeon-hit',
      dead: 'angry-pigeon-dead',
    },
  },
};

export const discountWizardDefinition: FighterDefinition = {
  id: 'discount_wizard',
  label: 'Discount Wizard',
  fillColor: 0x2c7a8c,
  outlineColor: 0x17202a,
  maxHp: 76,
  maxMana: 115,
  manaRegenPerSecond: 6,
  moveSpeed: 149,
  width: 46,
  height: 70,
  hurtbox: {
    offsetX: -17,
    offsetY: -62,
    width: 34,
    height: 58,
  },
  pushbox: {
    offsetX: -14,
    offsetY: -22,
    width: 28,
    height: 20,
  },
  ...createFighterBoxProfiles(
    { offsetX: -17, offsetY: -62, width: 34, height: 58 },
    { offsetX: -14, offsetY: -22, width: 28, height: 20 },
  ),
  attacks: {
    basic: 'discount_wand_smack',
    special: 'discount_fireball_cast',
    ultimate: 'discount_clearance_orb',
  },
  sprite: {
    textureKey: 'discount-wizard',
    scale: 0.9,
    animations: {
      idle: 'discount-wizard-idle',
      walk: 'discount-wizard-walk',
      attack: 'discount-wizard-fireball',
      special: 'discount-wizard-miscast',
      hitstun: 'discount-wizard-hit',
      dead: 'discount-wizard-dead',
    },
    attackAnimations: {
      discount_wand_smack: 'discount-wizard-fireball',
      discount_fireball_cast: 'discount-wizard-fireball',
      discount_miscast: 'discount-wizard-miscast',
      discount_clearance_orb: 'discount-wizard-fireball',
    },
  },
};

export const budgetBarbarianDefinition: FighterDefinition = {
  id: 'budget_barbarian',
  label: 'Budget Barbarian',
  fillColor: 0xb8793a,
  outlineColor: 0x2b1a10,
  maxHp: 112,
  maxMana: 100,
  manaRegenPerSecond: 4,
  moveSpeed: 134,
  width: 58,
  height: 70,
  hurtbox: {
    offsetX: -22,
    offsetY: -62,
    width: 44,
    height: 58,
  },
  pushbox: {
    offsetX: -18,
    offsetY: -22,
    width: 36,
    height: 20,
  },
  ...createFighterBoxProfiles(
    { offsetX: -22, offsetY: -62, width: 44, height: 58 },
    { offsetX: -18, offsetY: -22, width: 36, height: 20 },
  ),
  attacks: {
    basic: 'budget_cracked_axe_swing',
    special: 'budget_tiny_rage',
    ultimate: 'budget_axe_rain',
  },
  sprite: {
    textureKey: 'budget-barbarian',
    scale: 0.9,
    animations: {
      idle: 'budget-barbarian-idle',
      walk: 'budget-barbarian-walk',
      attack: 'budget-barbarian-axe-swing',
      special: 'budget-barbarian-tiny-rage',
      jump: 'budget-barbarian-jump',
      fall: 'budget-barbarian-fall',
      landing: 'budget-barbarian-landing',
      hitstun: 'budget-barbarian-hit',
      dead: 'budget-barbarian-dead',
    },
    attackAnimations: {
      air_bonk: 'budget-barbarian-air-bonk',
      budget_axe_rain: 'budget-barbarian-tiny-rage',
    },
  },
};

export const busterBulldogDefinition: FighterDefinition = {
  id: 'buster_bulldog',
  label: 'Buster Bulldog',
  fillColor: 0xb87834,
  outlineColor: 0x24150f,
  maxHp: 125,
  maxMana: 85,
  manaRegenPerSecond: 3.5,
  moveSpeed: 138,
  width: 62,
  height: 58,
  hurtbox: {
    offsetX: -26,
    offsetY: -52,
    width: 52,
    height: 48,
  },
  pushbox: {
    offsetX: -20,
    offsetY: -20,
    width: 40,
    height: 18,
  },
  ...createFighterBoxProfiles(
    { offsetX: -26, offsetY: -52, width: 52, height: 48 },
    { offsetX: -20, offsetY: -20, width: 40, height: 18 },
  ),
  attacks: {
    basic: 'buster_underbite_jab',
    special: 'buster_bulldog_bash',
    ultimate: 'buster_underbite_bulldozer',
  },
  sprite: {
    textureKey: 'buster-bulldog',
    scale: 1.02,
    animations: {
      idle: 'buster-bulldog-idle',
      walk: 'buster-bulldog-walk',
      attack: 'buster-bulldog-underbite-jab',
      special: 'buster-bulldog-bash',
      hitstun: 'buster-bulldog-hit',
      dead: 'buster-bulldog-dead',
    },
    attackAnimations: {
      air_bonk: 'buster-bulldog-air-bonk',
      buster_underbite_bulldozer: 'buster-bulldog-bash',
    },
    attackScaleOverrides: {
      buster_underbite_bulldozer: 1.08,
    },
  },
};

export const referenceFighterDefinition: FighterDefinition = {
  id: 'reference_fighter',
  label: 'Reference Fighter',
  fillColor: 0x2f66d8,
  outlineColor: 0x101820,
  maxHp: 100,
  maxMana: 100,
  manaRegenPerSecond: 5,
  moveSpeed: 182,
  width: 44,
  height: 64,
  hurtbox: {
    offsetX: -16,
    offsetY: -58,
    width: 32,
    height: 54,
  },
  pushbox: {
    offsetX: -13,
    offsetY: -20,
    width: 26,
    height: 18,
  },
  ...createFighterBoxProfiles(
    { offsetX: -16, offsetY: -58, width: 32, height: 54 },
    { offsetX: -13, offsetY: -20, width: 26, height: 18 },
  ),
  attacks: {
    basic: 'buster_underbite_jab',
    special: 'buster_bulldog_bash',
  },
  sprite: {
    textureKey: 'reference-fighter',
    scale: 1.32,
    animations: {
      idle: 'reference-fighter-idle',
      walk: 'reference-fighter-walk',
      attack: 'reference-fighter-basic',
      special: 'reference-fighter-special',
      jump: 'reference-fighter-jump',
      fall: 'reference-fighter-fall',
      landing: 'reference-fighter-landing',
      hitstun: 'reference-fighter-hit',
      dead: 'reference-fighter-dead',
    },
    attackAnimations: {
      air_bonk: 'reference-fighter-air-bonk',
      buster_underbite_jab: 'reference-fighter-basic',
      buster_bulldog_bash: 'reference-fighter-special',
    },
  },
};

export const fighterDefinitions: Record<FighterId, FighterDefinition> = {
  wombat: wombatDefinition,
  angry_pigeon: angryPigeonDefinition,
  discount_wizard: discountWizardDefinition,
  budget_barbarian: budgetBarbarianDefinition,
  buster_bulldog: busterBulldogDefinition,
  reference_fighter: referenceFighterDefinition,
};
