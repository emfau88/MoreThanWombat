import type { MoveTimelineDefinition } from '../combat/MoveTimeline';
import type { AttackHitboxProfile, LocalBox } from '../combat/BoxProfiles';

export type HitReaction = 'hitstun' | 'knockdown' | 'launch';

export type BasicChainWindow = Readonly<{
  inputOpenMs: number;
  inputCloseMs: number;
  hitCancelMs: number;
  whiffCancelMs: number;
}>;

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
  hitReaction?: HitReaction;
  guardBreak?: boolean;
  hitbox: LocalBox;
  hitboxProfile?: AttackHitboxProfile;
  areaHit?: {
    hitbox: LocalBox;
    laneTolerance: number;
    heightTolerance: number;
    damage: number;
    hitstunMs: number;
    knockbackX: number;
    knockbackY: number;
    hitReaction?: HitReaction;
  };
  canMoveDuringAttack?: boolean;
  canTurnDuringAttack?: boolean;
  forwardTravelSpeed?: number;
  basicChainWindow?: BasicChainWindow;
  manaCost?: number;
  projectileId?: string;
  knockbackMode?: 'facing' | 'radial';
  launchVelocityZ?: number;
  timeline?: MoveTimelineDefinition;
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
  hitboxProfile: {
    laneTolerance: 34,
    heightTolerance: 72,
    windows: [
      {
        id: 'early',
        startMs: 0,
        endMs: 24,
        boxes: [{ offsetX: 24, offsetY: -50, width: 34, height: 22 }],
      },
      {
        id: 'main',
        startMs: 24,
        endMs: 60,
        boxes: [{ offsetX: 28, offsetY: -54, width: 46, height: 30 }],
      },
      {
        id: 'late',
        startMs: 60,
        endMs: 80,
        boxes: [{ offsetX: 32, offsetY: -50, width: 34, height: 24 }],
      },
    ],
  },
  timeline: { feedbackClass: 'light' },
  basicChainWindow: { inputOpenMs: 125, inputCloseMs: 300, hitCancelMs: 215, whiffCancelMs: 290 },
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
  hitboxProfile: {
    laneTolerance: 44,
    heightTolerance: 82,
    windows: [
      {
        id: 'early',
        startMs: 0,
        endMs: 35,
        boxes: [{ offsetX: 18, offsetY: -52, width: 46, height: 34 }],
      },
      {
        id: 'main',
        startMs: 35,
        endMs: 105,
        boxes: [{ offsetX: 18, offsetY: -58, width: 68, height: 44 }],
      },
      {
        id: 'late',
        startMs: 105,
        endMs: 140,
        boxes: [{ offsetX: 10, offsetY: -54, width: 56, height: 38 }],
      },
    ],
  },
  manaCost: 25,
  hitReaction: 'knockdown',
  guardBreak: true,
  timeline: { feedbackClass: 'heavy' },
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
  knockbackMode: 'radial',
  launchVelocityZ: 500,
  hitReaction: 'launch',
  guardBreak: true,
  timeline: {
    feedbackClass: 'ultimate',
    startCue: 'wombat-earthshaker',
    hitstopMs: 105,
    shakeDurationMs: 118,
    shakeIntensity: 0.0072,
    defenderFlashMs: 64,
    hapticMs: 24,
  },
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
  timeline: { feedbackClass: 'light' },
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
  timeline: { feedbackClass: 'light', impactSparkStyle: 'magic', impactSound: 'magic' },
  basicChainWindow: { inputOpenMs: 130, inputCloseMs: 325, hitCancelMs: 225, whiffCancelMs: 315 },
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
  timeline: {
    feedbackClass: 'light',
    startCue: 'discount-fireball',
    impactSparkStyle: 'magic',
    impactSound: 'magic',
  },
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
  timeline: {
    feedbackClass: 'medium',
    startCue: 'discount-miscast',
    impactSparkStyle: 'magic',
    impactSound: 'magic',
  },
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
  timeline: {
    feedbackClass: 'ultimate',
    startCue: 'discount-clearance-orb',
    impactSparkStyle: 'magic',
    impactSound: 'magic',
  },
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
  timeline: { feedbackClass: 'medium' },
  basicChainWindow: { inputOpenMs: 180, inputCloseMs: 455, hitCancelMs: 315, whiffCancelMs: 445 },
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
  hitReaction: 'knockdown',
  guardBreak: true,
  timeline: { feedbackClass: 'heavy' },
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
  areaHit: {
    hitbox: { offsetX: -48, offsetY: -82, width: 96, height: 96 },
    laneTolerance: 18,
    heightTolerance: 130,
    damage: 13,
    hitstunMs: 300,
    knockbackX: 135,
    knockbackY: 58,
    hitReaction: 'knockdown',
  },
  manaCost: 100,
  timeline: { feedbackClass: 'ultimate', startCue: 'budget-axe-rain' },
};

