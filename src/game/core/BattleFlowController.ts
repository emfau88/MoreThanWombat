export type BattleResult = 'running' | 'victory' | 'defeat';

export class BattleFlowController {
  private result: BattleResult = 'running';

  update(playerDefeated: boolean, battleWon: boolean): BattleResult {
    if (this.result !== 'running') {
      return this.result;
    }

    if (playerDefeated) {
      this.result = 'defeat';
      return this.result;
    }

    if (battleWon) {
      this.result = 'victory';
      return this.result;
    }

    return this.result;
  }

  getResult(): BattleResult {
    return this.result;
  }
}
