import { describe, it, expect } from 'vitest';
import { BoardRefill } from '../src/board/BoardRefill';
import { GridCell } from '../src/board/MatchDetector';
import { TileColor, SpecialType } from '../src/data/colors';

describe('BoardRefill & Gravity', () => {
  it('correctly drops tiles down into holes and refills the top', () => {
    // 4x4 grid where bottom two tiles of column 1 are empty (null)
    const grid: (GridCell | null)[][] = [];
    for (let r = 0; r < 4; r++) {
      grid[r] = [];
      for (let c = 0; c < 4; c++) {
        grid[r][c] = {
          row: r,
          col: c,
          color: TileColor.BLUE,
          special: SpecialType.NONE
        };
      }
    }

    // Clear (2, 1) and (3, 1)
    grid[2][1] = null;
    grid[3][1] = null;

    const plan = BoardRefill.executeRefill(grid);

    // Tiles (0, 1) and (1, 1) should have dropped to (2, 1) and (3, 1)
    expect(plan.drops.length).toBe(2);
    // Two new tiles should have spawned to fill rows 0 and 1 in column 1
    expect(plan.spawns.length).toBe(2);

    // Ensure no nulls remain in the grid
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        expect(grid[r][c]).not.toBeNull();
        expect(grid[r][c]!.row).toBe(r);
        expect(grid[r][c]!.col).toBe(c);
      }
    }
  });
});