export const maraGateKick: AttackDefinition = {
  id: 'mara_gate_kick',
  label: 'Gate Kick',
  startupMs: 95,
  activeMs: 78,
  recoveryMs: 185,
  damage: 8,
  hitstunMs: 185,
  knockbackX: 142,
  knockbackY: 16,
  hitbox: {
    offsetX: 24,
    offsetY: -58,
    width: 62,
    height: 28,
  },
  hitboxProfile: {
    laneTolerance: 34,
    heightTolerance: 76,
    windows: [
      { id: 'early', startMs: 0, endMs: 24, boxes: [{ offsetX: 20, offsetY: -56, width: 38, height: 24 }] },
      { id: 'main', startMs: 24, endMs: 58, boxes: [{ offsetX: 26, offsetY: -60, width: 66, height: 30 }] },
      { id: 'late', startMs: 58, endMs: 78, boxes: [{ offsetX: 30, offsetY: -56, width: 48, height: 24 }] },
    ],
  },
  timeline: { feedbackClass: 'light' },
  basicChainWindow: { inputOpenMs: 125, inputCloseMs: 325, hitCancelMs: 220, whiffCancelMs: 315 },
};

export const maraBreachStep: AttackDefinition = {
  id: 'mara_breach_step',
  label: 'Breach Step',
  startupMs: 155,
  activeMs: 115,
  recoveryMs: 280,
  damage: 15,
  hitstunMs: 330,
  knockbackX: 230,
  knockbackY: 42,
  hitbox: {
    offsetX: 22,
    offsetY: -60,
    width: 92,
    height: 36,
  },
  hitboxProfile: {
    laneTolerance: 38,
    heightTolerance: 80,
    windows: [
      { id: 'early', startMs: 0, endMs: 35, boxes: [{ offsetX: 18, offsetY: -56, width: 56, height: 30 }] },
      { id: 'main', startMs: 35, endMs: 92, boxes: [{ offsetX: 28, offsetY: -62, width: 96, height: 40 }] },
      { id: 'late', startMs: 92, endMs: 115, boxes: [{ offsetX: 22, offsetY: -58, width: 66, height: 30 }] },
    ],
  },
  manaCost: 28,
  timeline: { feedbackClass: 'medium', startCue: 'mara-breach-step' },
};

export const maraRedLineBarrage: AttackDefinition = {
  id: 'mara_red_line_barrage',
  label: 'Red-Line Barrage',
  startupMs: 275,
  activeMs: 150,
  recoveryMs: 460,
  damage: 27,
  hitstunMs: 535,
  knockbackX: 360,
  knockbackY: 88,
  hitbox: {
    offsetX: 18,
    offsetY: -78,
    width: 132,
    height: 66,
  },
  hitboxProfile: {
    laneTolerance: 44,
    heightTolerance: 92,
    windows: [
      { id: 'early', startMs: 0, endMs: 42, boxes: [{ offsetX: 20, offsetY: -64, width: 78, height: 42 }] },
      { id: 'main', startMs: 42, endMs: 116, boxes: [{ offsetX: 28, offsetY: -82, width: 142, height: 70 }] },
      { id: 'late', startMs: 116, endMs: 150, boxes: [{ offsetX: 18, offsetY: -70, width: 92, height: 52 }] },
    ],
  },
  manaCost: 100,
  launchVelocityZ: 330,
  hitReaction: 'launch',
  guardBreak: true,
  timeline: {
    feedbackClass: 'ultimate',
    startCue: 'mara-red-line-barrage',
    hitstopMs: 96,
    shakeDurationMs: 102,
    shakeIntensity: 0.0058,
    defenderFlashMs: 62,
    hapticMs: 22,
  },
};

