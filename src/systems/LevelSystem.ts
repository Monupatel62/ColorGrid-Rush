import { LevelConfig, LevelObjective } from '../data/levels';
import { GridCell } from '../board/MatchDetector';

export class LevelSystem {
  private config: LevelConfig;
  private movesLeft: number;
  private objectives: LevelObjective[];
  private iceGrid: number[][];

  constructor(config: LevelConfig) {
    this.config = config;
    this.movesLeft = config.moves;
    this.objectives = config.objectives.map((obj) => ({ ...obj, current: 0 }));

    // Copy ice grid
    if (config.iceGrid) {
      this.iceGrid = config.iceGrid.map((row) => [...row]);
    } else {
      this.iceGrid = Array.from({ length: 8 }, () => Array(8).fill(0));
    }
  }

  public getConfig(): LevelConfig {
    return this.config;
  }

  public getMovesLeft(): number {
    return this.movesLeft;
  }

  public decrementMoves(): number {
    this.movesLeft = Math.max(0, this.movesLeft - 1);
    return this.movesLeft;
  }

  public getObjectives(): LevelObjective[] {
    return this.objectives;
  }

  public getIceAt(row: number, col: number): number {
    if (this.iceGrid[row] && this.iceGrid[row][col] !== undefined) {
      return this.iceGrid[row][col];
    }
    return 0;
  }

  public breakIce(row: number, col: number): boolean {
    if (this.getIceAt(row, col) > 0) {
      this.iceGrid[row][col]--;

      // Update clear_ice objective
      const iceObj = this.objectives.find((obj) => obj.type === 'clear_ice');
      if (iceObj) {
        iceObj.current++;
      }
      return true;
    }
    return false;
  }

  public recordTileMatches(cells: GridCell[]): void {
    cells.forEach((cell) => {
      const colorObj = this.objectives.find(
        (obj) => obj.type === 'collect_color' && obj.color === cell.color
      );
      if (colorObj) {
        colorObj.current++;
      }
    });
  }

  public updateScoreProgress(score: number): void {
    const scoreObj = this.objectives.find((obj) => obj.type === 'score');
    if (scoreObj) {
      scoreObj.current = score;
    }
  }

  public isWon(): boolean {
    // All objectives must be satisfied
    return this.objectives.every((obj) => obj.current >= obj.target);
  }

  public isGameOver(): boolean {
    return this.movesLeft <= 0 && !this.isWon();
  }
}
