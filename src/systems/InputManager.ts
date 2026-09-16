import Phaser from 'phaser';
import { Board } from '../board/Board';
import { triggerHaptic } from '../utils/feedback';

export class InputManager {
  private scene: Phaser.Scene;
  private board: Board;

  private isDragging: boolean = false;
  private startPointerX: number = 0;
  private startPointerY: number = 0;
  private startGridCoord: { row: number; col: number } | null = null;
  private readonly SWIPE_THRESHOLD: number = 20;

  constructor(scene: Phaser.Scene, board: Board) {
    this.scene = scene;
    this.board = board;
    this.setupInputListeners();
  }

  private setupInputListeners(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const coord = this.board.pixelToGrid(pointer.x, pointer.y);
      if (coord) {
        this.isDragging = true;
        this.startPointerX  = pointer.x;
        this.startPointerY  = pointer.y;
        this.startGridCoord = coord;
        const tile = this.board.getTileAt(coord.row, coord.col);
        if (tile) {
          this.board.handleTileClick(tile);
          triggerHaptic();
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.startGridCoord) return;
      const dx = pointer.x - this.startPointerX;
      const dy = pointer.y - this.startPointerY;

      // Adaptive swipe threshold based on tile size
      const tileSize = this.board.getLayout().tileSize;
      const threshold = Math.max(this.SWIPE_THRESHOLD, tileSize * 0.28);

      if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) {
        let dirRow = 0, dirCol = 0;
        if (Math.abs(dx) > Math.abs(dy)) dirCol = dx > 0 ? 1 : -1;
        else dirRow = dy > 0 ? 1 : -1;

        const tile = this.board.getTileAt(this.startGridCoord.row, this.startGridCoord.col);
        if (tile) {
          this.board.handleSwipe(tile, dirRow, dirCol);
          triggerHaptic(28);
        }

        this.isDragging = false;
        this.startGridCoord = null;
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
      this.startGridCoord = null;
    });
  }

  public destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
  }
}
