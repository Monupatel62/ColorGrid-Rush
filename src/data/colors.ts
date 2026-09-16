export enum TileColor {
  RED = 0,
  BLUE = 1,
  GREEN = 2,
  YELLOW = 3,
  PURPLE = 4,
  RAINBOW = 99
}

export enum SpecialType {
  NONE = 'none',
  LINE_HORIZONTAL = 'line_h',
  LINE_VERTICAL = 'line_v',
  BOMB = 'bomb',
  RAINBOW = 'rainbow'
}

export interface ColorDefinition {
  id: TileColor;
  name: string;
  gemName: string;
  hex: number;
  hexString: string;
  symbol: 'diamond' | 'hexagon' | 'circle' | 'star' | 'triangle' | 'spectrum';
  textColor: string;
}

export const TILE_COLORS: Record<TileColor, ColorDefinition> = {
  [TileColor.RED]: {
    id: TileColor.RED,
    name: 'Red',
    gemName: 'Ruby',
    hex: 0xef4444,
    hexString: '#ef4444',
    symbol: 'diamond',
    textColor: '#fee2e2'
  },
  [TileColor.BLUE]: {
    id: TileColor.BLUE,
    name: 'Blue',
    gemName: 'Sapphire',
    hex: 0x3b82f6,
    hexString: '#3b82f6',
    symbol: 'hexagon',
    textColor: '#dbeafe'
  },
  [TileColor.GREEN]: {
    id: TileColor.GREEN,
    name: 'Green',
    gemName: 'Emerald',
    hex: 0x10b981,
    hexString: '#10b981',
    symbol: 'circle',
    textColor: '#d1fae5'
  },
  [TileColor.YELLOW]: {
    id: TileColor.YELLOW,
    name: 'Yellow',
    gemName: 'Topaz',
    hex: 0xf59e0b,
    hexString: '#f59e0b',
    symbol: 'star',
    textColor: '#fef3c7'
  },
  [TileColor.PURPLE]: {
    id: TileColor.PURPLE,
    name: 'Purple',
    gemName: 'Amethyst',
    hex: 0x8b5cf6,
    hexString: '#8b5cf6',
    symbol: 'triangle',
    textColor: '#ede9fe'
  },
  [TileColor.RAINBOW]: {
    id: TileColor.RAINBOW,
    name: 'Rainbow',
    gemName: 'Prism',
    hex: 0xffffff,
    hexString: '#ffffff',
    symbol: 'spectrum',
    textColor: '#ffffff'
  }
};

export const STANDARD_COLORS: TileColor[] = [
  TileColor.RED,
  TileColor.BLUE,
  TileColor.GREEN,
  TileColor.YELLOW,
  TileColor.PURPLE
];
