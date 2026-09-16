import Phaser from 'phaser';
import { Tile } from './Tile';
import { TileColor, SpecialType, STANDARD_COLORS } from '../data/colors';
import { GAME_CONFIG, computeLayout, LayoutProfile } from '../data/gameConfig';
import { BoardGenerator } from './BoardGenerator';
import { MatchDetector, GridCell } from './MatchDetector';
import { BoardRefill } from './BoardRefill';
import { LevelConfig } from '../data/levels';
import { AudioManager } from '../systems/AudioManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { areAdjacent } from '../utils/math';

export interface BoardCallbacks {
  onScoreAdded: (points: number, reason: string) => void;
  onTilesMatched: (cells: GridCell[]) => void;
  onIceBroken: (row: number, col: number) => void;
  onMoveCompleted: () => void;
  onCombo: (combo: number, x: number, y: number) => void;
}

export class Board {
  private scene: Phaser.Scene;
  private particles: ParticleSystem;
  private callbacks: BoardCallbacks;

  private layout!: LayoutProfile;
  private rows: number = GAME_CONFIG.BOARD_ROWS;
  private cols: number = GAME_CONFIG.BOARD_COLS;

  private tiles: (Tile | null)[][] = [];
  private iceSprites: (Phaser.GameObjects.Sprite | null)[][] = [];
  private slotSprites: Phaser.GameObjects.Sprite[] = [];
  private isBusy: boolean = false;
  private selectedTile: Tile | null = null;
  private comboCount: number = 0;
  private hintTimer: Phaser.Time.TimerEvent | null = null;
  private hintedTiles: [Tile, Tile] | null = null;

  constructor(scene: Phaser.Scene, particles: ParticleSystem, callbacks: BoardCallbacks) {
    this.scene = scene;
    this.particles = particles;
    this.callbacks = callbacks;
  }

  public init(config: LevelConfig): void {
    this.clearBoard();
    this.layout = computeLayout(this.scene.scale.width, this.scene.scale.height);
    this.scheduleHint();

    // 1. Draw background slots and ice overlays
    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      this.iceSprites[r] = [];

      for (let c = 0; c < this.cols; c++) {
        const pos = this.gridToPixel(r, c);

        const slot = this.scene.add.sprite(pos.x, pos.y, 'board_slot');
        slot.setDisplaySize(this.layout.tileSize, this.layout.tileSize);
        slot.setDepth(1);
        this.slotSprites.push(slot);

        if (config.iceGrid && config.iceGrid[r] && config.iceGrid[r][c] > 0) {
          const ice = this.scene.add.sprite(pos.x, pos.y, 'ice_tile');
          ice.setDisplaySize(this.layout.tileSize, this.layout.tileSize);
          ice.setDepth(2);
          this.iceSprites[r][c] = ice;
        } else {
          this.iceSprites[r][c] = null;
        }
      }
    }

