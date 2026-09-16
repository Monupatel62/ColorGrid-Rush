import { TileColor, SpecialType } from '../data/colors';

export interface GridCell {
  row: number;
  col: number;
  color: TileColor;
  special: SpecialType;
}

export interface SpecialSpawn {
  row: number;
  col: number;
  color: TileColor;
  special: SpecialType;
}

export interface MatchResult {
  hasMatches: boolean;
  matchedCells: GridCell[]; // All cells that were part of matches
  clearedCells: GridCell[]; // Cells to be destroyed (excluding any cell transformed into a special)
  specialSpawns: SpecialSpawn[];
}

export class MatchDetector {
  /**
   * Scans a grid for all valid 3+, 4+, 5+ and T/L matches.
   * @param grid 2D array of cells (grid[row][col])
   * @param swappedFrom Optional coordinate of first tile swapped (row, col)
   * @param swappedTo Optional coordinate of second tile swapped (row, col)
   */
  public static findMatches(
    grid: (GridCell | null)[][],
    swappedFrom?: { row: number; col: number },
    swappedTo?: { row: number; col: number }
  ): MatchResult {
    const rows = grid.length;
    if (rows === 0) return { hasMatches: false, matchedCells: [], clearedCells: [], specialSpawns: [] };
    const cols = grid[0].length;

    const horizontalMatches: GridCell[][] = [];
    const verticalMatches: GridCell[][] = [];

    // 1. Scan horizontal matches
    for (let r = 0; r < rows; r++) {
      let run: GridCell[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (!cell || cell.color === TileColor.RAINBOW) {
          if (run.length >= 3) horizontalMatches.push([...run]);
          run = [];
          continue;
        }

        if (run.length === 0) {
          run.push(cell);
        } else if (run[run.length - 1].color === cell.color) {
          run.push(cell);
        } else {
          if (run.length >= 3) horizontalMatches.push([...run]);
          run = [cell];
        }
      }
      if (run.length >= 3) horizontalMatches.push([...run]);
    }

    // 2. Scan vertical matches
    for (let c = 0; c < cols; c++) {
      let run: GridCell[] = [];
      for (let r = 0; r < rows; r++) {
        const cell = grid[r][c];
        if (!cell || cell.color === TileColor.RAINBOW) {
          if (run.length >= 3) verticalMatches.push([...run]);
          run = [];
          continue;
        }

        if (run.length === 0) {
          run.push(cell);
        } else if (run[run.length - 1].color === cell.color) {
          run.push(cell);
        } else {
          if (run.length >= 3) verticalMatches.push([...run]);
          run = [cell];
        }
      }
      if (run.length >= 3) verticalMatches.push([...run]);
    }

    if (horizontalMatches.length === 0 && verticalMatches.length === 0) {
      return { hasMatches: false, matchedCells: [], clearedCells: [], specialSpawns: [] };
    }

    // 3. Find unique matched cells
    const allMatchedMap = new Map<string, GridCell>();
    const keyOf = (r: number, c: number) => `${r},${c}`;

    horizontalMatches.forEach((match) => {
      match.forEach((cell) => allMatchedMap.set(keyOf(cell.row, cell.col), cell));
    });
    verticalMatches.forEach((match) => {
      match.forEach((cell) => allMatchedMap.set(keyOf(cell.row, cell.col), cell));
    });

    const specialSpawns: SpecialSpawn[] = [];
    const usedForSpecial = new Set<string>();

    // Helper to determine best placement for special tile (prefer swapped position)
    const pickBestPosition = (cells: GridCell[]): GridCell => {
      if (swappedTo && cells.some((c) => c.row === swappedTo.row && c.col === swappedTo.col)) {
        return cells.find((c) => c.row === swappedTo.row && c.col === swappedTo.col)!;
      }
      if (swappedFrom && cells.some((c) => c.row === swappedFrom.row && c.col === swappedFrom.col)) {
        return cells.find((c) => c.row === swappedFrom.row && c.col === swappedFrom.col)!;
      }
      // Fallback: middle tile of run
      return cells[Math.floor(cells.length / 2)];
    };

    // Priority A: 5-in-a-row -> Rainbow Gem
    const allRuns = [...horizontalMatches, ...verticalMatches];
    const fiveRuns = allRuns.filter((r) => r.length >= 5);
    fiveRuns.forEach((run) => {
      const pos = pickBestPosition(run);
      const posKey = keyOf(pos.row, pos.col);
      if (!usedForSpecial.has(posKey)) {
        specialSpawns.push({
          row: pos.row,
          col: pos.col,
          color: TileColor.RAINBOW,
          special: SpecialType.RAINBOW
        });
        usedForSpecial.add(posKey);
      }
    });

    // Priority B: T or L intersections -> Bomb
    horizontalMatches.forEach((hMatch) => {
      verticalMatches.forEach((vMatch) => {
        // Must share color and an intersection
        if (hMatch[0].color === vMatch[0].color) {
          const intersection = hMatch.find((hCell) =>
            vMatch.some((vCell) => vCell.row === hCell.row && vCell.col === hCell.col)
          );
          if (intersection) {
            const intKey = keyOf(intersection.row, intersection.col);
            if (!usedForSpecial.has(intKey)) {
              specialSpawns.push({
                row: intersection.row,
                col: intersection.col,
                color: intersection.color,
                special: SpecialType.BOMB
              });
              usedForSpecial.add(intKey);
            }
          }
        }
      });
    });

    // Priority C: 4-in-a-row -> Line Blaster (Horizontal or Vertical)
    horizontalMatches
      .filter((r) => r.length === 4)
      .forEach((run) => {
        const pos = pickBestPosition(run);
        const posKey = keyOf(pos.row, pos.col);
        if (!usedForSpecial.has(posKey)) {
          specialSpawns.push({
            row: pos.row,
            col: pos.col,
            color: pos.color,
            special: SpecialType.LINE_HORIZONTAL
          });
          usedForSpecial.add(posKey);
        }
      });

    verticalMatches
      .filter((r) => r.length === 4)
      .forEach((run) => {
        const pos = pickBestPosition(run);
        const posKey = keyOf(pos.row, pos.col);
        if (!usedForSpecial.has(posKey)) {
          specialSpawns.push({
            row: pos.row,
            col: pos.col,
            color: pos.color,
            special: SpecialType.LINE_VERTICAL
          });
          usedForSpecial.add(posKey);
        }
      });

    // Cleared cells are matched cells that are NOT transformed into special spawns
    const clearedCells: GridCell[] = [];
    const matchedCells: GridCell[] = Array.from(allMatchedMap.values());

    matchedCells.forEach((cell) => {
      if (!usedForSpecial.has(keyOf(cell.row, cell.col))) {
        clearedCells.push(cell);
      }
    });

    return {
      hasMatches: matchedCells.length > 0,
      matchedCells,
      clearedCells,
      specialSpawns
    };
  }
}