export const wombatPawBackhand: AttackDefinition = {
  id: 'wombat_paw_backhand', label: 'Paw Backhand',
  startupMs: 105, activeMs: 85, recoveryMs: 185,
  damage: 9, hitstunMs: 205, knockbackX: 145, knockbackY: -18,
  hitbox: { offsetX: 22, offsetY: -58, width: 58, height: 30 },
  forwardTravelSpeed: 54,
  basicChainWindow: { inputOpenMs: 145, inputCloseMs: 335, hitCancelMs: 235, whiffCancelMs: 325 },
  timeline: { feedbackClass: 'light' },
};

export const wombatHeadbuttFinisher: AttackDefinition = {
  id: 'wombat_headbutt_finisher', label: 'Warranty Headbutt',
  startupMs: 145, activeMs: 105, recoveryMs: 320,
  damage: 14, hitstunMs: 330, knockbackX: 255, knockbackY: 42,
  hitReaction: 'knockdown',
  hitbox: { offsetX: 24, offsetY: -62, width: 70, height: 40 },
  forwardTravelSpeed: 78,
  timeline: { feedbackClass: 'medium' },
};

export const wombatRushingBonk: AttackDefinition = {
  id: 'wombat_rushing_bonk', label: 'Commuter Bonk',
  startupMs: 115, activeMs: 120, recoveryMs: 300,
  damage: 12, hitstunMs: 260, knockbackX: 225, knockbackY: 30,
  hitbox: { offsetX: 26, offsetY: -62, width: 76, height: 42 },
  forwardTravelSpeed: 315, canTurnDuringAttack: false,
  timeline: { feedbackClass: 'medium' },
};

export const discountWandRebound: AttackDefinition = {
  id: 'discount_wand_rebound', label: 'Wand Rebound',
  startupMs: 105, activeMs: 80, recoveryMs: 190,
  damage: 7, hitstunMs: 165, knockbackX: 115, knockbackY: -15,
  hitbox: { offsetX: 20, offsetY: -64, width: 56, height: 34 },
  forwardTravelSpeed: 42,
  basicChainWindow: { inputOpenMs: 140, inputCloseMs: 335, hitCancelMs: 225, whiffCancelMs: 325 },
  timeline: { feedbackClass: 'light', impactSparkStyle: 'magic', impactSound: 'magic' },
};

export const discountReceiptStamp: AttackDefinition = {
  id: 'discount_receipt_stamp', label: 'Receipt Stamp',
  startupMs: 145, activeMs: 100, recoveryMs: 330,
  damage: 11, hitstunMs: 285, knockbackX: 225, knockbackY: 36,
  hitReaction: 'knockdown',
  hitbox: { offsetX: 20, offsetY: -60, width: 74, height: 42 },
  forwardTravelSpeed: 60,
  timeline: { feedbackClass: 'medium', impactSparkStyle: 'magic', impactSound: 'magic' },
};

export const discountBroomBump: AttackDefinition = {
  id: 'discount_broom_bump', label: 'Clearance Broom Bump',
  startupMs: 125, activeMs: 110, recoveryMs: 315,
  damage: 10, hitstunMs: 245, knockbackX: 205, knockbackY: 26,
  hitbox: { offsetX: 24, offsetY: -62, width: 80, height: 40 },
  forwardTravelSpeed: 330, canTurnDuringAttack: false,
  timeline: { feedbackClass: 'medium', impactSparkStyle: 'magic', impactSound: 'magic' },
};

export const budgetAxeBackstroke: AttackDefinition = {
  id: 'budget_axe_backstroke', label: 'Axe Backstroke',
  startupMs: 165, activeMs: 110, recoveryMs: 260,
  damage: 13, hitstunMs: 240, knockbackX: 170, knockbackY: -20,
  hitbox: { offsetX: 16, offsetY: -68, width: 82, height: 42 },
  forwardTravelSpeed: 38,
  basicChainWindow: { inputOpenMs: 210, inputCloseMs: 485, hitCancelMs: 330, whiffCancelMs: 475 },
  timeline: { feedbackClass: 'medium' },
};

export const budgetHandleDrop: AttackDefinition = {
  id: 'budget_handle_drop', label: 'Handle With Care',
  startupMs: 205, activeMs: 125, recoveryMs: 390,
  damage: 18, hitstunMs: 385, knockbackX: 290, knockbackY: 54,
  hitReaction: 'knockdown',
  hitbox: { offsetX: 18, offsetY: -72, width: 92, height: 50 },
  forwardTravelSpeed: 52,
  timeline: { feedbackClass: 'heavy' },
};

