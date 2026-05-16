import type { Fighter } from '../combat/Fighter';

export type EnemyAiState = 'idle' | 'approach' | 'attack' | 'recover';

export type EnemyIntent = {
  moveX: number;
  moveY: number;
  attackPressed: boolean;
  state: EnemyAiState;
};

const ATTACK_RANGE_X = 74;
const ATTACK_RANGE_Y = 28;
const DESIRED_SPACING_X = 42;

export class EnemyController {
  private recoveryRemainingMs = 0;

  update(enemy: Fighter, target: Fighter, deltaSeconds: number): EnemyIntent {
    if (enemy.state === 'dead' || target.state === 'dead') {
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        state: 'idle',
      };
    }

    if (enemy.getCurrentAttack()) {
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        state: 'attack',
      };
    }

    if (this.recoveryRemainingMs > 0) {
      this.recoveryRemainingMs = Math.max(0, this.recoveryRemainingMs - deltaSeconds * 1000);
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: false,
        state: 'recover',
      };
    }

    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const withinAttackRange = target.isGrounded && Math.abs(deltaX) <= ATTACK_RANGE_X && Math.abs(deltaY) <= ATTACK_RANGE_Y;

    if (withinAttackRange) {
      this.recoveryRemainingMs = 220;
      return {
        moveX: 0,
        moveY: 0,
        attackPressed: true,
        state: 'attack',
      };
    }

    const moveX = Math.abs(deltaX) > DESIRED_SPACING_X ? Math.sign(deltaX) : 0;
    const moveY = Math.abs(deltaY) > ATTACK_RANGE_Y ? Math.sign(deltaY) : 0;

    return {
      moveX,
      moveY,
      attackPressed: false,
      state: 'approach',
    };
  }
}
