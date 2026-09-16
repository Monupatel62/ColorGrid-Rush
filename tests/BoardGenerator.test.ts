import { describe, it, expect } from 'vitest';
import { BoardGenerator } from '../src/board/BoardGenerator';
import { MatchDetector } from '../src/board/MatchDetector';
import { STANDARD_COLORS } from '../src/data/colors';

describe('BoardGenerator', () => {
  it('generates boards with 0 pre-existing matches across multiple seeds', () => {
    for (let i = 0; i < 50; i++) {
      const grid = BoardGenerator.generateBoard(8, 8, STANDARD_COLORS);
      const match = MatchDetector.findMatches(grid);
      expect(match.hasMatches).toBe(false);
    }
  });

  it('guarantees that generated boards have at least one valid swap move', () => {
    for (let i = 0; i < 30; i++) {
      const grid = BoardGenerator.generateBoard(8, 8, STANDARD_COLORS);
      const hasMoves = BoardGenerator.hasValidMoves(grid);
      expect(hasMoves).toBe(true);
      const move = BoardGenerator.findValidMove(grid);
      expect(move).not.toBeNull();
      expect(move).toHaveLength(2);
    }
  });

  it('returns adjacent coordinates for the first valid swap', () => {
    const grid = BoardGenerator.generateBoard(8, 8, STANDARD_COLORS);
    const move = BoardGenerator.findValidMove(grid);

    expect(move).not.toBeNull();
    const rowDistance = Math.abs(move![0].row - move![1].row);
    const colDistance = Math.abs(move![0].col - move![1].col);
    expect(rowDistance + colDistance).toBe(1);
  });
});
