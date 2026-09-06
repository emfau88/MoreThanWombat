import type { CombatResponse } from '../combat/CombatResolver';
import type { FighterFacing, FighterState, AttackPhase } from '../combat/Fighter';
import type { EncounterPressureChannel } from '../core/EncounterDirector';
import { getEnemyRoleContract, resolveEnemyRoleId, type EnemyRoleId } from './EnemyRoles';

export type EnemyAiState = 'idle' | 'approach' | 'flank' | 'telegraph' | 'attack' | 'recover'
  | 'reposition' | 'comic_whiff' | 'comic_crash' | 'comic_miscast' | 'armor_break';
export type EnemyAttackKind = 'basic' | 'special';
export type EnemyAttackPermission = (kind: EnemyAttackKind) => boolean;

export type EnemyIntent = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  attackKind: EnemyAttackKind;
  attackId?: string;
  state: EnemyAiState;
};

export type EnemyRoleActor = {
  id: string;
  instanceId: number;
  x: number;
  y: number;
  facing: FighterFacing;
  state: FighterState;
  isGrounded: boolean;
  getCurrentAttack(): { id: string } | null;
  getAttackPhase(): AttackPhase;
};

export type EnemyRolePresentation = Readonly<{ cue: string; tint?: number }>;

const IDLE_INTENT: EnemyIntent = {
  moveX: 0, moveY: 0, attackPressed: false, attackKind: 'basic', state: 'idle',
};
const ATTACK_RANGE_Y = 28;
const GLOBAL_REPOSITION_SPEED = 0.52;
const FLANK_LANE_TOLERANCE = 18;
const HEAVY_ARMOR_CONTACTS = 2;

/** Role-aware, deterministic AI. Its structural actor contract keeps decisions testable without Phaser. */
export class EnemyController {
  private readonly configuredRoleId?: EnemyRoleId;
  private recoveryRemainingMs = 0;
  private roleStateRemainingMs = 0;
  private roleState: EnemyAiState | null = null;
  private trackedAttackId: string | null = null;
  private trackedAttackConnected = false;
  private flankLaneSide: -1 | 1;
  private flankHorizontalSide: -1 | 1 = 1;
  private zonerRangedCommitments = 0;
  private heavyArmorContacts = 0;
  private heavyArmorBroken = false;

  constructor(roleId?: EnemyRoleId, seed = 1) {
    this.configuredRoleId = roleId;
    this.flankLaneSide = seed % 2 === 0 ? -1 : 1;
  }

  getRoleId(actor?: Pick<EnemyRoleActor, 'id'>): EnemyRoleId {
    return this.configuredRoleId ?? resolveEnemyRoleId(actor?.id ?? 'angry_pigeon');
  }

  getPressureChannel(kind: EnemyAttackKind, actor?: Pick<EnemyRoleActor, 'id'>): EncounterPressureChannel {
    return getEnemyRoleContract(this.getRoleId(actor)).pressureChannels[kind];
  }

  getCombatResponse(actor?: Pick<EnemyRoleActor, 'id'>): CombatResponse {
    return this.getRoleId(actor) === 'heavy' && !this.heavyArmorBroken ? 'armor' : 'normal';
  }

  notifyAttackConnected(): void {
    if (this.trackedAttackId) this.trackedAttackConnected = true;
  }

  /** Returns true exactly once when a heavy loses its armor. */
  notifyArmoredContact(actor?: Pick<EnemyRoleActor, 'id'>): boolean {
    if (this.getRoleId(actor) !== 'heavy' || this.heavyArmorBroken) return false;
    this.heavyArmorContacts += 1;
    if (this.heavyArmorContacts < HEAVY_ARMOR_CONTACTS) return false;
    this.heavyArmorBroken = true;
    this.enterRoleState('armor_break', 720);
    return true;
  }

  getPresentation(actor: Pick<EnemyRoleActor, 'id' | 'getCurrentAttack' | 'getAttackPhase'>): EnemyRolePresentation {
    const roleId = this.getRoleId(actor);
    if (roleId === 'heavy' && !this.heavyArmorBroken) {
      return { cue: `ARMOR ${'◆'.repeat(HEAVY_ARMOR_CONTACTS - this.heavyArmorContacts)}`, tint: 0xffc15c };
    }
    if (this.roleState === 'armor_break') return { cue: 'ARMOR BREAK!', tint: 0xff6b57 };
    if (this.roleState === 'comic_whiff') return { cue: 'WHOOPS!', tint: 0xffd166 };
    if (this.roleState === 'comic_crash') return { cue: 'CRASH!', tint: 0xff7043 };
    if (this.roleState === 'comic_miscast') return { cue: 'DUD!', tint: 0xb892ff };
    const attack = actor.getCurrentAttack();
    if (attack?.id === 'scrap_flanker_charge' && actor.getAttackPhase() === 'startup') {
      return { cue: 'CHARGE →', tint: 0xffa62b };
    }
    if (roleId === 'zoner' && attack && actor.getAttackPhase() === 'startup') {
      return { cue: attack.id === 'discount_enemy_miscast' ? 'DUD?' : 'CAST', tint: 0x8be9fd };
    }
    if (roleId === 'heavy' && this.heavyArmorBroken) return { cue: 'EXPOSED', tint: 0xff8b73 };
    return { cue: '' };
  }

