import { GAME_CONFIG } from '../data/gameConfig';

export class ScoreSystem {
  private currentScore: number = 0;
  private comboCount: number = 0;
  private starThresholds: [number, number, number];

  constructor(starThresholds: [number, number, number] = [1000, 2500, 4500]) {
    this.starThresholds = starThresholds;
  }

  public reset(starThresholds?: [number, number, number]): void {
    this.currentScore = 0;
    this.comboCount = 0;
    if (starThresholds) {
      this.starThresholds = starThresholds;
    }
  }

  public getScore(): number {
    return this.currentScore;
  }

  public getCombo(): number {
    return this.comboCount;
  }

  public getStars(): number {
    if (this.currentScore >= this.starThresholds[2]) return 3;
    if (this.currentScore >= this.starThresholds[1]) return 2;
    if (this.currentScore >= this.starThresholds[0]) return 1;
    return 0;
  }

  public getStarThresholds(): [number, number, number] {
    return this.starThresholds;
  }

  public incrementCombo(): number {
    this.comboCount++;
    return this.comboCount;
  }

  public resetCombo(): void {
    this.comboCount = 0;
  }

  public addMatchScore(tileCount: number): number {
    const multIndex = Math.min(this.comboCount, GAME_CONFIG.COMBO_MULTIPLIERS.length - 1);
    const multiplier = GAME_CONFIG.COMBO_MULTIPLIERS[multIndex];
    const points = Math.round(tileCount * GAME_CONFIG.SCORE_PER_TILE * multiplier);
    this.currentScore += points;
    return points;
  }

  public addSpecialDetonationScore(): number {
    const points = GAME_CONFIG.SCORE_SPECIAL_BONUS;
    this.currentScore += points;
    return points;
  }

  public addIceClearScore(): number {
    const points = GAME_CONFIG.SCORE_PER_ICE;
    this.currentScore += points;
    return points;
  }

  public addRushMoveBonus(remainingMoves: number): number {
    const points = remainingMoves * GAME_CONFIG.SCORE_REMAINING_MOVE_BONUS;
    this.currentScore += points;
    return points;
  }
}
