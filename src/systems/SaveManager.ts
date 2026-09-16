export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  hapticsEnabled: boolean;
}

export interface SaveData {
  version: number;
  highestUnlockedLevel: number;
  levelStars: Record<number, number>;
  levelHighScores: Record<number, number>;
  settings: GameSettings;
  dailyChallenge: {
    lastCompletedDate: string;
    streak: number;
    bestScore: number;
  };
}

const SAVE_KEY = 'colorgrid_rush_save_v1';

const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  highestUnlockedLevel: 1,
  levelStars: {},
  levelHighScores: {},
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    reducedMotion: false,
    hapticsEnabled: true
  },
  dailyChallenge: {
    lastCompletedDate: '',
    streak: 0,
    bestScore: 0
  }
};

export class SaveManager {
  private static instance: SaveManager;
  private data: SaveData;

  private constructor() {
    this.data = this.load();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public load(): SaveData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
      }
      const parsed = JSON.parse(raw);
      // Validate schema integrity
      return {
        version: parsed.version || 1,
        highestUnlockedLevel: Math.max(1, parsed.highestUnlockedLevel || 1),
        levelStars: parsed.levelStars && typeof parsed.levelStars === 'object' ? parsed.levelStars : {},
        levelHighScores: parsed.levelHighScores && typeof parsed.levelHighScores === 'object' ? parsed.levelHighScores : {},
        settings: {
          ...DEFAULT_SAVE_DATA.settings,
          ...(parsed.settings || {})
        },
        dailyChallenge: {
          ...DEFAULT_SAVE_DATA.dailyChallenge,
          ...(parsed.dailyChallenge || {})
        }
      };
    } catch {
      // Fallback on corrupt JSON
      return JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    }
  }

  public save(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false;
    }
  }

  public getData(): SaveData {
    return this.data;
  }

  public getHighestUnlockedLevel(): number {
    return this.data.highestUnlockedLevel;
  }

  public getStarsForLevel(levelId: number): number {
    return this.data.levelStars[levelId] || 0;
  }

  public getTotalStars(): number {
    return Object.values(this.data.levelStars).reduce((sum, stars) => sum + stars, 0);
  }

  public getHighScore(levelId: number): number {
    return this.data.levelHighScores[levelId] || 0;
  }

  public saveLevelResult(levelId: number, score: number, stars: number): void {
    const prevStars = this.data.levelStars[levelId] || 0;
    if (stars > prevStars) {
      this.data.levelStars[levelId] = stars;
    }

    const prevScore = this.data.levelHighScores[levelId] || 0;
    if (score > prevScore) {
      this.data.levelHighScores[levelId] = score;
    }

    // Unlock next level
    if (stars > 0 && levelId >= this.data.highestUnlockedLevel) {
      this.data.highestUnlockedLevel = levelId + 1;
    }

    this.save();
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.data.settings = {
      ...this.data.settings,
      ...newSettings
    };
    this.save();
  }

  public resetProgress(): void {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA));
    this.save();
  }
}
