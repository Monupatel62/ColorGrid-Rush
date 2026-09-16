import { TileColor, SpecialType, STANDARD_COLORS } from '../data/colors';
import { GridCell, MatchDetector } from './MatchDetector';
import { pickRandom, SeededRandom } from '../utils/random';

export class BoardGenerator {
  public static findValidMove(grid: GridCell[][]): [{ row: number; col: number }, { row: number; col: number }] | null {
    const rows = grid.length;
    if (rows === 0) return null;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c + 1 < cols && this.isValidSwap(grid, r, c, r, c + 1)) {
          return [{ row: r, col: c }, { row: r, col: c + 1 }];
        }
        if (r + 1 < rows && this.isValidSwap(grid, r, c, r + 1, c)) {
          return [{ row: r, col: c }, { row: r + 1, col: c }];
        }
      }
    }

    return null;
  }

  /**
   * Generates a randomized board with zero pre-existing matches
   * and at least one valid swap move.
   */
  public static generateBoard(
    rows: number = 8,
    cols: number = 8,
    colors: TileColor[] = STANDARD_COLORS,
    rng?: SeededRandom
  ): GridCell[][] {
    let attempts = 0;
    const maxAttempts = 200;

    while (attempts < maxAttempts) {
      attempts++;
      const grid: GridCell[][] = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          // Filter out colors that would immediately form a 3-match horizontally or vertically
          const forbidden: TileColor[] = [];

          // Check left 2 cells
          if (c >= 2 && grid[r][c - 1].color === grid[r][c - 2].color) {
            forbidden.push(grid[r][c - 1].color);
          }
          // Check top 2 cells
          if (r >= 2 && grid[r - 1][c].color === grid[r - 2][c].color) {
            forbidden.push(grid[r - 1][c].color);
          }

          const available = colors.filter((col) => !forbidden.includes(col));
          const chosenColor = available.length > 0
            ? (rng ? rng.pickOne(available) : pickRandom(available))
            : (rng ? rng.pickOne(colors) : pickRandom(colors));

          grid[r][c] = {
            row: r,
            col: c,
            color: chosenColor,
            special: SpecialType.NONE
          };
        }
      }

      // Check if board has at least 1 valid swap move
      if (this.hasValidMoves(grid)) {
        return grid;
      }
    }

    // Fallback: If 200 random attempts somehow fail to have a move, inject a guaranteed move
    const fallbackGrid = this.generateZeroMatchGrid(rows, cols, colors, rng);
    this.injectGuaranteedMove(fallbackGrid);
    return fallbackGrid;
  }

  /**
   * Generates a grid with strictly no 3-in-a-row matches.
   */
  public static generateZeroMatchGrid(
    rows: number,
    cols: number,
    colors: TileColor[],
    rng?: SeededRandom
  ): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const forbidden: TileColor[] = [];
        if (c >= 2 && grid[r][c - 1].color === grid[r][c - 2].color) {
          forbidden.push(grid[r][c - 1].color);
        }
        if (r >= 2 && grid[r - 1][c].color === grid[r - 2][c].color) {
          forbidden.push(grid[r - 1][c].color);
        }
        const available = colors.filter((col) => !forbidden.includes(col));
        const color = available.length > 0
          ? (rng ? rng.pickOne(available) : pickRandom(available))
          : colors[0];

        grid[r][c] = {
          row: r,
          col: c,
          color,
          special: SpecialType.NONE
        };
      }
    }
    return grid;
  }

  /**
   * Checks if any adjacent swap creates a valid match or activates specials.
   */
  public static hasValidMoves(grid: GridCell[][]): boolean {
    const rows = grid.length;
    const cols = grid[0].length;

    // Any Rainbow tile or adjacent special tiles guarantee a valid move!
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].special === SpecialType.RAINBOW) return true;
        // Check adjacent special combinations
        if (grid[r][c].special !== SpecialType.NONE) {
          if (c + 1 < cols && grid[r][c + 1].special !== SpecialType.NONE) return true;
          if (r + 1 < rows && grid[r + 1][c].special !== SpecialType.NONE) return true;
        }
      }
    }

    return this.findValidMove(grid) !== null;
  }

  private static isValidSwap(
    grid: GridCell[][],
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): boolean {
    this.swap(grid, r1, c1, r2, c2);
    const match = MatchDetector.findMatches(grid);
    this.swap(grid, r1, c1, r2, c2);
    return match.hasMatches;
  }

  /**
   * Injects a guaranteed 3-match swap into a board that might have no valid moves.
   */
  private static injectGuaranteedMove(grid: GridCell[][]): void {
    // Set up pattern at top-left: [C, C, X] and [Y, Z, C] so swapping (0,2) with (1,2) creates match
    const c = grid[0][0].color;
    grid[0][1].color = c;
    // ensure different color
    const otherColors = STANDARD_COLORS.filter((col) => col !== c);
    grid[0][2].color = otherColors[0];
    grid[1][2].color = c;
  }

  private static swap(grid: GridCell[][], r1: number, c1: number, r2: number, c2: number): void {
    const temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
  }
}
