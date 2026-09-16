import { TileColor, SpecialType, STANDARD_COLORS } from '../data/colors';
import { GridCell } from './MatchDetector';
import { pickRandom, SeededRandom } from '../utils/random';

export interface TileDropMove {
  fromRow: number;
  toRow: number;
  col: number;
  cell: GridCell;
}

export interface TileRefillSpawn {
  spawnRow: number; // Virtual starting row above board (e.g. -1, -2)
  toRow: number;
  col: number;
  cell: GridCell;
}

export interface RefillPlan {
  drops: TileDropMove[];
  spawns: TileRefillSpawn[];
}

export class BoardRefill {
  /**
   * Calculates gravity drops and refills for empty cells in a grid.
   * Updates the grid in-place to the new state.
   */
  public static executeRefill(
    grid: (GridCell | null)[][],
    colors: TileColor[] = STANDARD_COLORS,
    rng?: SeededRandom
  ): RefillPlan {
    const rows = grid.length;
    const cols = grid[0].length;

    const drops: TileDropMove[] = [];
    const spawns: TileRefillSpawn[] = [];

    for (let c = 0; c < cols; c++) {
      // 1. Move existing tiles down to fill gaps
      let emptyRow = rows - 1;

      for (let r = rows - 1; r >= 0; r--) {
        const cell = grid[r][c];
        if (cell !== null) {
          if (r !== emptyRow) {
            // Tile drops from r down to emptyRow
            const movedCell: GridCell = {
              ...cell,
              row: emptyRow
            };
            grid[emptyRow][c] = movedCell;
            grid[r][c] = null;

            drops.push({
              fromRow: r,
              toRow: emptyRow,
              col: c,
              cell: movedCell
            });
          }
          emptyRow--;
        }
      }

      // 2. Any remaining empty spaces at top (from emptyRow down to 0) get refilled
      let spawnCounter = 1;
      for (let r = emptyRow; r >= 0; r--) {
        const color = rng ? rng.pickOne(colors) : pickRandom(colors);
        const newCell: GridCell = {
          row: r,
          col: c,
          color,
          special: SpecialType.NONE
        };
        grid[r][c] = newCell;

        spawns.push({
          spawnRow: -spawnCounter,
          toRow: r,
          col: c,
          cell: newCell
        });
        spawnCounter++;
      }
    }

    return { drops, spawns };
  }
}
