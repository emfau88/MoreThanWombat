import type { AttackDefinition } from '../data/attacks';
import type { Fighter } from './Fighter';
import type { MoveStartCue } from './MoveTimeline';

export type MoveStartCueHandlers = Record<MoveStartCue, (fighter: Fighter) => void>;

export class MoveStartCueController {
  constructor(private readonly handlers: MoveStartCueHandlers) {}

  handleAttackStarted(fighter: Fighter, attack: AttackDefinition): void {
    const cue = attack.timeline?.startCue;
    if (cue) {
      this.handlers[cue](fighter);
    }
  }
}
