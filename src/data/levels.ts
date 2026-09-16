import { TileColor } from './colors';

export interface LevelObjective {
  type: 'score' | 'collect_color' | 'clear_ice';
  target: number;
  current: number;
  color?: TileColor;
  label: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  moves: number;
  timeLimitSeconds: number;
  starThresholds: [number, number, number];
  objectives: LevelObjective[];
  // Initial ice layer on the 8x8 grid (0 = no ice, 1 = ice layer)
  iceGrid?: number[][];
  tutorialText?: string;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Gem Novice',
    subtitle: 'Learn the Basics',
    moves: 22,
    timeLimitSeconds: 90,
    starThresholds: [1500, 2500, 4000],
    objectives: [
      { type: 'score', target: 1500, current: 0, label: 'Score 1,500' }
    ],
    tutorialText: 'Swipe adjacent gems to match 3 or more of the same color!'
  },
  {
    id: 2,
    name: 'Ruby Rush',
    subtitle: 'Red Collector',
    moves: 20,
    timeLimitSeconds: 88,
    starThresholds: [2000, 3500, 5000],
    objectives: [
      { type: 'collect_color', target: 18, current: 0, color: TileColor.RED, label: '18 Ruby Gems' }
    ],
    tutorialText: 'Focus on matching Red Ruby gems to reach your target!'
  },
  {
    id: 3,
    name: 'Ocean & Forest',
    subtitle: 'Dual Synergy',
    moves: 22,
    timeLimitSeconds: 86,
    starThresholds: [2500, 4000, 6000],
    objectives: [
      { type: 'collect_color', target: 15, current: 0, color: TileColor.BLUE, label: '15 Sapphire' },
      { type: 'collect_color', target: 15, current: 0, color: TileColor.GREEN, label: '15 Emerald' }
    ],
    tutorialText: 'Complete both color goals within the move limit!'
  },
  {
    id: 4,
    name: 'Laser Beam',
    subtitle: 'Line Power',
    moves: 20,
    timeLimitSeconds: 84,
    starThresholds: [3000, 5000, 7500],
    objectives: [
      { type: 'score', target: 3000, current: 0, label: 'Score 3,000' }
    ],
    tutorialText: 'Match 4 gems in a line to create a Line Blaster laser!'
  },
  {
    id: 5,
    name: 'Ice Breaker',
    subtitle: 'Frozen Ground',
    moves: 24,
    timeLimitSeconds: 82,
    starThresholds: [3500, 5500, 8000],
    iceGrid: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    objectives: [
      { type: 'clear_ice', target: 20, current: 0, label: 'Clear 20 Ice Tiles' }
    ],
    tutorialText: 'Match gems directly on top of frost to break the ice!'
  },
  {
    id: 6,
    name: 'Speed Rush',
    subtitle: 'Tight Turns',
    moves: 15,
    timeLimitSeconds: 80,
    starThresholds: [4000, 6000, 8500],
    objectives: [
      { type: 'score', target: 3500, current: 0, label: 'Score 3,500' },
      { type: 'collect_color', target: 14, current: 0, color: TileColor.YELLOW, label: '14 Topaz Stars' }
    ],
    tutorialText: 'Watch your moves! Look for cascades to multiply your score.'
  },
  {
    id: 7,
    name: 'Frost & Shadow',
    subtitle: 'Amethyst Chill',
    moves: 22,
    timeLimitSeconds: 78,
    starThresholds: [4500, 7000, 9500],
    iceGrid: [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 1, 1]
    ],
    objectives: [
      { type: 'clear_ice', target: 16, current: 0, label: 'Clear 16 Ice Tiles' },
      { type: 'collect_color', target: 16, current: 0, color: TileColor.PURPLE, label: '16 Amethysts' }
    ],
    tutorialText: 'Clear the ice corners while gathering purple triangles!'
  },
  {
    id: 8,
    name: 'Bombastic',
    subtitle: 'Explosive Chain',
    moves: 22,
    timeLimitSeconds: 76,
    starThresholds: [5000, 7500, 11000],
    objectives: [
      { type: 'score', target: 5000, current: 0, label: 'Score 5,000' }
    ],
    tutorialText: 'Match in T or L shapes to create Area Bombs (3x3 blast)!'
  },
  {
    id: 9,
    name: 'Glacier Cross',
    subtitle: 'Deep Freeze',
    moves: 24,
    timeLimitSeconds: 74,
    starThresholds: [6000, 9000, 13000],
    iceGrid: [
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0]
    ],
    objectives: [
      { type: 'clear_ice', target: 24, current: 0, label: 'Clear 24 Ice Tiles' },
      { type: 'collect_color', target: 18, current: 0, color: TileColor.RED, label: '18 Rubies' }
    ],
    tutorialText: 'Combine special tiles together for massive board-clearing effects!'
  },
  {
    id: 10,
    name: 'Grand Color Rush',
    subtitle: 'Master Trial',
    moves: 26,
    timeLimitSeconds: 72,
    starThresholds: [8000, 12000, 17000],
    iceGrid: [
      [1, 0, 1, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [0, 1, 0, 1, 1, 0, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1]
    ],
    objectives: [
      { type: 'score', target: 7000, current: 0, label: 'Score 7,000' },
      { type: 'clear_ice', target: 20, current: 0, label: 'Clear 20 Ice Tiles' },
      { type: 'collect_color', target: 20, current: 0, color: TileColor.BLUE, label: '20 Sapphires' }
    ],
    tutorialText: 'The ultimate challenge: score high, break ice, and collect gems!'
  }
];

function createIceGrid(levelId: number, density: number): number[][] {
  return Array.from({ length: 8 }, (_, row) =>
    Array.from({ length: 8 }, (_, col) => {
      const wave = (row * 13 + col * 7 + levelId * 5) % 100;
      return wave < density ? 1 : 0;
    })
  );
}

function createEndgameLevels(): LevelConfig[] {
  return Array.from({ length: 90 }, (_, index) => {
    const id = index + 11;
    const tier = Math.floor((id - 1) / 10);
    const moves = Math.max(12, 24 - Math.floor((id - 1) / 8));
    const timeLimitSeconds = Math.max(30, 72 - Math.floor((id - 1) * 0.47));
    const scoreTarget = 7000 + (id - 10) * 420;
    const collectTarget = Math.min(32, 18 + Math.floor((id - 10) * 0.16));
    const iceTarget = Math.min(46, 18 + Math.floor((id - 10) * 0.31));
    const objectives: LevelObjective[] = [
      { type: 'score', target: scoreTarget, current: 0, label: `Score ${scoreTarget.toLocaleString()}` },
      { type: 'collect_color', target: collectTarget, current: 0, color: id % 2 ? TileColor.RED : TileColor.BLUE, label: `${collectTarget} Target Gems` }
    ];

    if (tier >= 2) {
      objectives.push({ type: 'clear_ice', target: iceTarget, current: 0, label: `Clear ${iceTarget} Ice Tiles` });
    }

    return {
      id,
      name: `Rush ${id}`,
      subtitle: tier >= 8 ? 'Ultimate Pressure' : `Challenge Tier ${tier}`,
      moves,
      timeLimitSeconds,
      starThresholds: [scoreTarget, Math.round(scoreTarget * 1.45), Math.round(scoreTarget * 2.05)],
      objectives,
      iceGrid: tier >= 2 ? createIceGrid(id, Math.min(72, 30 + tier * 6)) : undefined,
      tutorialText: id === 11 ? 'From here on, every level has a live countdown. Match quickly and plan your cascades!' : undefined
    };
  });
}

LEVELS.push(...createEndgameLevels());
