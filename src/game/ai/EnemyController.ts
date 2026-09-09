import type { CombatResponse } from '../combat/CombatResolver';
import type { FighterFacing, FighterState, AttackPhase } from '../combat/Fighter';
import type { EncounterPressureChannel } from '../core/EncounterDirector';
import type { EnemyAiProfile } from '../data/stages';
import { getEnemyRoleContract, resolveEnemyRoleId, type EnemyRoleId } from './EnemyRoles';

export type EnemyAiState = 'idle' | 'approach' | 'flank' | 'telegraph' | 'attack' | 'recover'
  | 'reposition' | 'comic_whiff' | 'comic_crash' | 'comic_miscast' | 'comic_safety' | 'armor_break'
  | 'boss_phase_change' | 'boss_reposition';
export type EnemyAttackKind = 'basic' | 'special';
export type EnemyAttackPermission = (kind: EnemyAttackKind) => boolean;

export type EnemyIntent = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  attackKind: EnemyAttackKind;
  attackId?: string;
  stageInteractionTriggerId?: string;
  stageInteractionTriggerIds?: readonly string[];
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
  hp: number;
  maxHp: number;
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
  private foremanPatternStep = 0;
  private junkyardBossPhase: 1 | 2 = 1;
  private junkyardBossPatternStep = 0;
  private junkyardBossLaneIndex = 0;
  private junkyardBossRepositionX = 0;
  private junkyardBossRepositionY = 0;

  constructor(
    roleId?: EnemyRoleId,
    seed = 1,
    private readonly aiProfile?: EnemyAiProfile,
    stageInteractionIds?: string | readonly string[],
  ) {
    this.configuredRoleId = roleId;
    this.flankLaneSide = seed % 2 === 0 ? -1 : 1;
    this.stageInteractionIds = typeof stageInteractionIds === 'string'
      ? [stageInteractionIds]
      : [...(stageInteractionIds ?? [])];
  }

  private readonly stageInteractionIds: readonly string[];

  getRoleId(actor?: Pick<EnemyRoleActor, 'id'>): EnemyRoleId {
    return this.configuredRoleId ?? resolveEnemyRoleId(actor?.id ?? 'angry_pigeon');
  }

  getPressureChannel(kind: EnemyAttackKind, actor?: Pick<EnemyRoleActor, 'id'>): EncounterPressureChannel {
    if ((this.aiProfile === 'scrap_foreman' || this.aiProfile === 'junkyard_boss') && kind === 'special') {
      return 'disruption';
    }
    return getEnemyRoleContract(this.getRoleId(actor)).pressureChannels[kind];
  }

  getCombatResponse(actor?: Pick<EnemyRoleActor, 'id'>): CombatResponse {
    if (this.aiProfile === 'junkyard_boss' && this.roleState === 'boss_phase_change') return 'invulnerable';
    return this.getRoleId(actor) === 'heavy' && !this.heavyArmorBroken ? 'armor' : 'normal';
  }

  notifyAttackConnected(): void {
    if (this.trackedAttackId) this.trackedAttackConnected = true;
  }

  notifyDefenseOutcome(outcome: 'blocked' | 'invulnerable'): void {
    if (!this.trackedAttackId) return;
    this.trackedAttackConnected = false;
    if (outcome === 'blocked' || outcome === 'invulnerable') this.recoveryRemainingMs = 0;
  }

  notifyKnockdown(actor?: Pick<EnemyRoleActor, 'id'>): void {
    this.clearInterruptedAttack();
    this.roleState = null;
    this.roleStateRemainingMs = 0;
    this.recoveryRemainingMs = 0;
    if (this.getRoleId(actor) === 'flanker') {
      this.flankLaneSide = this.flankLaneSide === 1 ? -1 : 1;
      this.flankHorizontalSide = this.flankHorizontalSide === 1 ? -1 : 1;
    }
  }

  notifyStageHazardHit(): void {
    if (this.aiProfile === 'scrap_foreman') {
      this.foremanPatternStep = 0;
      this.enterRoleState('comic_safety', 1000);
    }
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
    if (this.roleState === 'boss_phase_change') return { cue: 'OVERTIME!', tint: 0xff4f8b };
    if (this.roleState === 'boss_reposition') return { cue: 'SHIFT CHANGE!', tint: 0x79e7ff };
    if (this.roleState === 'comic_safety') return { cue: 'SAFETY LAST!', tint: 0x9de06f };
    const attack = actor.getCurrentAttack();
    if (this.aiProfile === 'junkyard_boss' && attack && actor.getAttackPhase() === 'startup') {
      return attack.id === 'overtime_timecard_swipe'
        ? { cue: 'TIMECARD!', tint: 0xffc15c }
        : { cue: this.junkyardBossPhase === 1 ? 'LANE LOCK!' : 'FULL LOCKDOWN!', tint: 0xff4f8b };
    }
    if (this.aiProfile === 'scrap_foreman' && attack && actor.getAttackPhase() === 'startup') {
      const cue = attack.id === 'foreman_clipboard_check' ? 'CLIPBOARD!'
        : attack.id === 'foreman_forklift_charge' ? 'FORKLIFT →' : 'STEAM DRILL!';
      return { cue, tint: attack.id === 'foreman_steam_whistle' ? 0x9de06f : 0xffb259 };
    }
    if (roleId === 'heavy' && !this.heavyArmorBroken) {
      return { cue: `ARMOR ${'◆'.repeat(HEAVY_ARMOR_CONTACTS - this.heavyArmorContacts)}`, tint: 0xffc15c };
    }
    if (this.roleState === 'armor_break') return { cue: 'ARMOR BREAK!', tint: 0xff6b57 };
    if (this.roleState === 'comic_whiff') return { cue: 'WHOOPS!', tint: 0xffd166 };
    if (this.roleState === 'comic_crash') return { cue: 'CRASH!', tint: 0xff7043 };
    if (this.roleState === 'comic_miscast') return { cue: 'DUD!', tint: 0xb892ff };
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
    armorBroken: boolean; rangedCommitments: number; aiProfile?: EnemyAiProfile; foremanPatternStep: number;
    junkyardBossPhase: 1 | 2; junkyardBossPatternStep: number;
  }> {
    return {
      roleId: this.getRoleId(actor), state: this.roleState,
      armorContacts: this.heavyArmorContacts, armorBroken: this.heavyArmorBroken,
      rangedCommitments: this.zonerRangedCommitments,
      aiProfile: this.aiProfile, foremanPatternStep: this.foremanPatternStep,
      junkyardBossPhase: this.junkyardBossPhase, junkyardBossPatternStep: this.junkyardBossPatternStep,
    };
  }

  update(enemy: EnemyRoleActor, target: EnemyRoleActor, deltaSeconds: number,
    requestAttack: EnemyAttackPermission = () => true): EnemyIntent {
    const deltaMs = Math.max(0, deltaSeconds * 1000);
    this.observeAttackLifecycle(enemy);

    if (enemy.state === 'dead' || target.state === 'dead') return IDLE_INTENT;
    if (enemy.state === 'hitstun' || enemy.state === 'launched' || enemy.state === 'knockdown'
      || enemy.state === 'grounded' || enemy.state === 'wake_up') {
      this.clearInterruptedAttack();
      return IDLE_INTENT;
    }

    const currentAttack = enemy.getCurrentAttack();
    if (currentAttack) return this.getActiveAttackIntent(enemy, currentAttack.id);

    if (this.aiProfile === 'junkyard_boss' && this.junkyardBossPhase === 1
      && enemy.maxHp > 0 && enemy.hp / enemy.maxHp <= 0.5) {
      this.junkyardBossPhase = 2;
      this.junkyardBossPatternStep = 0;
      this.enterRoleState('boss_phase_change', 1050);
    }

    if (this.roleState && this.roleStateRemainingMs > 0) {
      const activeState = this.roleState;
      this.roleStateRemainingMs = Math.max(0, this.roleStateRemainingMs - deltaMs);
      const intent = this.getRoleStateIntent(enemy);
      if (this.roleStateRemainingMs === 0) {
        this.roleState = null;
        if (activeState === 'boss_reposition') {
          this.junkyardBossPatternStep = (this.junkyardBossPatternStep + 1) % 3;
        }
      }
      return intent;
    }

    if (this.recoveryRemainingMs > 0) {
      this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaMs);
      return { ...IDLE_INTENT, state: 'recover' };
    }

    if (this.aiProfile === 'scrap_foreman') return this.updateForeman(enemy, target, requestAttack);
    if (this.aiProfile === 'junkyard_boss') return this.updateJunkyardBoss(enemy, target, requestAttack);

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
    if (this.aiProfile === 'scrap_foreman' && [
      'foreman_clipboard_check', 'foreman_forklift_charge', 'foreman_steam_whistle',
    ].includes(finishedAttackId)) {
      this.foremanPatternStep = (this.foremanPatternStep + 1) % 3;
      return;
    }
    if (this.aiProfile === 'junkyard_boss' && [
      'overtime_timecard_swipe', 'overtime_lane_lockdown',
    ].includes(finishedAttackId)) {
      this.junkyardBossPatternStep = (this.junkyardBossPatternStep + 1) % 3;
      return;
    }
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
    const moveX = this.roleState === 'boss_reposition'
      ? this.junkyardBossRepositionX
      : this.roleState === 'comic_whiff'
      ? (enemy.facing === 'right' ? 0.34 : -0.34)
      : this.roleState === 'comic_crash'
        ? (enemy.facing === 'right' ? 0.12 : -0.12)
        : 0;
    const moveY = this.roleState === 'boss_reposition' ? this.junkyardBossRepositionY : 0;
    return { ...IDLE_INTENT, moveX, moveY, state: this.roleState ?? 'idle' };
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

  private updateForeman(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (this.foremanPatternStep === 0) {
      if (target.isGrounded && absX <= 92 && absY <= 32 && requestAttack('basic')) {
        return {
          ...IDLE_INTENT, attackPressed: true, attackKind: 'basic',
          attackId: 'foreman_clipboard_check', state: 'telegraph',
        };
      }
      return {
        ...IDLE_INTENT,
        moveX: absX > 70 ? Math.sign(deltaX) * 0.68 : 0,
        moveY: absY > 28 ? Math.sign(deltaY) * 0.58 : 0,
        state: 'approach',
      };
    }

    if (this.foremanPatternStep === 1) {
      const chargeReady = target.isGrounded && absX >= 140 && absX <= 250 && absY <= 24;
      if (chargeReady && requestAttack('special')) {
        return {
          ...IDLE_INTENT, attackPressed: true, attackKind: 'special',
          attackId: 'foreman_forklift_charge', state: 'telegraph',
        };
      }
      const desiredX = target.x - Math.sign(deltaX || 1) * 184;
      return {
        ...IDLE_INTENT,
        moveX: Math.abs(desiredX - enemy.x) > 18 ? Math.sign(desiredX - enemy.x) * 0.66 : 0,
        moveY: absY > 24 ? Math.sign(deltaY) * 0.58 : 0,
        state: 'reposition',
      };
    }

    const steamReady = target.isGrounded && absX >= 90 && absX <= 300 && absY <= 42;
    if (steamReady && requestAttack('special')) {
      return {
        ...IDLE_INTENT, attackPressed: true, attackKind: 'special',
        attackId: 'foreman_steam_whistle', stageInteractionTriggerId: this.stageInteractionIds[0],
        state: 'telegraph',
      };
    }
    return {
      ...IDLE_INTENT,
      moveX: absX < 116 ? -Math.sign(deltaX || 1) * 0.62 : absX > 280 ? Math.sign(deltaX) * 0.62 : 0,
      moveY: absY > 34 ? Math.sign(deltaY) * 0.52 : 0,
      state: 'reposition',
    };
  }

  private updateJunkyardBoss(enemy: EnemyRoleActor, target: EnemyRoleActor,
    requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const phaseTwo = this.junkyardBossPhase === 2;
    const action = phaseTwo
      ? ['reposition', 'melee', 'lockdown'][this.junkyardBossPatternStep]
      : ['melee', 'lockdown', 'reposition'][this.junkyardBossPatternStep];

    if (action === 'melee') {
      if (target.isGrounded && absX <= 98 && absY <= 34 && requestAttack('basic')) {
        return {
          ...IDLE_INTENT, attackPressed: true, attackKind: 'basic',
          attackId: 'overtime_timecard_swipe', state: 'telegraph',
        };
      }
      return {
        ...IDLE_INTENT,
        moveX: absX > 76 ? Math.sign(deltaX) * (phaseTwo ? 0.82 : 0.66) : 0,
        moveY: absY > 28 ? Math.sign(deltaY) * 0.62 : 0,
        state: 'approach',
      };
    }

    if (action === 'lockdown') {
      if (target.isGrounded && absX >= 130 && absX <= 340 && absY <= 90 && requestAttack('special')) {
        const laneId = this.stageInteractionIds[this.junkyardBossLaneIndex % Math.max(1, this.stageInteractionIds.length)];
        const triggerIds = phaseTwo ? this.stageInteractionIds : laneId ? [laneId] : [];
        this.junkyardBossLaneIndex += 1;
        return {
          ...IDLE_INTENT, attackPressed: true, attackKind: 'special',
          attackId: 'overtime_lane_lockdown', stageInteractionTriggerIds: triggerIds,
          state: 'telegraph',
        };
      }
      const desiredX = target.x - Math.sign(deltaX || 1) * 210;
      return {
        ...IDLE_INTENT,
        moveX: Math.abs(desiredX - enemy.x) > 18 ? Math.sign(desiredX - enemy.x) * 0.72 : 0,
        moveY: absY > 60 ? Math.sign(deltaY) * 0.58 : 0,
        state: 'reposition',
      };
    }

    const horizontalAway = Math.sign(enemy.x - target.x) || (enemy.instanceId % 2 === 0 ? 1 : -1);
    this.junkyardBossRepositionX = horizontalAway * (phaseTwo ? 0.94 : 0.72);
    this.junkyardBossRepositionY = (this.junkyardBossLaneIndex % 2 === 0 ? -1 : 1) * (phaseTwo ? 0.82 : 0.66);
    this.enterRoleState('boss_reposition', phaseTwo ? 720 : 620);
    return this.getRoleStateIntent(enemy);
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
