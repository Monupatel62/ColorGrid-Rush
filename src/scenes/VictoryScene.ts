import Phaser from 'phaser';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';

export interface VictoryData {
  levelId:        number;
  score:          number;
  stars:          number;
  remainingMoves: number;
  moveBonus:      number;
}

export class VictoryScene extends Phaser.Scene {
  private victoryData!: VictoryData;

  constructor() {
    super({ key: 'VictoryScene' });
  }

  public init(data: VictoryData): void {
    this.victoryData = data;
  }

  public create(): void {
    AudioManager.getInstance().playVictory();

    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    // Panel dimensions — clamp to canvas
    const panelW = Math.min(520, W - 32);
    const panelH = Math.min(680, H - 32);

    const modal = new Modal(this, panelW, panelH);

    // Vertical rhythm relative to panel top
    const top   = cy - panelH / 2;
    const titleY  = top + panelH * 0.13;
    const subY    = top + panelH * 0.22;
    const starsY  = top + panelH * 0.34;
    const boxY    = top + panelH * 0.45;
    const boxH    = panelH * 0.22;
    const btn1Y   = top + panelH * 0.73;
    const btn2Y   = top + panelH * 0.85;
    const btn3Y   = top + panelH * 0.94;

    const hasNext = this.victoryData.levelId < 10;

    // ── Title ──
    const title = this.add.text(cx, titleY, 'VICTORY!', {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   this.scalePx(panelH, 48, 32),
      color:      '#facc15',
      fontStyle:  '900',
      stroke:     '#b45309',
      strokeThickness: 6
    }).setOrigin(0.5);
    modal.add(title);

    // ── Subtitle ──
    const subtitle = this.add.text(cx, subY, `LEVEL ${this.victoryData.levelId} COMPLETED`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   this.scalePx(panelH, 19, 14),
      color:      '#94a3b8',
      fontStyle:  'bold'
    }).setOrigin(0.5);
    modal.add(subtitle);

    // ── Stars ──
    const starSpacing = Math.min(70, panelW * 0.14);
    for (let i = 0; i < 3; i++) {
      const starX  = cx + (i - 1) * starSpacing;
      const starSz = Math.min(52, panelW * 0.1);
      const star   = this.add.sprite(starX, starsY, 'star_empty');
      star.setDisplaySize(starSz, starSz);
      modal.add(star);

      if (i < this.victoryData.stars) {
        this.time.delayedCall(300 + i * 240, () => {
          star.setTexture('star_filled');
          AudioManager.getInstance().playMatch(i + 1);
          this.tweens.add({
            targets: star,
            scale:   { from: 1.5, to: 1 },
            duration: 260,
            ease:    'Back.easeOut'
          });
        });
      }
    }

    // ── Score box ──
    const scoreBoxX = cx - panelW * 0.44;
    const scoreBoxW = panelW * 0.88;
    const scoreBox  = this.add.graphics();
    scoreBox.fillStyle(0x1e293b, 0.8);
    scoreBox.fillRoundedRect(scoreBoxX, boxY, scoreBoxW, boxH, 16);
    scoreBox.lineStyle(1.5, 0x334155, 1);
    scoreBox.strokeRoundedRect(scoreBoxX, boxY, scoreBoxW, boxH, 16);
    modal.add(scoreBox);

    const scoreVal = this.add.text(cx, boxY + boxH * 0.28, `${this.victoryData.score.toLocaleString()}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   this.scalePx(panelH, 36, 24),
      color:      '#38bdf8',
      fontStyle:  '900'
    }).setOrigin(0.5);
    modal.add(scoreVal);

    const bonusLabel = this.add.text(
      cx, boxY + boxH * 0.60,
      `Moves Bonus: +${this.victoryData.moveBonus.toLocaleString()} (${this.victoryData.remainingMoves} left)`,
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize:   this.scalePx(panelH, 16, 12),
        color:      '#a7f3d0'
      }
    ).setOrigin(0.5);
    modal.add(bonusLabel);

    const bestScore = SaveManager.getInstance().getHighScore(this.victoryData.levelId);
    const bestLabel = this.add.text(cx, boxY + boxH * 0.82, `Personal Best: ${bestScore.toLocaleString()}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   this.scalePx(panelH, 15, 11),
      color:      '#94a3b8'
    }).setOrigin(0.5);
    modal.add(bestLabel);

    // ── Buttons ──
    const btnW = Math.min(300, panelW * 0.76);

    if (hasNext) {
      const nextBtn = new Button(this, cx, btn1Y, 'NEXT LEVEL →', () => {
        modal.close(() => {
          this.scene.stop();
          this.scene.stop('PlayScene');
          this.scene.start('PlayScene', { levelId: this.victoryData.levelId + 1 });
        });
      }, { width: btnW, height: Math.min(64, panelH * 0.095), primaryColor: 0x10b981, hoverColor: 0x34d399, fontSize: this.scalePx(panelH, 24, 18) });
      modal.add(nextBtn);
    }

    const replayBtn = new Button(this, cx, hasNext ? btn2Y : btn1Y, 'REPLAY', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('PlayScene', { levelId: this.victoryData.levelId });
      });
    }, { width: btnW, height: Math.min(56, panelH * 0.083), primaryColor: 0x3b82f6, hoverColor: 0x60a5fa, fontSize: this.scalePx(panelH, 22, 16) });
    modal.add(replayBtn);

    const levelsBtn = new Button(this, cx, hasNext ? btn3Y : btn2Y, 'LEVEL SELECT', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('LevelSelectScene');
      });
    }, { width: btnW, height: Math.min(50, panelH * 0.075), primaryColor: 0x334155, hoverColor: 0x475569, fontSize: this.scalePx(panelH, 20, 15) });
    modal.add(levelsBtn);
  }

  /** Linearly scale a pixel value between min and max based on panel height */
  private scalePx(panelH: number, ideal: number, minimum: number): string {
    const v = Math.max(minimum, Math.round(ideal * (panelH / 680)));
    return `${v}px`;
  }
}
