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
