import Phaser from 'phaser';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AudioManager } from '../systems/AudioManager';
import { LevelObjective } from '../data/levels';

export interface GameOverData {
  levelId:    number;
  score:      number;
  objectives: LevelObjective[];
  timeExpired?: boolean;
}

export class GameOverScene extends Phaser.Scene {
  private gameOverData!: GameOverData;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  public init(data: GameOverData): void {
    this.gameOverData = data;
  }

  public create(): void {
    AudioManager.getInstance().playGameOver();

    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const panelW = Math.min(500, W - 32);
    const panelH = Math.min(620, H - 32);

    const modal = new Modal(this, panelW, panelH);

    const top   = cy - panelH / 2;

    const titleY  = top + panelH * 0.14;
    const subY    = top + panelH * 0.24;
    const boxY    = top + panelH * 0.34;
    const boxH    = panelH * 0.26;
    const hintY   = top + panelH * 0.66;
    const btn1Y   = top + panelH * 0.77;
    const btn2Y   = top + panelH * 0.88;
    const btn3Y   = top + panelH * 0.96;

    const sp = (ideal: number, min: number) =>
      `${Math.max(min, Math.round(ideal * (panelH / 620)))}px`;

    // ── Title ──
    this.add.text(cx, titleY, this.gameOverData.timeExpired ? 'OUT OF TIME' : 'OUT OF MOVES', {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   sp(40, 26),
      color:      '#ef4444',
      fontStyle:  '900'
    }).setOrigin(0.5);

    modal.add(this.children.getAll().at(-1) as Phaser.GameObjects.GameObject);

    // ── Subtitle ──
    const subtitle = this.add.text(cx, subY, "Don't give up — look for big combos!", {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   sp(17, 12),
      color:      '#94a3b8'
    }).setOrigin(0.5);
    modal.add(subtitle);

    // ── Score box ──
    const bx = cx - panelW * 0.42;
    const bw = panelW * 0.84;
    const box = this.add.graphics();
    box.fillStyle(0x1e293b, 0.8);
    box.fillRoundedRect(bx, boxY, bw, boxH, 16);
    box.lineStyle(1.5, 0x334155, 1);
    box.strokeRoundedRect(bx, boxY, bw, boxH, 16);
    modal.add(box);

    const scoreLbl = this.add.text(cx, boxY + boxH * 0.22, 'FINAL SCORE', {
      fontFamily: 'Outfit, sans-serif', fontSize: sp(15, 11),
      color: '#94a3b8', fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(scoreLbl);

    const scoreVal = this.add.text(cx, boxY + boxH * 0.52, `${this.gameOverData.score.toLocaleString()}`, {
      fontFamily: 'Outfit, sans-serif', fontSize: sp(34, 22),
      color: '#38bdf8', fontStyle: '900'
    }).setOrigin(0.5);
    modal.add(scoreVal);

    // ── Incomplete objectives hint ──
    const incomplete = this.gameOverData.objectives.filter(o => o.current < o.target);
    if (incomplete.length > 0) {
      const hintStr = incomplete.map(o => `${o.label} (${o.current}/${o.target})`).join(' • ');
      const hint = this.add.text(cx, hintY, `Still needed: ${hintStr}`, {
        fontFamily: 'Outfit, sans-serif', fontSize: sp(14, 11),
        color: '#f87171', wordWrap: { width: panelW - 40 }, align: 'center'
      }).setOrigin(0.5);
      modal.add(hint);
    }

    // ── Buttons ──
    const btnW = Math.min(280, panelW * 0.76);
    const bh1  = Math.min(60, panelH * 0.095);
    const bh2  = Math.min(52, panelH * 0.083);
    const bh3  = Math.min(46, panelH * 0.074);

    const retryBtn = new Button(this, cx, btn1Y, 'TRY AGAIN', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('PlayScene', { levelId: this.gameOverData.levelId });
      });
    }, { width: btnW, height: bh1, primaryColor: 0xef4444, hoverColor: 0xf87171, fontSize: sp(24, 17) });
    modal.add(retryBtn);

    const levelsBtn = new Button(this, cx, btn2Y, 'LEVEL SELECT', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('LevelSelectScene');
      });
    }, { width: btnW, height: bh2, primaryColor: 0x3b82f6, hoverColor: 0x60a5fa, fontSize: sp(21, 15) });
    modal.add(levelsBtn);

    const menuBtn = new Button(this, cx, btn3Y, 'MAIN MENU', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('MainMenuScene');
      });
    }, { width: btnW, height: bh3, primaryColor: 0x334155, hoverColor: 0x475569, fontSize: sp(19, 14) });
    modal.add(menuBtn);
  }
}