  getDebugSnapshot(actor?: Pick<EnemyRoleActor, 'id'>): Readonly<{
    roleId: EnemyRoleId; state: EnemyAiState | null; armorContacts: number;
    armorBroken: boolean; rangedCommitments: number;
  }> {
    return {
      roleId: this.getRoleId(actor), state: this.roleState,
      armorContacts: this.heavyArmorContacts, armorBroken: this.heavyArmorBroken,
      rangedCommitments: this.zonerRangedCommitments,
    };
  }

  update(enemy: EnemyRoleActor, target: EnemyRoleActor, deltaSeconds: number,
    requestAttack: EnemyAttackPermission = () => true): EnemyIntent {
    const deltaMs = Math.max(0, deltaSeconds * 1000);
    this.observeAttackLifecycle(enemy);

    if (enemy.state === 'dead' || target.state === 'dead') return IDLE_INTENT;
    if (enemy.state === 'hitstun') {
      this.clearInterruptedAttack();
      return IDLE_INTENT;
    }

    const currentAttack = enemy.getCurrentAttack();
    if (currentAttack) return this.getActiveAttackIntent(enemy, currentAttack.id);

    if (this.roleState && this.roleStateRemainingMs > 0) {
      this.roleStateRemainingMs = Math.max(0, this.roleStateRemainingMs - deltaMs);
      const intent = this.getRoleStateIntent(enemy);
      if (this.roleStateRemainingMs === 0) this.roleState = null;
      return intent;
    }

    if (this.recoveryRemainingMs > 0) {
      this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaMs);
      return { ...IDLE_INTENT, state: 'recover' };
    }

