import type { FighterId } from '../core/BattleModes';
import type { EncounterPressureChannel } from '../core/EncounterDirector';

export type EnemyRoleId = 'pursuer' | 'flanker' | 'heavy' | 'zoner';

export type EnemyRoleContract = Readonly<{
  id: EnemyRoleId;
  label: string;
  preferredDistance: Readonly<{ minX: number; maxX: number }>;
  preferredLaneOffset: number;
  pressureChannels: Readonly<{ basic: EncounterPressureChannel; special: EncounterPressureChannel }>;
  entryBehavior: string;
  attackBehavior: string;
  recoveryBehavior: string;
  repositionBehavior: string;
  reactions: Readonly<{
    guard: string;
    evade: string;
    projectile: string;
    armorBreak: string;
    knockdown: string;
  }>;
  weakness: string;
  comedySignature: string;
  prototypeVisual: boolean;
}>;

export const enemyRoleContracts: Readonly<Record<EnemyRoleId, EnemyRoleContract>> = {
  pursuer: {
    id: 'pursuer', label: 'Grunt / Pursuer', preferredDistance: { minX: 38, maxX: 72 },
    preferredLaneOffset: 0, pressureChannels: { basic: 'melee', special: 'melee' },
    entryBehavior: 'Runs in from the visible forward edge after the shared entry lock.',
    attackBehavior: 'Closes quickly and commits to one short peck inside melee range.',
    recoveryBehavior: 'A missed peck overextends into a vulnerable stumble.',
    repositionBehavior: 'Circles out of token contention, then immediately pursues again.',
    reactions: {
      guard: 'G4: blocked peck enters the same vulnerable stumble.',
      evade: 'G4: an evaded peck counts as a whiff and overextends.',
      projectile: 'Low HP makes ranged control efficient.',
      armorBreak: 'No armor; heavy hits interrupt normally.',
      knockdown: 'G4: standard lightweight knockdown and wake-up.',
    },
    weakness: 'Low HP and a long punish window after a missed peck.',
    comedySignature: 'A missed peck carries the pigeon forward before it freezes in an embarrassed stumble.',
    prototypeVisual: false,
  },
  flanker: {
    id: 'flanker', label: 'Flanker / Disruptor', preferredDistance: { minX: 132, maxX: 230 },
    preferredLaneOffset: 74, pressureChannels: { basic: 'melee', special: 'disruption' },
    entryBehavior: 'Enters visibly on the opposite lane from its first flank target.',
    attackBehavior: 'Changes lane, aligns first, then signals and commits to a straight charge.',
    recoveryBehavior: 'A connected charge resets its flank; a miss causes a long crash.',
    repositionBehavior: 'Alternates lane side after each commitment instead of following directly.',
    reactions: {
      guard: 'G4: guard stops the charge and triggers the crash.',
      evade: 'G4: sidestepping the committed line guarantees the crash window.',
      projectile: 'Projectiles punish the long lateral setup.',
      armorBreak: 'No armor; interruption cancels the charge.',
      knockdown: 'G4: knockdown resets its chosen flank side.',
    },
    weakness: 'Its long, straight commitment is vulnerable to lane movement and interruption.',
    comedySignature: 'A missed charge ends in a visible scrapyard crash and extended vulnerable pause.',
    prototypeVisual: true,
  },
  heavy: {
    id: 'heavy', label: 'Heavy / Armor', preferredDistance: { minX: 54, maxX: 104 },
    preferredLaneOffset: 0, pressureChannels: { basic: 'melee', special: 'melee' },
    entryBehavior: 'Walks in slowly with two visible armor plates.',
    attackBehavior: 'Aligns deliberately and telegraphs a broad bulldog bash.',
    recoveryBehavior: 'Long recovery keeps the broad attack punishable.',
    repositionBehavior: 'Claims the player lane slowly rather than chasing every small movement.',
    reactions: {
      guard: 'G4: guarded bash keeps its recovery and spends the melee commitment.',
      evade: 'G4: evade clears the broad line and exposes recovery.',
      projectile: 'Two armored contacts remove its armor, so repeated ranged hits are a safe answer.',
      armorBreak: 'The second armored contact breaks both plates and permanently speeds up the now-vulnerable heavy.',
      knockdown: 'G4: only available after armor break; protected wake-up follows.',
    },
    weakness: 'Two deliberate hits strip armor; the long bash recovery then becomes fully interruptible.',
    comedySignature: 'Armor pops off after the second contact and the embarrassed heavy suddenly scurries faster.',
    prototypeVisual: true,
  },
  zoner: {
    id: 'zoner', label: 'Zoner', preferredDistance: { minX: 130, maxX: 280 },
    preferredLaneOffset: 0, pressureChannels: { basic: 'melee', special: 'ranged' },
    entryBehavior: 'Appears at visible projectile range under the shared entry lock.',
    attackBehavior: 'Maintains cast distance and signals every projectile before release.',
    recoveryBehavior: 'Retreats from melee; every third ranged commitment becomes a harmless miscast.',
    repositionBehavior: 'Corrects its lane at range and flees when crowded.',
    reactions: {
      guard: 'G4: blocked fireball still spends the ranged commitment.',
      evade: 'G4: evade beats the telegraphed projectile line.',
      projectile: 'Trades poorly at range because of low HP and expensive casts.',
      armorBreak: 'No armor; close attacks interrupt casts normally.',
      knockdown: 'G4: knockdown cancels pending projectile ownership.',
    },
    weakness: 'Low HP, expensive casts and poor close-range control.',
    comedySignature: 'Every third approved cast produces a harmless dud and leaves the wizard self-staggered.',
    prototypeVisual: false,
  },
};

export const fighterEnemyRoles: Partial<Record<FighterId, EnemyRoleId>> = {
  angry_pigeon: 'pursuer',
  scrap_flanker: 'flanker',
  scrap_heavy: 'heavy',
  discount_wizard: 'zoner',
};

/** Six pair proofs give every role two different partners without expanding G2 into G3's seven encounters. */
export const enemyRoleProofPairs: ReadonlyArray<readonly [EnemyRoleId, EnemyRoleId]> = [
  ['pursuer', 'flanker'], ['pursuer', 'zoner'], ['flanker', 'heavy'],
  ['flanker', 'zoner'], ['heavy', 'pursuer'], ['heavy', 'zoner'],
];

export function getEnemyRoleContract(roleId: EnemyRoleId): EnemyRoleContract {
  return enemyRoleContracts[roleId];
}

export function resolveEnemyRoleId(fighterId: string): EnemyRoleId {
  return fighterEnemyRoles[fighterId as FighterId] ?? 'pursuer';
}
