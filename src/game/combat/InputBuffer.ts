export type BufferedCombatAction = 'attack' | 'special' | 'ultimate' | 'jump';

export type BufferableInput = {
  attackPressed: boolean;
  specialPressed: boolean;
  ultimatePressed: boolean;
  jumpPressed: boolean;
};

const ACTIONS: BufferedCombatAction[] = ['attack', 'special', 'ultimate', 'jump'];

export class InputBuffer {
  private readonly remainingMs = new Map<BufferedCombatAction, number>();

  constructor(private readonly windowMs = 120) {}

  advance(deltaMs: number, isCombatFrozen = false): void {
    if (deltaMs <= 0 || isCombatFrozen) {
      return;
    }

    for (const action of ACTIONS) {
      const remainingMs = this.remainingMs.get(action) ?? 0;

      if (remainingMs <= 0) {
        continue;
      }

      const nextRemainingMs = Math.max(0, remainingMs - deltaMs);
      if (nextRemainingMs === 0) {
        this.remainingMs.delete(action);
      } else {
        this.remainingMs.set(action, nextRemainingMs);
      }
    }
  }

  capture(input: BufferableInput): void {
    if (input.attackPressed) {
      this.remainingMs.set('attack', this.windowMs);
    }
    if (input.specialPressed) {
      this.remainingMs.set('special', this.windowMs);
    }
    if (input.ultimatePressed) {
      this.remainingMs.set('ultimate', this.windowMs);
    }
    if (input.jumpPressed) {
      this.remainingMs.set('jump', this.windowMs);
    }
  }

  has(action: BufferedCombatAction): boolean {
    return (this.remainingMs.get(action) ?? 0) > 0;
  }

  consume(action: BufferedCombatAction): boolean {
    if (!this.has(action)) {
      return false;
    }

    this.remainingMs.delete(action);
    return true;
  }

  clear(): void {
    this.remainingMs.clear();
  }
}
