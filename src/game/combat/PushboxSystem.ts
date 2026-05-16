import type { Fighter, FighterBounds } from './Fighter';
import { intersectsRect } from '../utils/Rect';

const MIN_PUSH_DISTANCE = 0.01;

export class PushboxSystem {
  resolve(fighterA: Fighter, fighterB: Fighter, bounds: FighterBounds): void {
    if (fighterA.state === 'dead' || fighterB.state === 'dead') {
      return;
    }

    const boxA = fighterA.getPushbox();
    const boxB = fighterB.getPushbox();

    if (!intersectsRect(boxA, boxB)) {
      return;
    }

    const centerAX = boxA.x + boxA.width / 2;
    const centerAY = boxA.y + boxA.height / 2;
    const centerBX = boxB.x + boxB.width / 2;
    const centerBY = boxB.y + boxB.height / 2;
    const overlapX = Math.min(boxA.x + boxA.width - boxB.x, boxB.x + boxB.width - boxA.x);
    const overlapY = Math.min(boxA.y + boxA.height - boxB.y, boxB.y + boxB.height - boxA.y);

    if (overlapX < overlapY) {
      const direction = centerAX <= centerBX ? -1 : 1;
      this.splitPush(fighterA, fighterB, direction * Math.max(overlapX, MIN_PUSH_DISTANCE), 0, bounds);
      return;
    }

    const direction = centerAY <= centerBY ? -1 : 1;
    this.splitPush(fighterA, fighterB, 0, direction * Math.max(overlapY, MIN_PUSH_DISTANCE), bounds);
  }

  private splitPush(fighterA: Fighter, fighterB: Fighter, pushX: number, pushY: number, bounds: FighterBounds): void {
    fighterA.nudge(pushX * 0.5, pushY * 0.5, bounds);
    fighterB.nudge(-pushX * 0.5, -pushY * 0.5, bounds);
  }
}