    // 2. Generate starting tile grid
    const generatedGrid = BoardGenerator.generateBoard(this.rows, this.cols, STANDARD_COLORS);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = generatedGrid[r][c];
        const pos  = this.gridToPixel(r, c);
        const tile = new Tile(this.scene, pos.x, pos.y, r, c, cell.color, cell.special, this.layout.tileSize);
        tile.setDepth(10);
        this.tiles[r][c] = tile;
      }
    }
  }

  public getLayout(): LayoutProfile {
    return this.layout;
  }

  public gridToPixel(row: number, col: number): { x: number; y: number } {
    const step = this.layout.tileSize + this.layout.tileSpacing;
    return {
      x: this.layout.boardStartX + col * step,
      y: this.layout.boardStartY + row * step
    };
  }

  public pixelToGrid(x: number, y: number): { row: number; col: number } | null {
    const step    = this.layout.tileSize + this.layout.tileSpacing;
    const halfT   = this.layout.tileSize / 2;
    const col     = Math.round((x - this.layout.boardStartX) / step);
    const row     = Math.round((y - this.layout.boardStartY) / step);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      const center = this.gridToPixel(row, col);
      if (Math.abs(x - center.x) <= halfT + 4 && Math.abs(y - center.y) <= halfT + 4) {
        return { row, col };
      }
    }
    return null;
  }

  public getTileAt(row: number, col: number): Tile | null {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.tiles[row][col];
    }
    return null;
  }

  public handleTileClick(tile: Tile): void {
    if (this.isBusy) return;
    this.clearHint();

    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.setSelected(true);
      AudioManager.getInstance().playClick();
      return;
    }

    if (this.selectedTile === tile) {
      this.selectedTile.setSelected(false);
      this.selectedTile = null;
      return;
    }

    if (areAdjacent(this.selectedTile.gridRow, this.selectedTile.gridCol, tile.gridRow, tile.gridCol)) {
      const first  = this.selectedTile;
      const second = tile;
      first.setSelected(false);
      this.selectedTile = null;
      this.attemptSwap(first, second);
    } else {
      this.selectedTile.setSelected(false);
      this.selectedTile = tile;
      tile.setSelected(true);
      AudioManager.getInstance().playClick();
    }
  }

  public handleSwipe(fromTile: Tile, dirRow: number, dirCol: number): void {
    if (this.isBusy) return;
    this.clearHint();
    const targetRow  = fromTile.gridRow + dirRow;
    const targetCol  = fromTile.gridCol + dirCol;
    const targetTile = this.getTileAt(targetRow, targetCol);
    if (targetTile) {
      if (this.selectedTile) {
        this.selectedTile.setSelected(false);
        this.selectedTile = null;
      }
      this.attemptSwap(fromTile, targetTile);
    }
  }

  private attemptSwap(tileA: Tile, tileB: Tile): void {
    this.isBusy = true;
    AudioManager.getInstance().playSwap();

    const rA = tileA.gridRow, cA = tileA.gridCol;
    const rB = tileB.gridRow, cB = tileB.gridCol;
    const posA = this.gridToPixel(rA, cA);
    const posB = this.gridToPixel(rB, cB);

    this.scene.tweens.add({
      targets: tileA, x: posB.x, y: posB.y,
      duration: GAME_CONFIG.SWAP_DURATION, ease: 'Cubic.easeOut'
    });

    this.scene.tweens.add({
      targets: tileB, x: posA.x, y: posA.y,
      duration: GAME_CONFIG.SWAP_DURATION, ease: 'Cubic.easeOut',
      onComplete: () => {
        tileA.setGridPosition(rB, cB);
        tileB.setGridPosition(rA, cA);
        this.tiles[rA][cA] = tileB;
        this.tiles[rB][cB] = tileA;

        if (this.checkSpecialCombination(tileA, tileB)) {
          this.callbacks.onMoveCompleted();
          return;
        }

        if (tileA.special === SpecialType.RAINBOW || tileB.special === SpecialType.RAINBOW) {
          this.triggerRainbowSwap(tileA, tileB);
          this.callbacks.onMoveCompleted();
          return;
        }

        const gridState   = this.toGridCellMatrix();
        const matchResult = MatchDetector.findMatches(gridState, { row: rB, col: cB }, { row: rA, col: cA });

        if (matchResult.hasMatches) {
          this.comboCount = 0;
          this.callbacks.onMoveCompleted();
          this.resolveMatches(matchResult);
        } else {
          this.revertSwap(tileA, tileB, posA, posB, rA, cA, rB, cB);
        }
      }
    });
  }

  private revertSwap(
    tileA: Tile, tileB: Tile,
    posA: { x: number; y: number }, posB: { x: number; y: number },
    origRA: number, origCA: number, origRB: number, origCB: number
  ): void {
    // Snap back to original positions
    this.scene.tweens.add({
      targets: tileA, x: posA.x, y: posA.y,
      duration: GAME_CONFIG.INVALID_SWAP_DURATION, ease: 'Cubic.easeOut'
    });
    this.scene.tweens.add({
      targets: tileB, x: posB.x, y: posB.y,
      duration: GAME_CONFIG.INVALID_SWAP_DURATION, ease: 'Cubic.easeOut',
      onComplete: () => {
        tileA.setGridPosition(origRA, origCA);
        tileB.setGridPosition(origRB, origCB);
        this.tiles[origRA][origCA] = tileA;
        this.tiles[origRB][origCB] = tileB;
        // Visual + audio feedback for invalid move
        tileA.shakeInvalid();
        tileB.shakeInvalid();
        this.isBusy = false;
      }
    });
  }

  private checkSpecialCombination(tileA: Tile, tileB: Tile): boolean {
    const isSpecial = (t: Tile) => t.special !== SpecialType.NONE;
    if (!isSpecial(tileA) || !isSpecial(tileB)) return false;

    if (tileA.special === SpecialType.RAINBOW && tileB.special === SpecialType.RAINBOW) {
      AudioManager.getInstance().playRainbow();
      this.clearEntireBoard();
      return true;
    }
    if (tileA.special === SpecialType.BOMB && tileB.special === SpecialType.BOMB) {
      AudioManager.getInstance().playBomb();
      this.detonateMegaBomb(tileA.gridRow, tileA.gridCol);
      return true;
    }
    if (
      (tileA.special === SpecialType.LINE_HORIZONTAL || tileA.special === SpecialType.LINE_VERTICAL) &&
      (tileB.special === SpecialType.LINE_HORIZONTAL || tileB.special === SpecialType.LINE_VERTICAL)
    ) {
      AudioManager.getInstance().playLineBlaster();
      this.detonateCrossBlaster(tileA.gridRow, tileA.gridCol);
      return true;
    }
    if (
      (tileA.special === SpecialType.BOMB && (tileB.special === SpecialType.LINE_HORIZONTAL || tileB.special === SpecialType.LINE_VERTICAL)) ||
      (tileB.special === SpecialType.BOMB && (tileA.special === SpecialType.LINE_HORIZONTAL || tileA.special === SpecialType.LINE_VERTICAL))
    ) {
      AudioManager.getInstance().playLineBlaster();
      this.detonateMegaBlaster(tileA.gridRow, tileA.gridCol);
      return true;
    }
    return false;
  }

  private triggerRainbowSwap(tileA: Tile, tileB: Tile): void {
    const other = tileA.special === SpecialType.RAINBOW ? tileB : tileA;
    AudioManager.getInstance().playRainbow();
    this.clearTilesByColor(other.tileColor);
  }

  private resolveMatches(matchResult: {
    matchedCells: GridCell[];
    clearedCells: GridCell[];
    specialSpawns: { row: number; col: number; color: TileColor; special: SpecialType }[];
  }): void {
    this.comboCount++;
    AudioManager.getInstance().playMatch(this.comboCount);

    const matchCenter = matchResult.matchedCells[0];
    const pos = this.gridToPixel(matchCenter.row, matchCenter.col);
    if (this.comboCount > 1) this.callbacks.onCombo(this.comboCount, pos.x, pos.y);

    this.callbacks.onTilesMatched(matchResult.matchedCells);
    this.callbacks.onScoreAdded(matchResult.matchedCells.length * GAME_CONFIG.SCORE_PER_TILE, 'match');

    const toClearCoords = new Set<string>();
    matchResult.clearedCells.forEach((c) => toClearCoords.add(`${c.row},${c.col}`));

    matchResult.clearedCells.forEach((c) => {
      const tile = this.tiles[c.row][c.col];
      if (tile) {
        if (tile.special === SpecialType.LINE_HORIZONTAL) this.triggerLineSpecial(c.row, c.col, true,  toClearCoords);
        else if (tile.special === SpecialType.LINE_VERTICAL)   this.triggerLineSpecial(c.row, c.col, false, toClearCoords);
        else if (tile.special === SpecialType.BOMB)            this.triggerBombSpecial(c.row, c.col, toClearCoords);
      }
    });

    toClearCoords.forEach((coordStr) => {
      const [rStr, cStr] = coordStr.split(',');
      const r = parseInt(rStr, 10), c = parseInt(cStr, 10);
      this.breakIceAt(r, c);
      const tile = this.tiles[r][c];
      if (tile) {
        const p = this.gridToPixel(r, c);
        this.particles.emitMatchBurst(p.x, p.y, tile.tileColor);
        tile.animatePop();
        this.tiles[r][c] = null;
      }
    });

    matchResult.specialSpawns.forEach((spawn) => {
      const current = this.tiles[spawn.row][spawn.col];
      if (current) {
        current.setColor(spawn.color);
        current.setSpecial(spawn.special);
        this.scene.tweens.add({ targets: current, scale: 1.3, duration: 150, yoyo: true });
      } else {
        const p = this.gridToPixel(spawn.row, spawn.col);
        const newTile = new Tile(this.scene, p.x, p.y, spawn.row, spawn.col, spawn.color, spawn.special, this.layout.tileSize);
        newTile.setDepth(10);
        this.tiles[spawn.row][spawn.col] = newTile;
      }
      this.callbacks.onScoreAdded(GAME_CONFIG.SCORE_SPECIAL_BONUS, 'special_created');
    });

    this.scene.time.delayedCall(GAME_CONFIG.CLEAR_DURATION, () => this.applyGravityAndRefill());
  }

  private triggerLineSpecial(row: number, col: number, isHorizontal: boolean, toClear: Set<string>): void {
    AudioManager.getInstance().playLineBlaster();
    const p = this.gridToPixel(row, col);
    this.particles.emitLineBlast(p.x, p.y, isHorizontal);
    if (isHorizontal) { for (let c = 0; c < this.cols; c++) toClear.add(`${row},${c}`); }
    else              { for (let r = 0; r < this.rows; r++) toClear.add(`${r},${col}`); }
    this.callbacks.onScoreAdded(GAME_CONFIG.SCORE_SPECIAL_BONUS, 'line_blast');
  }

  private triggerBombSpecial(row: number, col: number, toClear: Set<string>): void {
    AudioManager.getInstance().playBomb();
    const p = this.gridToPixel(row, col);
    this.particles.emitBombExplosion(p.x, p.y);
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++)
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++)
        toClear.add(`${r},${c}`);
    this.callbacks.onScoreAdded(GAME_CONFIG.SCORE_SPECIAL_BONUS, 'bomb_blast');
  }

  private breakIceAt(row: number, col: number): void {
    if (this.iceSprites[row] && this.iceSprites[row][col]) {
      const sprite = this.iceSprites[row][col]!;
      this.scene.tweens.add({
        targets: sprite, alpha: 0, scale: 1.2, duration: 200,
        onComplete: () => { sprite.destroy(); this.iceSprites[row][col] = null; }
      });
      this.callbacks.onIceBroken(row, col);
      this.callbacks.onScoreAdded(GAME_CONFIG.SCORE_PER_ICE, 'ice_break');
    }
  }

  private applyGravityAndRefill(): void {
    const gridState: (GridCell | null)[][] = [];
    for (let r = 0; r < this.rows; r++) {
      gridState[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        gridState[r][c] = t ? { row: r, col: c, color: t.tileColor, special: t.special } : null;
      }
    }

    const plan = BoardRefill.executeRefill(gridState, STANDARD_COLORS);

    plan.drops.forEach((drop) => {
      const tile = this.tiles[drop.fromRow][drop.col]!;
      this.tiles[drop.fromRow][drop.col] = null;
      this.tiles[drop.toRow][drop.col] = tile;
      tile.setGridPosition(drop.toRow, drop.col);
      const targetPos = this.gridToPixel(drop.toRow, drop.col);
      this.scene.tweens.add({
        targets: tile, y: targetPos.y,
        duration: (drop.toRow - drop.fromRow) * GAME_CONFIG.FALL_DURATION_PER_ROW,
        ease: 'Bounce.easeOut'
      });
    });

    plan.spawns.forEach((spawn) => {
      const spawnPixel  = this.gridToPixel(spawn.spawnRow, spawn.col);
      const targetPixel = this.gridToPixel(spawn.toRow, spawn.col);
      const newTile = new Tile(
        this.scene, spawnPixel.x, spawnPixel.y,
        spawn.toRow, spawn.col, spawn.cell.color, spawn.cell.special, this.layout.tileSize
      );
      newTile.setDepth(10);
      this.tiles[spawn.toRow][spawn.col] = newTile;
      this.scene.tweens.add({
        targets: newTile, y: targetPixel.y,
        duration: Math.abs(spawn.toRow - spawn.spawnRow) * GAME_CONFIG.FALL_DURATION_PER_ROW + 100,
        ease: 'Bounce.easeOut'
      });
    });

    const maxDist    = Math.max(
      ...plan.drops.map((d) => d.toRow - d.fromRow),
      ...plan.spawns.map((s) => s.toRow - s.spawnRow),
      1
    );
    const waitTime   = maxDist * GAME_CONFIG.FALL_DURATION_PER_ROW + 150;

    this.scene.time.delayedCall(waitTime, () => {
      const nextGrid      = this.toGridCellMatrix();
      const cascadeResult = MatchDetector.findMatches(nextGrid);
      if (cascadeResult.hasMatches) {
        this.resolveMatches(cascadeResult);
      } else {
        this.ensureValidMoves();
        this.isBusy = false;
      }
    });
  }

  private ensureValidMoves(): void {
    if (!BoardGenerator.hasValidMoves(this.toGridCellMatrix())) {
      this.showReshuffleBanner();
    }
  }

  private scheduleHint(delay: number = 4500): void {
    if (this.hintTimer) this.hintTimer.remove(false);
    this.hintTimer = this.scene.time.delayedCall(delay, () => {
      this.hintTimer = null;
      if (!this.isBusy && !this.selectedTile) this.showHint();
      else this.scheduleHint(1000);
    });
  }

  private showHint(): void {
    const move = BoardGenerator.findValidMove(this.toGridCellMatrix());
    if (!move) return;

    const first = this.getTileAt(move[0].row, move[0].col);
    const second = this.getTileAt(move[1].row, move[1].col);
    if (!first || !second) return;

    this.hintedTiles = [first, second];
    first.showHint();
    second.showHint();
    this.scheduleHint(9000);
  }

  private clearHint(): void {
    if (this.hintTimer) {
      this.hintTimer.remove(false);
      this.hintTimer = null;
    }
    if (this.hintedTiles) {
      this.hintedTiles[0].clearHint();
      this.hintedTiles[1].clearHint();
      this.hintedTiles = null;
    }
    this.scheduleHint();
  }

  private showReshuffleBanner(): void {
    const cx = this.scene.scale.width  / 2;
    const cy = this.scene.scale.height / 2;
    const text = this.scene.add.text(cx, cy, 'NO MOVES!\nRESHUFFLING...', {
      fontSize: `${Math.round(this.layout.tileSize * 0.55)}px`,
      color: '#facc15', fontStyle: 'bold', align: 'center',
      stroke: '#000000', strokeThickness: 6
    });
    text.setOrigin(0.5).setDepth(100);
    this.scene.tweens.add({
      targets: text, scale: 1.2, duration: 500, yoyo: true,
      onComplete: () => { text.destroy(); this.reshuffle(); }
    });
  }

  private reshuffle(): void {
    const newGrid = BoardGenerator.generateBoard(this.rows, this.cols, STANDARD_COLORS);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.tiles[r][c]) this.tiles[r][c]!.setColor(newGrid[r][c].color);
  }

  private clearEntireBoard(): void {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        this.breakIceAt(r, c);
        const tile = this.tiles[r][c];
        if (tile) {
          const p = this.gridToPixel(r, c);
          this.particles.emitMatchBurst(p.x, p.y, tile.tileColor);
          tile.animatePop(); this.tiles[r][c] = null;
        }
      }
    this.callbacks.onScoreAdded(3000, 'rainbow_board_clear');
    this.scene.time.delayedCall(300, () => this.applyGravityAndRefill());
  }

  private detonateMegaBomb(centerR: number, centerC: number): void {
    for (let r = Math.max(0, centerR - 2); r <= Math.min(this.rows - 1, centerR + 2); r++)
      for (let c = Math.max(0, centerC - 2); c <= Math.min(this.cols - 1, centerC + 2); c++) {
        this.breakIceAt(r, c);
        const tile = this.tiles[r][c];
        if (tile) {
          const p = this.gridToPixel(r, c);
          this.particles.emitBombExplosion(p.x, p.y);
          tile.animatePop(); this.tiles[r][c] = null;
        }
      }
    this.callbacks.onScoreAdded(1200, 'mega_bomb');
    this.scene.time.delayedCall(300, () => this.applyGravityAndRefill());
  }

  private detonateCrossBlaster(row: number, col: number): void {
    const toClear = new Set<string>();
    for (let c = 0; c < this.cols; c++) toClear.add(`${row},${c}`);
    for (let r = 0; r < this.rows; r++) toClear.add(`${r},${col}`);
    toClear.forEach((coord) => {
      const [r, c] = coord.split(',').map((v) => parseInt(v, 10));
      this.breakIceAt(r, c);
      const tile = this.tiles[r][c];
      if (tile) {
        const p = this.gridToPixel(r, c);
        this.particles.emitMatchBurst(p.x, p.y, tile.tileColor);
        tile.animatePop(); this.tiles[r][c] = null;
      }
    });
    this.callbacks.onScoreAdded(800, 'cross_blaster');
    this.scene.time.delayedCall(300, () => this.applyGravityAndRefill());
  }

  private detonateMegaBlaster(row: number, col: number): void {
    const toClear = new Set<string>();
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r++)
      for (let c = 0; c < this.cols; c++) toClear.add(`${r},${c}`);
    for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c++)
      for (let r = 0; r < this.rows; r++) toClear.add(`${r},${c}`);
    toClear.forEach((coord) => {
      const [r, c] = coord.split(',').map((v) => parseInt(v, 10));
      this.breakIceAt(r, c);
      const tile = this.tiles[r][c];
      if (tile) {
        const p = this.gridToPixel(r, c);
        this.particles.emitMatchBurst(p.x, p.y, tile.tileColor);
        tile.animatePop(); this.tiles[r][c] = null;
      }
    });
    this.callbacks.onScoreAdded(1500, 'mega_blaster');
    this.scene.time.delayedCall(300, () => this.applyGravityAndRefill());
  }

  private clearTilesByColor(targetColor: TileColor): void {
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++) {
        const tile = this.tiles[r][c];
        if (tile && (tile.tileColor === targetColor || tile.special === SpecialType.RAINBOW)) {
          this.breakIceAt(r, c);
          const p = this.gridToPixel(r, c);
          this.particles.emitMatchBurst(p.x, p.y, tile.tileColor);
          tile.animatePop(); this.tiles[r][c] = null;
        }
      }
    this.callbacks.onScoreAdded(1000, 'rainbow_color_clear');
    this.scene.time.delayedCall(300, () => this.applyGravityAndRefill());
  }

  private toGridCellMatrix(): GridCell[][] {
    const matrix: GridCell[][] = [];
    for (let r = 0; r < this.rows; r++) {
      matrix[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        matrix[r][c] = {
          row: r, col: c,
          color:   t ? t.tileColor : TileColor.RED,
          special: t ? t.special   : SpecialType.NONE
        };
      }
    }
    return matrix;
  }

  private clearBoard(): void {
    if (this.hintTimer) {
      this.hintTimer.remove(false);
      this.hintTimer = null;
    }
    this.hintedTiles = null;
    this.slotSprites.forEach((s) => s.destroy());
    this.slotSprites = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[r]?.[c])      { this.tiles[r][c]!.destroy();      this.tiles[r][c]      = null; }
        if (this.iceSprites[r]?.[c]) { this.iceSprites[r][c]!.destroy(); this.iceSprites[r][c] = null; }
      }
    }
  }
}
