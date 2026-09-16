import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveManager } from '../src/systems/SaveManager';

describe('SaveManager', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStore[key] || null),
      setItem: vi.fn((key: string, val: string) => { mockStore[key] = val; }),
      removeItem: vi.fn((key: string) => { delete mockStore[key]; }),
      clear: vi.fn(() => { mockStore = {}; })
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', { localStorage: localStorageMock });
  });

  it('initializes with default data when localStorage is empty', () => {
    const manager = SaveManager.getInstance();
    manager.resetProgress();
    expect(manager.getHighestUnlockedLevel()).toBe(1);
    expect(manager.getTotalStars()).toBe(0);
    expect(manager.getData().settings.soundEnabled).toBe(true);
  });

  it('updates stars and unlocks next level on successful completion', () => {
    const manager = SaveManager.getInstance();
    manager.resetProgress();

    manager.saveLevelResult(1, 2400, 2);
    expect(manager.getStarsForLevel(1)).toBe(2);
    expect(manager.getHighScore(1)).toBe(2400);
    expect(manager.getHighestUnlockedLevel()).toBe(2);
    expect(manager.getTotalStars()).toBe(2);
  });

  it('handles corrupted localStorage data without crashing', () => {
    mockStore['colorgrid_rush_save_v1'] = 'INVALID_JSON_CORRUPT{[[[';
    const manager = SaveManager.getInstance();
    const data = manager.load();
    expect(data.highestUnlockedLevel).toBe(1);
    expect(data.settings.soundEnabled).toBe(true);
  });
});
