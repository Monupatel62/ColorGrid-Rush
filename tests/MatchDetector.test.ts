import { describe, it, expect } from 'vitest';
import { MatchDetector, GridCell } from '../src/board/MatchDetector';
import { TileColor, SpecialType } from '../src/data/colors';

function createBlankGrid(rows: number = 8, cols: number = 8): (GridCell | null)[][] {
  const grid: (GridCell | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      // Checkerboard pattern to guarantee no 3-matches by default
      grid[r][c] = {
        row: r,
        col: c,
        color: ((r + c) % 2 === 0) ? TileColor.RED : TileColor.BLUE,
        special: SpecialType.NONE
      };
    }
  }
  return grid;
}

describe('MatchDetector', () => {
  it('detects a simple 3-tile horizontal match', () => {
    const grid = createBlankGrid(5, 5);
    // Force a 3-match of GREEN at row 2, cols 1, 2, 3
    grid[2][1]!.color = TileColor.GREEN;
    grid[2][2]!.color = TileColor.GREEN;
    grid[2][3]!.color = TileColor.GREEN;

    const result = MatchDetector.findMatches(grid);
    expect(result.hasMatches).toBe(true);
    expect(result.matchedCells.length).toBe(3);
    expect(result.clearedCells.length).toBe(3);
    expect(result.specialSpawns.length).toBe(0);
  });

  it('detects a 4-in-a-row match and spawns a Line Blaster', () => {
    const grid = createBlankGrid(6, 6);
    grid[3][1]!.color = TileColor.YELLOW;
    grid[3][2]!.color = TileColor.YELLOW;
    grid[3][3]!.color = TileColor.YELLOW;
    grid[3][4]!.color = TileColor.YELLOW;

    const result = MatchDetector.findMatches(grid, { row: 3, col: 2 }, { row: 3, col: 3 });
    expect(result.hasMatches).toBe(true);
    expect(result.matchedCells.length).toBe(4);
    expect(result.specialSpawns.length).toBe(1);
    expect(result.specialSpawns[0].special).toBe(SpecialType.LINE_HORIZONTAL);
    expect(result.clearedCells.length).toBe(3); // 4 matched minus 1 converted to special
  });

  it('detects a 5-in-a-row match and spawns a Rainbow Gem', () => {
    const grid = createBlankGrid(7, 7);
    for (let c = 1; c <= 5; c++) {
      grid[2][c]!.color = TileColor.PURPLE;
    }

    const result = MatchDetector.findMatches(grid);
    expect(result.hasMatches).toBe(true);
    expect(result.specialSpawns.some((s) => s.special === SpecialType.RAINBOW)).toBe(true);
  });

  it('detects a T-shape intersection and spawns an Area Bomb', () => {
    const grid = createBlankGrid(7, 7);
    // Horizontal match at row 2, cols 1,2,3
    grid[2][1]!.color = TileColor.BLUE;
    grid[2][2]!.color = TileColor.BLUE;
    grid[2][3]!.color = TileColor.BLUE;
    // Vertical match at col 2, rows 1,2,3
    grid[1][2]!.color = TileColor.BLUE;
    grid[3][2]!.color = TileColor.BLUE;

    const result = MatchDetector.findMatches(grid);
    expect(result.hasMatches).toBe(true);
    const bombSpawn = result.specialSpawns.find((s) => s.special === SpecialType.BOMB);
    expect(bombSpawn).toBeDefined();
    expect(bombSpawn!.row).toBe(2);
    expect(bombSpawn!.col).toBe(2);
  });
});
