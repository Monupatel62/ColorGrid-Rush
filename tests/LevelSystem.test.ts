import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { LevelSystem } from '../src/systems/LevelSystem';

describe('Level progression and timer', () => {
  it('provides 100 playable levels with a tightening time limit', () => {
    expect(LEVELS).toHaveLength(100);
    expect(LEVELS[0].timeLimitSeconds).toBeGreaterThan(LEVELS[99].timeLimitSeconds);
    expect(LEVELS[99].moves).toBeLessThan(LEVELS[0].moves);
  });

  it('ends a level when its countdown reaches zero', () => {
    const level = new LevelSystem(LEVELS[0]);
    level.tick(LEVELS[0].timeLimitSeconds);
    expect(level.getTimeLeftSeconds()).toBe(0);
    expect(level.isGameOver()).toBe(true);
  });
});