    switch (this.getRoleId(enemy)) {
      case 'flanker': return this.updateFlanker(enemy, target, requestAttack);
      case 'heavy': return this.updateHeavy(enemy, target, requestAttack);
      case 'zoner': return this.updateZoner(enemy, target, requestAttack);
      default: return this.updatePursuer(enemy, target, requestAttack);
    }
  }

  private observeAttackLifecycle(enemy: EnemyRoleActor): void {
    const currentAttackId = enemy.getCurrentAttack()?.id ?? null;
    if (currentAttackId) {
      if (currentAttackId !== this.trackedAttackId) {
        this.trackedAttackId = currentAttackId;
        this.trackedAttackConnected = false;
      }
      return;
    }
    if (!this.trackedAttackId) return;
    const finishedAttackId = this.trackedAttackId;
    const didConnect = this.trackedAttackConnected;
    this.trackedAttackId = null;
    this.trackedAttackConnected = false;
    if (enemy.state === 'hitstun' || enemy.state === 'dead') return;

    const roleId = this.getRoleId(enemy);
    if (roleId === 'pursuer' && finishedAttackId === 'pigeon_peck' && !didConnect) {
      this.enterRoleState('comic_whiff', 560);
    } else if (roleId === 'flanker' && finishedAttackId === 'scrap_flanker_charge') {
      this.flankLaneSide = this.flankLaneSide === 1 ? -1 : 1;
      this.flankHorizontalSide = this.flankHorizontalSide === 1 ? -1 : 1;
      if (!didConnect) this.enterRoleState('comic_crash', 900);
    } else if (finishedAttackId === 'discount_enemy_miscast') {
      this.enterRoleState('comic_miscast', 680);
    }
  }

  private clearInterruptedAttack(): void {
    this.trackedAttackId = null;
    this.trackedAttackConnected = false;
  }

  private getActiveAttackIntent(enemy: EnemyRoleActor, attackId: string): EnemyIntent {
    const chargeActive = attackId === 'scrap_flanker_charge' && enemy.getAttackPhase() === 'active';
    return {
      moveX: chargeActive ? (enemy.facing === 'right' ? 1 : -1) : 0,
      moveY: 0, attackPressed: false, attackKind: 'basic', state: 'attack',
    };
  }

  private getRoleStateIntent(enemy: EnemyRoleActor): EnemyIntent {
    const moveX = this.roleState === 'comic_whiff'
      ? (enemy.facing === 'right' ? 0.34 : -0.34)
      : this.roleState === 'comic_crash'
        ? (enemy.facing === 'right' ? 0.12 : -0.12)
        : 0;
    return { ...IDLE_INTENT, moveX, state: this.roleState ?? 'idle' };
  }

  private updatePursuer(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    if (target.isGrounded && Math.abs(deltaX) <= 74 && Math.abs(deltaY) <= ATTACK_RANGE_Y) {
      if (!requestAttack('basic')) return this.createRepositionIntent(enemy, target);
      this.recoveryRemainingMs = 180;
      return { moveX: 0, moveY: 0, attackPressed: true, attackKind: 'basic', state: 'telegraph' };
    }
    return {
      moveX: Math.abs(deltaX) > 42 ? Math.sign(deltaX) * 0.96 : 0,
      moveY: Math.abs(deltaY) > ATTACK_RANGE_Y ? Math.sign(deltaY) * 0.9 : 0,
      attackPressed: false, attackKind: 'basic', state: 'approach',
    };
  }

  private updateFlanker(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const contract = getEnemyRoleContract('flanker');
    const desiredY = target.y + contract.preferredLaneOffset * this.flankLaneSide;
    const deltaY = desiredY - enemy.y;
    const absX = Math.abs(target.x - enemy.x);
    const aligned = Math.abs(deltaY) <= FLANK_LANE_TOLERANCE;
    if (aligned && target.isGrounded && absX >= contract.preferredDistance.minX
      && absX <= contract.preferredDistance.maxX) {
      if (!requestAttack('special')) return this.createRepositionIntent(enemy, target);
      return {
        moveX: 0, moveY: 0, attackPressed: true, attackKind: 'special',
        attackId: 'scrap_flanker_charge', state: 'telegraph',
      };
    }
    const desiredX = target.x + contract.preferredDistance.minX * this.flankHorizontalSide;
    return {
      moveX: Math.abs(desiredX - enemy.x) > 18 ? Math.sign(desiredX - enemy.x) * 0.84 : 0,
      moveY: Math.abs(deltaY) > FLANK_LANE_TOLERANCE ? Math.sign(deltaY) : 0,
      attackPressed: false, attackKind: 'special', state: 'flank',
    };
  }

  private updateHeavy(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    if (target.isGrounded && Math.abs(deltaX) <= 108 && Math.abs(deltaY) <= 38) {
      if (!requestAttack('special')) return this.createRepositionIntent(enemy, target);
      this.recoveryRemainingMs = 520;
      return {
        moveX: 0, moveY: 0, attackPressed: true, attackKind: 'special',
        attackId: 'scrap_heavy_bash', state: 'telegraph',
      };
    }
    const speed = this.heavyArmorBroken ? 0.76 : 0.46;
    return {
      moveX: Math.abs(deltaX) > 68 ? Math.sign(deltaX) * speed : 0,
      moveY: Math.abs(deltaY) > 34 ? Math.sign(deltaY) * speed * 0.72 : 0,
      attackPressed: false, attackKind: 'special', state: 'approach',
    };
  }

  private updateZoner(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const contract = getEnemyRoleContract('zoner');
    const deltaX = target.x - enemy.x;
    const absX = Math.abs(deltaX);
    const deltaY = target.y - enemy.y;
    const absY = Math.abs(deltaY);
    const inCastRange = target.isGrounded && absX >= contract.preferredDistance.minX
      && absX <= contract.preferredDistance.maxX && absY <= 34;
    if (inCastRange) {
      if (!requestAttack('special')) return this.createRepositionIntent(enemy, target);
      this.zonerRangedCommitments += 1;
      const isMiscast = this.zonerRangedCommitments % 3 === 0;
      return {
        moveX: 0, moveY: 0, attackPressed: true, attackKind: 'special',
        attackId: isMiscast ? 'discount_enemy_miscast' : 'discount_fireball_cast', state: 'telegraph',
      };
    }
    if (target.isGrounded && absX <= 70 && absY <= 26) {
      if (!requestAttack('basic')) return this.createRepositionIntent(enemy, target);
      this.recoveryRemainingMs = 250;
      return { moveX: 0, moveY: 0, attackPressed: true, attackKind: 'basic', state: 'telegraph' };
    }
    return {
      moveX: absX < 112 ? -Math.sign(deltaX) * 0.82
        : absX > contract.preferredDistance.maxX ? Math.sign(deltaX) * 0.66 : 0,
      moveY: absY > 34 ? Math.sign(deltaY) * 0.68 : 0,
      attackPressed: false, attackKind: 'special', state: 'approach',
    };
  }

  private createRepositionIntent(enemy: EnemyRoleActor, target: EnemyRoleActor): EnemyIntent {
    const directionToTarget = Math.sign(target.x - enemy.x) || (enemy.instanceId % 2 === 0 ? 1 : -1);
    const laneDirection = target.y >= enemy.y ? 1 : -1;
    return {
      moveX: -directionToTarget * GLOBAL_REPOSITION_SPEED,
      moveY: laneDirection * 0.64,
      attackPressed: false, attackKind: 'basic', state: 'reposition',
    };
  }

  private enterRoleState(state: EnemyAiState, durationMs: number): void {
    this.roleState = state;
    this.roleStateRemainingMs = durationMs;
    this.recoveryRemainingMs = 0;
  }
}
