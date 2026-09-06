import type { Fighter } from '../combat/Fighter';

export type EnemyAiState = 'idle' | 'approach' | 'attack' | 'recover' | 'reposition';
export type EnemyAttackKind = 'basic' | 'special';
export type EnemyAttackPermission = (kind: EnemyAttackKind) => boolean;

export type EnemyIntent = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  attackKind: EnemyAttackKind;
  state: EnemyAiState;
};

const ATTACK_RANGE_X = 74;
const ATTACK_RANGE_Y = 28;
const DESIRED_SPACING_X = 42;
const DEFAULT_APPROACH_SCALE = 0.86;
const DEFAULT_VERTICAL_SCALE = 0.82;
const DEFAULT_ATTACK_RECOVERY_MS = 260;
const WIZARD_SPECIAL_RANGE_MIN_X = 130;
const WIZARD_SPECIAL_RANGE_MAX_X = 280;
const WIZARD_SPECIAL_RANGE_Y = 34;
const WIZARD_BASIC_RANGE_X = 70;
const WIZARD_BASIC_RANGE_Y = 26;
const WIZARD_RETREAT_RANGE_X = 108;
const WIZARD_APPROACH_SCALE = 0.7;
const WIZARD_RETREAT_SCALE = 0.76;
const WIZARD_VERTICAL_SCALE = 0.68;
const WIZARD_SPECIAL_RECOVERY_MS = 520;
const WIZARD_BASIC_RECOVERY_MS = 250;

export class EnemyController {
  private recoveryRemainingMs = 0;

  update(
    enemy: Fighter,
    target: Fighter,
    deltaSeconds: number,
    requestAttack: EnemyAttackPermission = () => true,
  ): EnemyIntent {
    if (enemy.state === 'dead' || target.state === 'dead') {
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        attackKind: 'basic',
        state: 'idle',
      };
    }

    if (enemy.getCurrentAttack()) {
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        attackKind: 'basic',
        state: 'attack',
      };
    }

    if (this.recoveryRemainingMs > 0) {
      this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaSeconds * 1000);
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        attackKind: 'basic',
        state: 'recover',
      };
    }

    if (enemy.id === 'discount_wizard') {
      return this.updateDiscountWizard(enemy, target, requestAttack);
    }

    return this.updateDefaultMelee(enemy, target, requestAttack);
  }

  private updateDefaultMelee(enemy: Fighter, target: Fighter, requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const withinAttackRange = target.isGrounded && Math.abs(deltaX) <= ATTACK_RANGE_X && Math.abs(deltaY) <= ATTACK_RANGE_Y;

    if (withinAttackRange) {
      if (!requestAttack('basic')) {
        return this.createRepositionIntent(enemy, target);
      }
      this.recoveryRemainingMs = DEFAULT_ATTACK_RECOVERY_MS;
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: true,
        attackKind: 'basic',
        state: 'attack',
      };
    }

    const moveX = Math.abs(deltaX) > DESIRED_SPACING_X ? Math.sign(deltaX) * DEFAULT_APPROACH_SCALE : 0;
    const moveY = Math.abs(deltaY) > ATTACK_RANGE_Y ? Math.sign(deltaY) * DEFAULT_VERTICAL_SCALE : 0;

    return {
      moveX,
      moveY,
      attackPressed: false,
      attackKind: 'basic',
      state: 'approach',
    };
  }

  private updateDiscountWizard(enemy: Fighter, target: Fighter, requestAttack: EnemyAttackPermission): EnemyIntent {
    const deltaX = target.x - enemy.x;
    const absDeltaX = Math.abs(deltaX);
    const deltaY = target.y - enemy.y;
    const absDeltaY = Math.abs(deltaY);
    const withinSpecialRange =
      target.isGrounded &&
      absDeltaX >= WIZARD_SPECIAL_RANGE_MIN_X &&
      absDeltaX <= WIZARD_SPECIAL_RANGE_MAX_X &&
      absDeltaY <= WIZARD_SPECIAL_RANGE_Y;
    const withinBasicRange =
      target.isGrounded &&
      absDeltaX <= WIZARD_BASIC_RANGE_X &&
      absDeltaY <= WIZARD_BASIC_RANGE_Y;

    if (withinSpecialRange) {
      if (!requestAttack('special')) {
        return this.createRepositionIntent(enemy, target);
      }
      this.recoveryRemainingMs = WIZARD_SPECIAL_RECOVERY_MS;
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: true,
        attackKind: 'special',
        state: 'attack',
      };
    }

    if (withinBasicRange) {
      if (!requestAttack('basic')) {
        return this.createRepositionIntent(enemy, target);
      }
      this.recoveryRemainingMs = WIZARD_BASIC_RECOVERY_MS;
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: true,
        attackKind: 'basic',
        state: 'attack',
      };
    }

    let moveX = 0;

    if (absDeltaX < WIZARD_RETREAT_RANGE_X) {
      moveX = -Math.sign(deltaX) * WIZARD_RETREAT_SCALE;
    } else if (absDeltaX > WIZARD_SPECIAL_RANGE_MAX_X) {
      moveX = Math.sign(deltaX) * WIZARD_APPROACH_SCALE;
    }

    const moveY = absDeltaY > WIZARD_SPECIAL_RANGE_Y ? Math.sign(deltaY) * WIZARD_VERTICAL_SCALE : 0;

    return {
      moveX,
      moveY,
      attackPressed: false,
      attackKind: 'basic',
      state: 'approach',
    };
  }

  private createRepositionIntent(enemy: Fighter, target: Fighter): EnemyIntent {
    const directionToTarget = Math.sign(target.x - enemy.x) || (enemy.instanceId % 2 === 0 ? 1 : -1);
    const laneDirection = target.y >= enemy.y ? 1 : -1;

    return {
      moveX: -directionToTarget * 0.42,
      moveY: laneDirection * 0.56,
      attackPressed: false,
      attackKind: 'basic',
      state: 'reposition',
    };
  }
}