export const budgetShoulderCharge: AttackDefinition = {
  id: 'budget_shoulder_charge', label: 'Budget Shoulder Delivery',
  startupMs: 150, activeMs: 130, recoveryMs: 370,
  damage: 15, hitstunMs: 315, knockbackX: 275, knockbackY: 42,
  hitbox: { offsetX: 22, offsetY: -66, width: 92, height: 46 },
  forwardTravelSpeed: 295, canTurnDuringAttack: false,
  timeline: { feedbackClass: 'heavy' },
};

export const maraElbowCheck: AttackDefinition = {
  id: 'mara_elbow_check', label: 'Elbow Check',
  startupMs: 90, activeMs: 75, recoveryMs: 175,
  damage: 9, hitstunMs: 205, knockbackX: 150, knockbackY: -16,
  hitbox: { offsetX: 20, offsetY: -62, width: 62, height: 32 },
  forwardTravelSpeed: 82,
  basicChainWindow: { inputOpenMs: 115, inputCloseMs: 300, hitCancelMs: 205, whiffCancelMs: 290 },
  timeline: { feedbackClass: 'light' },
};

export const maraBootOut: AttackDefinition = {
  id: 'mara_boot_out', label: 'Emergency Exit Boot',
  startupMs: 125, activeMs: 95, recoveryMs: 285,
  damage: 14, hitstunMs: 325, knockbackX: 270, knockbackY: 44,
  hitReaction: 'knockdown',
  hitbox: { offsetX: 26, offsetY: -64, width: 88, height: 38 },
  forwardTravelSpeed: 108,
  timeline: { feedbackClass: 'medium' },
};

export const maraGateCrasher: AttackDefinition = {
  id: 'mara_gate_crasher', label: 'Express Gate Crasher',
  startupMs: 90, activeMs: 120, recoveryMs: 275,
  damage: 12, hitstunMs: 275, knockbackX: 245, knockbackY: 34,
  hitbox: { offsetX: 24, offsetY: -64, width: 96, height: 40 },
  forwardTravelSpeed: 380, canTurnDuringAttack: false,
  timeline: { feedbackClass: 'medium' },
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
  timeline: { feedbackClass: 'light' },
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
  timeline: { feedbackClass: 'medium' },
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
  hitReaction: 'knockdown',
  guardBreak: true,
  timeline: { feedbackClass: 'ultimate', startCue: 'buster-bulldozer' },
};

export const scrapFlankerCharge: AttackDefinition = {
  id: 'scrap_flanker_charge',
  label: 'Scrapline Charge [PROTO]',
  startupMs: 320,
  activeMs: 180,
  recoveryMs: 220,
  damage: 11,
  hitstunMs: 310,
  knockbackX: 230,
  knockbackY: 34,
  hitbox: { offsetX: 18, offsetY: -55, width: 94, height: 42 },
  hitboxProfile: {
    laneTolerance: 30,
    heightTolerance: 86,
    windows: [{ id: 'charge', startMs: 0, endMs: 180,
      boxes: [{ offsetX: 18, offsetY: -55, width: 94, height: 42 }] }],
  },
  canMoveDuringAttack: true,
  canTurnDuringAttack: false,
  hitReaction: 'knockdown',
  timeline: { feedbackClass: 'medium' },
};

export const scrapHeavyBash: AttackDefinition = {
  id: 'scrap_heavy_bash',
  label: 'Armored Scrap Bash [PROTO]',
  startupMs: 420,
  activeMs: 150,
  recoveryMs: 520,
  damage: 16,
  hitstunMs: 380,
  knockbackX: 285,
  knockbackY: 58,
  hitbox: { offsetX: 18, offsetY: -58, width: 104, height: 48 },
  hitboxProfile: {
    laneTolerance: 38,
    heightTolerance: 92,
    windows: [{ id: 'main', startMs: 0, endMs: 150,
      boxes: [{ offsetX: 18, offsetY: -58, width: 104, height: 48 }] }],
  },
  canTurnDuringAttack: false,
  hitReaction: 'knockdown',
  timeline: { feedbackClass: 'heavy' },
};

