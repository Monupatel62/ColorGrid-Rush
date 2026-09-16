import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { SaveManager } from '../systems/SaveManager';
import { LEVELS } from '../data/levels';
import { AudioManager } from '../systems/AudioManager';
import { syncCanvasSize } from '../utils/syncCanvasSize';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  public create(): void {
    window.ColorGridBridge?.setDesktopMode('menu');
    if (window.ColorGridBridge) {
      window.ColorGridBridge.onMenuClick = () => this.scene.start('MainMenuScene');
      window.ColorGridBridge.onLevelsClick = () => this.scene.start('LevelSelectScene');
      window.ColorGridBridge.onSettingsClick = () => this.scene.start('SettingsScene');
    }
    const size            = syncCanvasSize(this);
    const W               = size.width;
    const H               = size.height;
    const save            = SaveManager.getInstance();
    const highestUnlocked = save.getHighestUnlockedLevel();
    const totalStars      = save.getTotalStars();
    const isDesktop       = window.innerWidth >= 960;
    const isTablet        = window.innerWidth >= 600 && window.innerWidth < 960;
    const cx              = W / 2;

    // ── Background ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x111827, 0x111827, 1);
    bg.fillRect(0, 0, W, H);

    // Subtle decorative gems
    const gemKeys = ['gem_0', 'gem_1', 'gem_2', 'gem_3', 'gem_4'];
    const gemCount = isDesktop ? 14 : 8;
    for (let i = 0; i < gemCount; i++) {
      const gx  = Phaser.Math.Between(20, W - 20);
      const gy  = Phaser.Math.Between(20, H - 20);
      const gem = this.add.sprite(gx, gy, gemKeys[i % gemKeys.length]);
      gem.setAlpha(0.06).setScale(Phaser.Math.FloatBetween(0.4, 0.9)).setDepth(0);
      this.tweens.add({
        targets: gem, y: gy + Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(3000, 6000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // ── Header ──
    const headerH = isDesktop ? 72 : 62;
    const hdrBg = this.add.graphics();
    hdrBg.fillStyle(0x0f172a, 0.85);
    hdrBg.fillRect(0, 0, W, headerH);
    hdrBg.lineStyle(1, 0x1e293b, 1);
    hdrBg.lineBetween(0, headerH, W, headerH);
    hdrBg.setDepth(5);

    new Button(this, isDesktop ? 80 : 66, headerH / 2, '← BACK', () => {
      this.scene.start('MainMenuScene');
    }, { width: isDesktop ? 120 : 100, height: 40, fontSize: '17px', primaryColor: 0x334155, hoverColor: 0x475569 });

    this.add.text(cx, headerH / 2, 'SELECT LEVEL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   isDesktop ? '32px' : (isTablet ? '26px' : '22px'),
      color:      '#ffffff', fontStyle: '900'
    }).setOrigin(0.5).setDepth(6);

    this.add.text(W - (isDesktop ? 24 : 16), headerH / 2, `★ ${totalStars}/30`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   isDesktop ? '20px' : '17px',
      color: '#fef08a', fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(6);

    // ── Grid parameters ──
    const cols    = isDesktop ? 5 : (isTablet ? 3 : 2);
    const pad     = isDesktop ? 18 : 12;
    const cardH   = isDesktop ? 138 : (isTablet ? 132 : 124);
    const totalW  = W - pad * 2;
    const cardW   = Math.floor((totalW - pad * (cols - 1)) / cols);
    const startX  = pad + cardW / 2;
    const startY  = headerH + pad + cardH / 2;

    // ── Level cards ──
    LEVELS.forEach((level, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x   = startX + col * (cardW + pad);
      const y   = startY + row * (cardH + pad);

      const isUnlocked  = level.id <= highestUnlocked;
      const starsEarned = save.getStarsForLevel(level.id);
      const highScore   = save.getHighScore(level.id);

      this.createLevelCard(
        x, y, cardW, cardH,
        level.id, level.name, level.subtitle,
        isUnlocked, starsEarned, highScore, isDesktop, isTablet
      );
    });
  }

  private createLevelCard(
    x: number, y: number, cardW: number, cardH: number,
    levelId: number, name: string, subtitle: string,
    isUnlocked: boolean, starsEarned: number, highScore: number,
    isDesktop: boolean, isTablet: boolean
  ): void {
    const card = this.add.container(x, y);
    const hw   = cardW / 2;
    const hh   = cardH / 2;
    const bg   = this.add.graphics();
    const r    = 14;

    if (isUnlocked) {
      // Card background
      bg.fillStyle(0x1e293b, 0.95);
      bg.fillRoundedRect(-hw, -hh, cardW, cardH, r);
      bg.lineStyle(isDesktop ? 2 : 1.5, 0x38bdf8, 0.55);
      bg.strokeRoundedRect(-hw, -hh, cardW, cardH, r);

      // Level badge circle
      const badgeR = isDesktop ? 22 : 18;
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0x0284c7, 1);
      badgeBg.fillCircle(-hw + badgeR + 8, -hh + badgeR + 8, badgeR);
      card.add(badgeBg);

      card.add(
        this.add.text(-hw + badgeR + 8, -hh + badgeR + 8, `${levelId}`, {
          fontFamily: 'Outfit, sans-serif',
          fontSize:   isDesktop ? '19px' : '16px',
          color:      '#ffffff', fontStyle: '900'
        }).setOrigin(0.5)
      );

      // Name
      card.add(
        this.add.text(-hw + (badgeR * 2) + 20, -hh + 12, name, {
          fontFamily: 'Outfit, sans-serif',
          fontSize:   isDesktop ? '16px' : (isTablet ? '14px' : '13px'),
          color:      '#f8fafc', fontStyle: 'bold'
        })
      );

      // Subtitle
      card.add(
        this.add.text(-hw + (badgeR * 2) + 20, -hh + (isDesktop ? 32 : 28), subtitle, {
          fontFamily: 'Outfit, sans-serif',
          fontSize:   isDesktop ? '12px' : '11px',
          color:      '#94a3b8'
        })
      );

      // High score
      if (highScore > 0) {
        card.add(
          this.add.text(-hw + 10, hh - 40, `Best: ${highScore.toLocaleString()}`, {
            fontFamily: 'Outfit, sans-serif',
            fontSize:   isDesktop ? '13px' : '11px',
            color:      '#64748b'
          })
        );
      }

      // Stars
      const starSz  = isDesktop ? 24 : 20;
      const starGap = isDesktop ? 28 : 24;
      for (let i = 0; i < 3; i++) {
        const star = this.add.sprite(-hw + 12 + i * starGap, hh - 16, i < starsEarned ? 'star_filled' : 'star_empty');
        star.setDisplaySize(starSz, starSz);
        card.add(star);
      }

      // Hover / click
      card.setSize(cardW, cardH);
      card.setInteractive({ useHandCursor: true });

      card.on('pointerover', () => {
        this.tweens.add({ targets: card, scale: 1.04, duration: 110, ease: 'Cubic.easeOut' });
        bg.clear();
        bg.fillStyle(0x253347, 1);
        bg.fillRoundedRect(-hw, -hh, cardW, cardH, r);
        bg.lineStyle(2, 0x60a5fa, 1);
        bg.strokeRoundedRect(-hw, -hh, cardW, cardH, r);
      });
      card.on('pointerout', () => {
        this.tweens.add({ targets: card, scale: 1, duration: 110, ease: 'Cubic.easeOut' });
        bg.clear();
        bg.fillStyle(0x1e293b, 0.95);
        bg.fillRoundedRect(-hw, -hh, cardW, cardH, r);
        bg.lineStyle(isDesktop ? 2 : 1.5, 0x38bdf8, 0.55);
        bg.strokeRoundedRect(-hw, -hh, cardW, cardH, r);
      });
      card.on('pointerdown', () => {
        AudioManager.getInstance().playClick();
        this.scene.start('PlayScene', { levelId });
      });

    } else {
      // Locked card
      bg.fillStyle(0x0f172a, 0.72);
      bg.fillRoundedRect(-hw, -hh, cardW, cardH, r);
      bg.lineStyle(1, 0x334155, 0.45);
      bg.strokeRoundedRect(-hw, -hh, cardW, cardH, r);

      const lock = this.add.sprite(0, -10, 'icon_lock');
      lock.setAlpha(0.45);
      card.add(lock);

      card.add(
        this.add.text(0, 22, `LEVEL ${levelId}`, {
          fontFamily: 'Outfit, sans-serif',
          fontSize:   isDesktop ? '15px' : '13px',
          color:      '#475569', fontStyle: 'bold'
        }).setOrigin(0.5)
      );
    }

    card.addAt(bg, 0);
  }
}
