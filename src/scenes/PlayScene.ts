import Phaser from 'phaser';
import { Board } from '../board/Board';
import { HUD } from '../ui/HUD';
import { InputManager } from '../systems/InputManager';
import { ScoreSystem } from '../systems/ScoreSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';
import { LEVELS, LevelConfig } from '../data/levels';
import { GridCell } from '../board/MatchDetector';
import { computeLayout } from '../data/gameConfig';
import { syncCanvasSize } from '../utils/syncCanvasSize';

declare global {
  interface Window {
    ColorGridBridge?: {
      updateScore:      (s: number) => void;
      updateStars:      (s: number) => void;
      updateMoves:      (m: number) => void;
      updateLevel:      (id: number, name: string) => void;
      updateObjectives: (o: object[]) => void;
      updateBest:       (s: number) => void;
      setDesktopMode:   (mode: 'menu' | 'play') => void;
      onPauseClick:     (() => void) | null;
      onRestartClick:   (() => void) | null;
      onMenuClick:      (() => void) | null;
      onLevelsClick:    (() => void) | null;
      onSettingsClick:  (() => void) | null;
      onSfxToggle:      ((v: boolean) => void) | null;
      onMusicToggle:    ((v: boolean) => void) | null;
    };
  }
}

export class PlayScene extends Phaser.Scene {
  private levelConfig!:    LevelConfig;
  private scoreSystem!:    ScoreSystem;
  private levelSystem!:    LevelSystem;
  private particleSystem!: ParticleSystem;
  private board!:          Board;
  private hud!:            HUD;
  private inputManager!:   InputManager;
  private isLevelEnding:   boolean = false;

  constructor() {
    super({ key: 'PlayScene' });
  }

  public init(data: { levelId?: number }): void {
    const id         = data.levelId || 1;
    this.levelConfig  = LEVELS.find((l) => l.id === id) || LEVELS[0];
    this.isLevelEnding = false;
  }