export const foremanClipboardCheck: AttackDefinition = {
  id: 'foreman_clipboard_check',
  label: 'Clipboard Compliance Check',
  startupMs: 190,
  activeMs: 100,
  recoveryMs: 260,
  damage: 10,
  hitstunMs: 240,
  knockbackX: 170,
  knockbackY: 24,
  hitbox: { offsetX: 20, offsetY: -58, width: 82, height: 38 },
  canTurnDuringAttack: false,
  timeline: { feedbackClass: 'medium' },
};

export const foremanForkliftCharge: AttackDefinition = {
  id: 'foreman_forklift_charge',
  label: 'Forklift Certification Pending',
  startupMs: 520,
  activeMs: 220,
  recoveryMs: 620,
  damage: 15,
  hitstunMs: 350,
  knockbackX: 300,
  knockbackY: 42,
  hitbox: { offsetX: 18, offsetY: -60, width: 112, height: 48 },
  forwardTravelSpeed: 310,
  canTurnDuringAttack: false,
  hitReaction: 'knockdown',
  guardBreak: true,
  timeline: { feedbackClass: 'heavy' },
};

export const foremanSteamWhistle: AttackDefinition = {
  id: 'foreman_steam_whistle',
  label: 'Mandatory Safety Drill',
  startupMs: 560,
  activeMs: 80,
  recoveryMs: 480,
  damage: 0,
  hitstunMs: 0,
  knockbackX: 0,
  knockbackY: 0,
  hitbox: { offsetX: 10000, offsetY: 10000, width: 1, height: 1 },
  canTurnDuringAttack: false,
  timeline: { feedbackClass: 'medium' },
};

export const discountEnemyMiscast: AttackDefinition = {
  id: 'discount_enemy_miscast',
  label: 'Harmless Discount Dud',
  startupMs: 180,
  activeMs: 120,
  recoveryMs: 120,
  damage: 0,
  hitstunMs: 0,
  knockbackX: 0,
  knockbackY: 0,
  hitbox: { offsetX: 10000, offsetY: 10000, width: 1, height: 1 },
  manaCost: 22,
  timeline: { feedbackClass: 'light', startCue: 'discount-miscast', impactSparkStyle: 'magic' },
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
  hitboxProfile: {
    laneTolerance: 46,
    heightTolerance: 170,
    windows: [
      {
        id: 'main',
        startMs: 0,
        endMs: 120,
        boxes: [{ offsetX: 18, offsetY: -26, width: 62, height: 92 }],
      },
    ],
  },
  canMoveDuringAttack: true,
  canTurnDuringAttack: true,
  timeline: { feedbackClass: 'light' },
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
  [maraGateKick.id]: maraGateKick,
  [maraBreachStep.id]: maraBreachStep,
  [maraRedLineBarrage.id]: maraRedLineBarrage,
  [wombatPawBackhand.id]: wombatPawBackhand,
  [wombatHeadbuttFinisher.id]: wombatHeadbuttFinisher,
  [wombatRushingBonk.id]: wombatRushingBonk,
  [discountWandRebound.id]: discountWandRebound,
  [discountReceiptStamp.id]: discountReceiptStamp,
  [discountBroomBump.id]: discountBroomBump,
  [budgetAxeBackstroke.id]: budgetAxeBackstroke,
  [budgetHandleDrop.id]: budgetHandleDrop,
  [budgetShoulderCharge.id]: budgetShoulderCharge,
  [maraElbowCheck.id]: maraElbowCheck,
  [maraBootOut.id]: maraBootOut,
  [maraGateCrasher.id]: maraGateCrasher,
  [busterUnderbiteJab.id]: busterUnderbiteJab,
  [busterBulldogBash.id]: busterBulldogBash,
  [busterUnderbiteBulldozer.id]: busterUnderbiteBulldozer,
  [scrapFlankerCharge.id]: scrapFlankerCharge,
  [scrapHeavyBash.id]: scrapHeavyBash,
  [foremanClipboardCheck.id]: foremanClipboardCheck,
  [foremanForkliftCharge.id]: foremanForkliftCharge,
  [foremanSteamWhistle.id]: foremanSteamWhistle,
  [discountEnemyMiscast.id]: discountEnemyMiscast,
  [airBonk.id]: airBonk,
};
