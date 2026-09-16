import Phaser from 'phaser';
import { LevelConfig, LevelObjective } from '../data/levels';
import { AudioManager } from '../systems/AudioManager';
import { computeLayout, HUD_HEIGHT } from '../data/gameConfig';

export interface HUDCallbacks {
  onPauseClicked: () => void;
}

export class HUD extends Phaser.GameObjects.Container {
  private scoreText!:  Phaser.GameObjects.Text;
  private movesText!:  Phaser.GameObjects.Text;
  private movesCircle!: Phaser.GameObjects.Graphics;
  private movesCircleCX: number = 0;
  private movesCircleCY: number = 0;
  private movesCircleR:  number = 0;
  private starIcons: Phaser.GameObjects.Sprite[] = [];
  private objectiveTextMap: Map<string, Phaser.GameObjects.Text> = new Map();
  private isDesktopMode: boolean = false;
  private displayedScore: number = 0;      // for animated count-up
  private scoreTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, config: LevelConfig, callbacks: HUDCallbacks) {
    super(scene, 0, 0);

    const W      = scene.scale.width;
    const H      = scene.scale.height;
    const layout = computeLayout(W, H);
    this.isDesktopMode = layout.isDesktop;

    if (layout.isDesktop) {
      this.buildDesktopHUD(scene, W, H, config, callbacks);
    } else {
      this.buildMobileHUD(scene, W, H, layout.tileSize, config, callbacks);
    }

    scene.add.existing(this);
    this.setDepth(100);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DESKTOP HUD  — thin top bar only; real stats live in HTML panels
  // ─────────────────────────────────────────────────────────────────────────────
  private buildDesktopHUD(
    scene: Phaser.Scene, W: number, _H: number,
    config: LevelConfig, callbacks: HUDCallbacks
  ): void {
    const barH = HUD_HEIGHT.desktop;   // 50 px

    // Subtle dark strip
    const bar = scene.add.graphics();
    bar.fillStyle(0x080e1c, 0.90);
    bar.fillRect(0, 0, W, barH);
    bar.lineStyle(1, 0x1e293b, 1);
    bar.lineBetween(0, barH, W, barH);
    this.add(bar);

    // Accent dot
    const dot = scene.add.graphics();
    dot.fillStyle(0x38bdf8, 1);
    dot.fillCircle(13, barH / 2, 5);
    this.add(dot);

    // Level label
    const lvlLabel = scene.add.text(26, barH / 2,
      `LVL ${config.id}  ·  ${config.name.toUpperCase()}`, {
        fontFamily: 'Outfit, sans-serif', fontSize: '15px',
        color: '#94a3b8', fontStyle: 'bold'
      }).setOrigin(0, 0.5);
    this.add(lvlLabel);

    // Pause button — flush right
    const pauseBtn = this.makePauseBtn(scene, W - 36, barH / 2, callbacks);
    this.add(pauseBtn);

    // Off-screen placeholders (mobile-only fields)
    this.scoreText   = scene.add.text(-9999, -9999, '0', { fontSize: '1px', color: '#000' });
    this.movesText   = scene.add.text(-9999, -9999, '0', { fontSize: '1px', color: '#000' });
    this.movesCircle = scene.add.graphics();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MOBILE / TABLET HUD  — full in-canvas score + moves + objectives
  // Heights here MUST match HUD_HEIGHT.mobile / HUD_HEIGHT.tablet in gameConfig.ts
  //   mobile:  topPanel(112) + gap(10) + objBar(52) + gap(10) = 184 px
  //   tablet:  topPanel(128) + gap(10) + objBar(52) + gap(10) = 200 px
  // ─────────────────────────────────────────────────────────────────────────────
  private buildMobileHUD(
    scene: Phaser.Scene, W: number, _H: number,
    tileSize: number, config: LevelConfig, callbacks: HUDCallbacks
  ): void {
    const isTablet  = W >= 600;
    // These values must match HUD_HEIGHT in gameConfig.ts:
    //   HUD_HEIGHT.mobile  = topPanel(112) + gap(10) + objBar(52) + gap(10) = 184
    //   HUD_HEIGHT.tablet  = topPanel(128) + gap(10) + objBar(52) + gap(10) = 200
    const OBJ_BAR_H = 52;
    const OBJ_GAP   = 10;
    const topH      = (isTablet ? HUD_HEIGHT.tablet : HUD_HEIGHT.mobile) - OBJ_BAR_H - OBJ_GAP * 2;
    const objBarH   = OBJ_BAR_H;
    const objBarY   = topH + OBJ_GAP;

    const fs      = isTablet ? '22px' : '19px';
    const titleFs = isTablet ? '14px' : '12px';

    // ── Top panel ──
    const topBg = scene.add.graphics();
    topBg.fillStyle(0x0f172a, 0.92);
    topBg.fillRoundedRect(6, 6, W - 12, topH, 14);
    topBg.lineStyle(1.5, 0x1e293b, 1);
    topBg.strokeRoundedRect(6, 6, W - 12, topH, 14);
    this.add(topBg);

    // Level label
    const lvlLabel = scene.add.text(20, 20,
      `LEVEL ${config.id}: ${config.name.toUpperCase()}`, {
        fontFamily: 'Outfit, sans-serif', fontSize: titleFs,
        color: '#64748b', fontStyle: 'bold'
      });
    this.add(lvlLabel);

    // Pause button
    const pauseBtn = this.makePauseBtn(scene, W - 34, topH / 2 + 6, callbacks);
    this.add(pauseBtn);

    // Score text
    this.scoreText = scene.add.text(20, 44, 'SCORE: 0', {
      fontFamily: 'Outfit, sans-serif', fontSize: fs,
      color: '#38bdf8', fontStyle: 'bold'
    });
    this.add(this.scoreText);

    // Star icons — centre of top panel
    const starSz   = isTablet ? 24 : 20;
    const starGap  = starSz + 5;
    const starsX   = W * 0.50;
    const starsY   = topH * 0.55;
    for (let i = 0; i < 3; i++) {
      const star = scene.add.sprite(starsX + i * starGap, starsY, 'star_empty');
      star.setDisplaySize(starSz, starSz);
      this.starIcons.push(star);
      this.add(star);
    }

    // Moves circle — right side
    const circleR  = Math.min(26, Math.max(22, Math.round(tileSize * 0.36)));
    const circleCX = W - 46;
    const circleCY = topH * 0.56;

    this.movesCircleCX = circleCX;
    this.movesCircleCY = circleCY;
    this.movesCircleR  = circleR;

    this.movesCircle = scene.add.graphics();
    this.drawMovesCircle(this.movesCircle, circleCX, circleCY, circleR, 0x3b82f6, 0x93c5fd);
    this.add(this.movesCircle);

    const movesLbl = scene.add.text(circleCX, circleCY - circleR * 0.52, 'MOVES', {
      fontFamily: 'Outfit, sans-serif', fontSize: '9px',
      color: '#dbeafe', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(movesLbl);

    this.movesText = scene.add.text(circleCX, circleCY + circleR * 0.16, `${config.moves}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: isTablet ? '20px' : '17px',
      color: '#ffffff', fontStyle: '900'
    }).setOrigin(0.5);
    this.add(this.movesText);

    // ── Objectives bar ──
    this.buildObjectivesBar(scene, W, objBarY, objBarH, config.objectives);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Objective cards row
  // ─────────────────────────────────────────────────────────────────────────────
  private buildObjectivesBar(
    scene: Phaser.Scene, W: number, startY: number, cardH: number,
    objectives: LevelObjective[]
  ): void {
    const pad    = 6;
    const totalW = W - 12;
    const n      = objectives.length;
    const cardW  = Math.floor((totalW - pad * (n - 1)) / n);

    objectives.forEach((obj, idx) => {
      const x = 6 + idx * (cardW + pad);
      const y = startY;

      const bg = scene.add.graphics();
      bg.fillStyle(0x1e293b, 0.88);
      bg.fillRoundedRect(x, y, cardW, cardH, 10);
      bg.lineStyle(1.5, 0x334155, 1);
      bg.strokeRoundedRect(x, y, cardW, cardH, 10);
      this.add(bg);

      // Icon
      const iconKey = obj.type === 'collect_color' && obj.color !== undefined
        ? `gem_${obj.color}`
        : obj.type === 'clear_ice' ? 'ice_tile' : 'star_filled';
      const icon = scene.add.sprite(x + 20, y + cardH / 2, iconKey);
      icon.setDisplaySize(28, 28);
      this.add(icon);

      // Progress text
      const txt = scene.add.text(x + 40, y + cardH / 2, `0 / ${obj.target}`, {
        fontFamily: 'Outfit, sans-serif', fontSize: '14px',
        color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      this.add(txt);

      this.objectiveTextMap.set(`${obj.type}_${obj.color ?? ''}`, txt);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared helpers
  // ─────────────────────────────────────────────────────────────────────────────
  private makePauseBtn(
    scene: Phaser.Scene, x: number, y: number,
    callbacks: HUDCallbacks
  ): Phaser.GameObjects.Graphics {
    const r   = 10;
    const sz  = 40;
    const btn = scene.add.graphics();
    btn.fillStyle(0x334155, 0.9);
    btn.fillRoundedRect(x - sz / 2, y - sz / 2, sz, sz, r);
    btn.fillStyle(0xffffff, 1);
    btn.fillRect(x - 8,  y - 10, 4, 20);
    btn.fillRect(x + 4,  y - 10, 4, 20);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - sz / 2, y - sz / 2, sz, sz),
      Phaser.Geom.Rectangle.Contains
    );
    btn.on('pointerdown', () => {
      AudioManager.getInstance().playClick();
      callbacks.onPauseClicked();
    });
    return btn;
  }

  private drawMovesCircle(
    g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number,
    fill: number, stroke: number
  ): void {
    g.clear();
    g.fillStyle(fill, 1);
    g.fillCircle(cx, cy, r);
    g.lineStyle(2.5, stroke, 1);
    g.strokeCircle(cx, cy, r);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public update API (called by PlayScene)
  // ─────────────────────────────────────────────────────────────────────────────
  public updateScore(score: number, stars: number): void {
    if (!this.isDesktopMode) {
      // Animated count-up on mobile in-canvas score text
      if (this.scoreTween) { this.scoreTween.stop(); this.scoreTween = null; }
      const from = this.displayedScore;
      const obj  = { v: from };
      this.scoreTween = this.scene.tweens.add({
        targets:  obj,
        v:        score,
        duration: Math.min(600, Math.abs(score - from) * 0.5 + 150),
        ease:     'Cubic.easeOut',
        onUpdate: () => {
          this.displayedScore = Math.round(obj.v);
          this.scoreText.setText(`SCORE: ${this.displayedScore.toLocaleString()}`);
        },
        onComplete: () => {
          this.displayedScore = score;
          this.scoreText.setText(`SCORE: ${score.toLocaleString()}`);
        }
      });
      this.starIcons.forEach((s, i) =>
        s.setTexture(i < stars ? 'star_filled' : 'star_empty')
      );
    }
    this.bridge()?.updateScore(score);
    this.bridge()?.updateStars(stars);
  }

  public updateMoves(moves: number): void {
    if (!this.isDesktopMode) {
      this.movesText.setText(`${moves}`);
      if (moves <= 5) {
        this.drawMovesCircle(
          this.movesCircle,
          this.movesCircleCX, this.movesCircleCY, this.movesCircleR,
          0xef4444, 0xfca5a5
        );
        this.scene.tweens.add({
          targets: this.movesText, scale: 1.3,
          duration: 140, yoyo: true, ease: 'Cubic.easeOut'
        });
      }
    }
    this.bridge()?.updateMoves(moves);
  }

  public updateObjectives(objectives: LevelObjective[]): void {
    // In-canvas mobile update
    objectives.forEach((obj) => {
      const key = `${obj.type}_${obj.color ?? ''}`;
      const txt = this.objectiveTextMap.get(key);
      if (txt) {
        const done = obj.current >= obj.target;
        txt.setText(done ? '✓ DONE' : `${obj.current} / ${obj.target}`);
        txt.setColor(done ? '#4ade80' : '#ffffff');
      }
    });
    // Bridge for desktop HTML panel
    this.bridge()?.updateObjectives(objectives);
  }

  // Type-safe access to the bridge without repeating casts everywhere
  private bridge(): Window['ColorGridBridge'] {
    return (typeof window !== 'undefined') ? window.ColorGridBridge : undefined;
  }
}