  public create(): void {
    window.ColorGridBridge?.setDesktopMode('play');
    const size   = syncCanvasSize(this);
    const W      = size.width;
    const H      = size.height;
    const layout = computeLayout(W, H);

    // ── Background ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x111827, 0x111827, 1);
    bg.fillRect(0, 0, W, H);
    bg.setDepth(0);

    // Subtle board-area dark card (drawn before HUD + board so depth is correct)
    this.drawBoardCard(layout);

    // Subtle floating gems on desktop (purely decorative)
    if (layout.isDesktop) {
      this.drawBgDecor(W, H);
    }

    // ── 1. Audio ──
    if (SaveManager.getInstance().getData().settings.musicEnabled) {
      AudioManager.getInstance().startMusic();
    }

    // ── 2. Systems ──
    this.scoreSystem    = new ScoreSystem(this.levelConfig.starThresholds);
    this.levelSystem    = new LevelSystem(this.levelConfig);
    this.particleSystem = new ParticleSystem(this);

    // ── 3. HUD ──
    this.hud = new HUD(this, this.levelConfig, {
      onPauseClicked: () => this.pauseGame()
    });

    // ── 4. Board ──
    this.board = new Board(this, this.particleSystem, {
      // Board.ts calls onScoreAdded(points, reason) — accept both params
      onScoreAdded: (points: number, _reason: string) => {
        const tileCount = Math.round(points / 60);
        this.scoreSystem.addMatchScore(tileCount);
        this.levelSystem.updateScoreProgress(this.scoreSystem.getScore());
        this.hud.updateScore(this.scoreSystem.getScore(), this.scoreSystem.getStars());
        this.hud.updateObjectives(this.levelSystem.getObjectives());
      },
      onTilesMatched: (cells: GridCell[]) => {
        this.levelSystem.recordTileMatches(cells);
        this.hud.updateObjectives(this.levelSystem.getObjectives());
      },
      onIceBroken: (row: number, col: number) => {
        this.levelSystem.breakIce(row, col);
        this.hud.updateObjectives(this.levelSystem.getObjectives());
      },
      onMoveCompleted: () => {
        const moves = this.levelSystem.decrementMoves();
        this.hud.updateMoves(moves);
        this.checkGameStatus();
      },
      onCombo: (combo: number, x: number, y: number) => {
        this.showComboCallout(combo, x, y);
      }
    });

    this.board.init(this.levelConfig);

    // ── 5. Input ──
    this.inputManager = new InputManager(this, this.board);

    // ── 6. Desktop HTML bridge callbacks ──
    this.wireDesktopBridge();

    // ── 7. Tutorial banner ──
    if (this.levelConfig.tutorialText) {
      this.showTutorialBanner(this.levelConfig.tutorialText, layout);
    }

    // ── 8. Push initial state to HTML panels ──
    if (window.ColorGridBridge) {
      window.ColorGridBridge.updateLevel(this.levelConfig.id, this.levelConfig.name);
      window.ColorGridBridge.updateMoves(this.levelConfig.moves);
      window.ColorGridBridge.updateScore(0);
      window.ColorGridBridge.updateStars(0);
      window.ColorGridBridge.updateObjectives(this.levelSystem.getObjectives());
      window.ColorGridBridge.updateBest(
        SaveManager.getInstance().getHighScore(this.levelConfig.id)
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private drawBoardCard(layout: ReturnType<typeof computeLayout>): void {
    // Subtle dark card behind the board grid — gives depth separation
    const pad  = Math.round(layout.tileSize * 0.25);
    const x    = layout.boardStartX - Math.round(layout.tileSize / 2) - pad;
    const y    = layout.boardStartY - Math.round(layout.tileSize / 2) - pad;
    const w    = layout.boardPixelW + pad * 2;
    const h    = layout.boardPixelH + pad * 2;
    const r    = Math.round(layout.tileSize * 0.22);

    const card = this.add.graphics();
    // Shadow layer
    card.fillStyle(0x000000, 0.45);
    card.fillRoundedRect(x + 4, y + 6, w, h, r + 2);
    // Main card face
    card.fillStyle(0x080e1c, 0.70);
    card.fillRoundedRect(x, y, w, h, r);
    // Subtle border
    card.lineStyle(1.5, 0x1e293b, 0.9);
    card.strokeRoundedRect(x, y, w, h, r);
    card.setDepth(0.8);
  }

  private drawBgDecor(W: number, H: number): void {
    // Very subtle — low alpha, placed only in the margins outside the board area
    const layout   = computeLayout(W, H);
    const gemTypes = ['gem_0', 'gem_1', 'gem_2', 'gem_3', 'gem_4'];
    const margin   = 24; // stay near edges, away from board

    // Four corner zones only
    const zones = [
      { x1: margin,                 x2: layout.boardStartX - layout.tileSize,  y1: margin, y2: H - margin },
      { x1: layout.boardStartX + layout.boardPixelW, x2: W - margin,           y1: margin, y2: H - margin },
    ];

    let placed = 0;
    for (const zone of zones) {
      if (zone.x2 - zone.x1 < 20) continue; // not enough room
      const count = 3;
      for (let i = 0; i < count && placed < 6; i++) {
        const x   = Phaser.Math.Between(Math.ceil(zone.x1), Math.floor(zone.x2));
        const y   = Phaser.Math.Between(Math.ceil(zone.y1), Math.floor(zone.y2));
        const gem = this.add.sprite(x, y, gemTypes[placed % gemTypes.length]);
        gem.setAlpha(0.04);
        gem.setScale(Phaser.Math.FloatBetween(0.3, 0.6));
        gem.setDepth(0.5);
        this.tweens.add({
          targets: gem,
          angle:   Phaser.Math.Between(-15, 15),
          duration: Phaser.Math.Between(4000, 7000),
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        placed++;
      }
    }
  }

  private wireDesktopBridge(): void {
    if (!window.ColorGridBridge) return;

    window.ColorGridBridge.onPauseClick    = () => this.pauseGame();
    window.ColorGridBridge.onRestartClick  = () => {
      this.scene.start('PlayScene', { levelId: this.levelConfig.id });
    };
    window.ColorGridBridge.onMenuClick     = () => this.scene.start('MainMenuScene');
    window.ColorGridBridge.onLevelsClick   = () => this.scene.start('LevelSelectScene');
    window.ColorGridBridge.onSettingsClick = () => this.scene.start('SettingsScene');
    window.ColorGridBridge.onSfxToggle     = (v: boolean) => {
      AudioManager.getInstance().setSoundEnabled(v);
      SaveManager.getInstance().updateSettings({ soundEnabled: v });
    };
    window.ColorGridBridge.onMusicToggle   = (v: boolean) => {
      AudioManager.getInstance().setMusicEnabled(v);
      SaveManager.getInstance().updateSettings({ musicEnabled: v });
    };
  }

  private showComboCallout(combo: number, x: number, y: number): void {
    const titles = ['Sweet!', 'Great!', 'Awesome!', 'Unstoppable!', 'COLOR RUSH!'];
    const label  = titles[Math.min(combo - 2, titles.length - 1)];
    const ts     = Math.round(this.board.getLayout().tileSize * 0.36);

    const text = this.add.text(x, y - 36, `${label}\n${combo}× COMBO!`, {
      fontFamily: 'Outfit, sans-serif', fontSize: `${ts}px`,
      color: '#fde047', fontStyle: '900', align: 'center',
      stroke: '#000000', strokeThickness: 5
    });
    text.setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: text, y: y - 105, scale: 1.15, alpha: 0,
      duration: 800, ease: 'Cubic.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private showTutorialBanner(text: string, layout: ReturnType<typeof computeLayout>): void {
    const W  = this.scale.width;
    const H  = this.scale.height;
    if (!layout.isDesktop && H < 520) return;
    const bW = Math.min(W - 32, 560);
    const y  = layout.isDesktop ? H - 66 : H - 74;

    const banner = this.add.container(W / 2, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0284c7, 0.92);
    bg.fillRoundedRect(-bW / 2, -28, bW, 56, 13);
    bg.lineStyle(2, 0x38bdf8, 1);
    bg.strokeRoundedRect(-bW / 2, -28, bW, 56, 13);
    banner.add(bg);

    const lbl = this.add.text(0, 0, text, {
      fontFamily: 'Outfit, sans-serif', fontSize: '16px',
      color: '#ffffff', fontStyle: '600', align: 'center',
      wordWrap: { width: bW - 28 }
    }).setOrigin(0.5);
    banner.add(lbl);
    banner.setDepth(150);

    this.time.delayedCall(6000, () => {
      this.tweens.add({
        targets: banner, alpha: 0, duration: 400,
        onComplete: () => banner.destroy()
      });
    });
  }

  private checkGameStatus(): void {
    if (this.isLevelEnding) return;
    if (this.levelSystem.isWon()) {
      this.isLevelEnding = true;
      this.triggerVictory();
    } else if (this.levelSystem.isGameOver()) {
      this.isLevelEnding = true;
      this.triggerGameOver();
    }
  }

  private triggerVictory(): void {
    const remainingMoves = this.levelSystem.getMovesLeft();
    const bonus          = this.scoreSystem.addRushMoveBonus(remainingMoves);
    this.hud.updateScore(this.scoreSystem.getScore(), this.scoreSystem.getStars());

    const stars      = Math.max(1, this.scoreSystem.getStars());
    const finalScore = this.scoreSystem.getScore();
    SaveManager.getInstance().saveLevelResult(this.levelConfig.id, finalScore, stars);

    this.particleSystem.emitVictoryConfetti();

    this.time.delayedCall(1000, () => {
      this.scene.pause();
      this.scene.launch('VictoryScene', {
        levelId: this.levelConfig.id, score: finalScore,
        stars, remainingMoves, moveBonus: bonus
      });
    });
  }

  private triggerGameOver(): void {
    this.time.delayedCall(800, () => {
      this.scene.pause();
      this.scene.launch('GameOverScene', {
        levelId:    this.levelConfig.id,
        score:      this.scoreSystem.getScore(),
        objectives: this.levelSystem.getObjectives()
      });
    });
  }

  private pauseGame(): void {
    this.scene.pause();
    this.scene.launch('PauseScene', { levelId: this.levelConfig.id });
  }

  public shutdown(): void {
    if (this.inputManager) this.inputManager.destroy();
    // Clear bridge callbacks to avoid ghost references after scene change
    if (window.ColorGridBridge) {
      window.ColorGridBridge.onPauseClick    = null;
      window.ColorGridBridge.onRestartClick  = null;
      window.ColorGridBridge.onMenuClick     = null;
      window.ColorGridBridge.onLevelsClick   = null;
      window.ColorGridBridge.onSettingsClick = null;
      window.ColorGridBridge.onSfxToggle     = null;
      window.ColorGridBridge.onMusicToggle   = null;
    }
  }
}
