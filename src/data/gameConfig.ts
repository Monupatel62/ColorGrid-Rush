export const GAME_CONFIG = {
  // Board dimensions
  BOARD_ROWS: 8,
  BOARD_COLS: 8,

  // Tile texture size (used only in BootScene for canvas texture generation)
  TILE_SIZE: 96,

  // Gameplay Scoring
  SCORE_PER_TILE: 60,
  SCORE_SPECIAL_BONUS: 250,
  SCORE_PER_ICE: 150,
  SCORE_REMAINING_MOVE_BONUS: 1000,
  COMBO_MULTIPLIERS: [1, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],

  // Animation Timers (ms)
  SWAP_DURATION: 180,
  INVALID_SWAP_DURATION: 160,
  CLEAR_DURATION: 190,
  FALL_DURATION_PER_ROW: 60,
  REFILL_DURATION: 180,
  COMBO_FLOAT_DURATION: 700,

  // Accessibility & Visuals
  PARTICLE_LIFETIME: 500,
  PARTICLE_COUNT: 12
};

/** Responsive layout computed from live canvas dimensions */
export interface LayoutProfile {
  isDesktop: boolean;
  isMobile:  boolean;
  isTablet:  boolean;

  canvasW: number;
  canvasH: number;

  /** Pixel size of each tile (center-to-center minus spacing) */
  tileSize: number;
  /** Gap between tiles */
  tileSpacing: number;
  /** X of the CENTER of the first column */
  boardStartX: number;
  /** Y of the CENTER of the first row */
  boardStartY: number;
  /** Total board width in pixels */
  boardPixelW: number;
  /** Total board height in pixels */
  boardPixelH: number;
  /** Center X of the board */
  boardCenterX: number;
  /** Center Y of the board */
  boardCenterY: number;
}

/**
 * HUD reserved heights per breakpoint.
 * These must match the actual heights built in HUD.ts so boardStartY
 * is always placed below the HUD with a small gap.
 *
 *  Mobile  : topPanel(112) + gap(10) + objBar(52) + gap(10) = 184 px
 *  Tablet  : topPanel(128) + gap(10) + objBar(52) + gap(10) = 200 px
 *  Desktop : thin bar(50) — side panels hold everything else
 */
export const HUD_HEIGHT = {
  mobile:  184,
  tablet:  200,
  desktop: 50
} as const;

/**
 * Called from every scene's create() using this.scale.width / this.scale.height.
 *
 * Desktop (canvasW ≥ 860):
 *   HTML side-panels hold score/objectives. Canvas is the board-only area.
 *   Board is vertically centred below the 50 px top bar.
 *
 * Tablet (600–859 px):
 *   Portrait canvas, in-canvas HUD above the board.
 *
 * Mobile (< 600 px):
 *   Tight portrait. Tile size is constrained by BOTH available width AND
 *   the remaining height after the HUD so the full 8×8 board always fits.
 */
export function computeLayout(canvasW: number, canvasH: number): LayoutProfile {
  const ROWS = GAME_CONFIG.BOARD_ROWS;
  const COLS = GAME_CONFIG.BOARD_COLS;

  // IMPORTANT: Use window.innerWidth for breakpoint detection, NOT canvasW.
  // On desktop the canvas is only the centre column (~560-700px wide after
  // side panels), so testing canvasW would incorrectly select mobile/tablet mode.
  const screenW   = (typeof window !== 'undefined') ? window.innerWidth : canvasW;
  const isDesktop = screenW >= 960;
  const isTablet  = screenW >= 600 && screenW < 960;
  const isMobile  = !isDesktop && !isTablet;

  let tileSize:    number;
  let tileSpacing: number;
  let boardStartY: number;

  if (isDesktop) {
    // Canvas is the centre column only. Account for tile gaps while sizing so
    // the board fills the stage without ever clipping at any desktop height.
    const usableH = canvasH - HUD_HEIGHT.desktop - 16;
    const usableW = canvasW - 16;
    const gapRatio = 0.055;
    const maxByH  = Math.floor(usableH / (ROWS + (ROWS - 1) * gapRatio));
    const maxByW  = Math.floor(usableW / (COLS + (COLS - 1) * gapRatio));
    tileSize    = Math.min(maxByH, maxByW, 104);
    tileSpacing = Math.round(tileSize * 0.055);

    const totalBoardH = ROWS * tileSize + (ROWS - 1) * tileSpacing;
    // Centre board vertically in usable area below the top bar
    boardStartY = HUD_HEIGHT.desktop + Math.round((usableH - totalBoardH) / 2);

  } else if (isTablet) {
    const hudH    = HUD_HEIGHT.tablet;
    const usableH = canvasH - hudH - 10;
    const usableW = canvasW - 12;
    const maxByW  = Math.floor(usableW / (COLS + (COLS - 1) * 0.07));
    const maxByH  = Math.floor(usableH / (ROWS + (ROWS - 1) * 0.07));
    tileSize    = Math.min(maxByW, maxByH, 68);
    tileSpacing = Math.round(tileSize * 0.07);
    boardStartY = hudH + 4;

  } else {
    // Mobile — strictly bounded by remaining height AND width
    const hudH    = HUD_HEIGHT.mobile;
    const usableH = canvasH - hudH - 10;
    const usableW = canvasW - 10;
    const maxByW  = Math.floor(usableW / (COLS + (COLS - 1) * 0.055));
    const maxByH  = Math.floor(usableH / (ROWS + (ROWS - 1) * 0.055));
    tileSize    = Math.min(maxByW, maxByH, 58);        // hard cap 58px
    tileSpacing = Math.round(tileSize * 0.055);
    boardStartY = hudH + 4;
  }

  const step        = tileSize + tileSpacing;
  const boardPixelW = COLS * tileSize + (COLS - 1) * tileSpacing;
  const boardPixelH = ROWS * tileSize + (ROWS - 1) * tileSpacing;

  // boardStartX / boardStartY are the CENTER of the top-left tile
  const boardStartX = Math.round((canvasW - boardPixelW) / 2) + Math.round(tileSize / 2);
  const correctedY  = boardStartY + Math.round(tileSize / 2);

  return {
    isDesktop,
    isMobile,
    isTablet,
    canvasW,
    canvasH,
    tileSize,
    tileSpacing,
    boardStartX,
    boardStartY:  correctedY,
    boardPixelW,
    boardPixelH,
    boardCenterX: boardStartX + Math.round((COLS - 1) * step / 2),
    boardCenterY: correctedY  + Math.round((ROWS - 1) * step / 2)
  };
}
