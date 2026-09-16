import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { syncCanvasSize } from '../utils/syncCanvasSize';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  public create(): void {
    window.ColorGridBridge?.setDesktopMode('menu');
    if (window.ColorGridBridge) {
      window.ColorGridBridge.onMenuClick = () => this.scene.start('MainMenuScene');
      window.ColorGridBridge.onLevelsClick = () => this.scene.start('LevelSelectScene');
      window.ColorGridBridge.onSettingsClick = () => this.scene.start('SettingsScene');
    }
    const size        = syncCanvasSize(this);
    const W           = size.width;
    const H           = size.height;
    const cx          = W / 2;
    const save        = SaveManager.getInstance();
    const totalStars  = save.getTotalStars();
    const highestLvl  = save.getHighestUnlockedLevel();
    const isDesktop   = window.innerWidth >= 960;
    const isCompact   = H < 650 || W < 600;

    // ── Background gradient ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x111827, 0x111827, 1);
    bg.fillRect(0, 0, W, H);

    // ── Floating gem decoration ──
    const gemKeys  = ['gem_0', 'gem_1', 'gem_2', 'gem_3', 'gem_4', 'gem_rainbow'];
    const gemCount = isDesktop ? 18 : 10;
    for (let i = 0; i < gemCount; i++) {
      const gx  = Phaser.Math.Between(20, W - 20);
      const gy  = Phaser.Math.Between(20, H - 20);
      const gem = this.add.sprite(gx, gy, gemKeys[i % gemKeys.length]);
      gem.setAlpha(Phaser.Math.FloatBetween(0.06, 0.13));
      gem.setScale(Phaser.Math.FloatBetween(0.4, isDesktop ? 1.2 : 0.9));
      gem.setDepth(0);
      this.tweens.add({
        targets:  gem,
        y:        gy + Phaser.Math.Between(-28, 28),
        angle:    Phaser.Math.Between(-16, 16),
        duration: Phaser.Math.Between(2800, 5500),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // ── Layout constants (all proportional to H) ──
    // Split H into zones: top-padding | title | subtitle | gap | badge | gap | buttons | bottom
    const titleY    = Math.round(H * (isCompact ? 0.11 : 0.20));
    const subtitleY = titleY + Math.round(H * (isCompact ? 0.15 : 0.11));
    const badgeY    = Math.round(H * (isCompact ? 0.39 : 0.42));
    const btn1Y     = Math.round(H * (isCompact ? 0.56 : 0.57));

    // ── Title ──
    const titleSize   = isDesktop
      ? Math.min(72, Math.round(W * 0.058))
      : isCompact ? 34 : Math.min(52, Math.round(W * 0.12));
    const titleLines  = isDesktop || W >= 720 ? 'COLORGRID RUSH' : 'COLORGRID\nRUSH';
    const titleText   = this.add.text(cx, titleY, titleLines, {
      fontFamily:      'Outfit, sans-serif',
      fontSize:        `${titleSize}px`,
      fontStyle:       '900',
      color:           '#38bdf8',
      stroke:          '#0c4a7a',
      strokeThickness: Math.round(titleSize * 0.18),
      align:           'center'
    }).setOrigin(0.5).setDepth(1);

    // Neon glow pulse on title
    this.tweens.add({
      targets:  titleText,
      alpha:    { from: 0.92, to: 1 },
      duration: 1800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut'
    });

    // ── Subtitle ──
    const subSize = isDesktop ? 18 : 13;
    this.add.text(cx, subtitleY, 'MATCH  ·  BLAST  ·  CONQUER', {
      fontFamily:  'Outfit, sans-serif',
      fontSize:    `${subSize}px`,
      fontStyle:   '700',
      color:       '#475569',
      letterSpacing: 5
    }).setOrigin(0.5).setDepth(1);

    // ── Stars badge ──
    const badgeW  = Math.min(isDesktop ? 380 : W - 60, 380);
    const badgeH  = isDesktop ? 60 : 52;
    const badge   = this.add.container(cx, badgeY);

    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0x1e293b, 0.92);
    badgeBg.fillRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 16);
    badgeBg.lineStyle(2, 0xf59e0b, 0.8);
    badgeBg.strokeRoundedRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 16);
    badge.add(badgeBg);

    const starSz  = isDesktop ? 32 : 26;
    const starX   = -badgeW / 2 + starSz;
    const starIco = this.add.sprite(starX, 0, 'star_filled').setDisplaySize(starSz, starSz);
    badge.add(starIco);

    badge.add(
      this.add.text(starX + starSz * 0.7, 0,
        `${totalStars} / 30 STARS COLLECTED`, {
          fontFamily: 'Outfit, sans-serif',
          fontSize:   `${isDesktop ? 20 : 16}px`,
          color:      '#fef08a',
          fontStyle:  'bold'
        }).setOrigin(0, 0.5)
    );
    badge.setDepth(1);

    // ── Buttons ──
    const nextLevel = Math.min(highestLvl, 10);
    const btnW      = Math.min(isDesktop ? 340 : W - 48, 340);
    const bh1       = isCompact ? Math.min(60, Math.round(btnW * 0.17)) : Math.round(btnW * 0.20);
    const bh2       = isCompact ? Math.min(50, Math.round(btnW * 0.15)) : Math.round(btnW * 0.18);
    const btnGap    = Math.max(Math.round(H * (isCompact ? 0.125 : 0.094)), bh1 + 8);
    const fs1       = `${Math.round(bh1 * 0.36)}px`;
    const fs2       = `${Math.round(bh2 * 0.34)}px`;

    new Button(this, cx, btn1Y, `▶  PLAY LEVEL ${nextLevel}`, () => {
      this.scene.start('PlayScene', { levelId: nextLevel });
    }, { width: btnW, height: bh1, primaryColor: 0x10b981, hoverColor: 0x34d399, fontSize: fs1 });

    new Button(this, cx, btn1Y + btnGap, 'LEVEL SELECT', () => {
      this.scene.start('LevelSelectScene');
    }, { width: btnW, height: bh2, primaryColor: 0x3b82f6, hoverColor: 0x60a5fa, fontSize: fs2 });

    new Button(this, cx, btn1Y + btnGap * 2, 'SETTINGS', () => {
      this.scene.start('SettingsScene');
    }, { width: btnW, height: bh2, primaryColor: 0x475569, hoverColor: 0x64748b, fontSize: fs2 });

    // ── Audio toggles ──
    const togX = isDesktop ? W - 110 : W - 72;
    const togY = isDesktop ? 40      : 30;
    this.createAudioToggles(togX, togY);

    // ── Version ──
    this.add.text(W - 12, H - 12, 'v1.0', {
      fontFamily: 'Outfit, sans-serif', fontSize: '11px', color: '#334155'
    }).setOrigin(1, 1).setDepth(1);
  }

  private createAudioToggles(x: number, y: number): void {
    const audio = AudioManager.getInstance();
    const save  = SaveManager.getInstance();

    const makeToggle = (
      px: number, emoji: string,
      isOn: boolean, onToggle: (v: boolean) => void
    ) => {
      let on = isOn;
      const c  = this.add.container(px, y);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 0.92);
      bg.fillRoundedRect(-22, -22, 44, 44, 10);
      bg.lineStyle(1, 0x334155, 1);
      bg.strokeRoundedRect(-22, -22, 44, 44, 10);
      c.add(bg);
      const lbl = this.add.text(0, 0, on ? emoji : '🔇', {
        fontSize: '18px'
      }).setOrigin(0.5);
      c.add(lbl);
      c.setSize(44, 44);
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover',  () => bg.clear().fillStyle(0x273548, 1).fillRoundedRect(-22, -22, 44, 44, 10));
      c.on('pointerout',   () => { bg.clear(); bg.fillStyle(0x1e293b, 0.92); bg.fillRoundedRect(-22,-22,44,44,10); });
      c.on('pointerdown',  () => {
        on = !on;
        lbl.setText(on ? emoji : '🔇');
        onToggle(on);
        audio.playClick();
      });
      c.setDepth(10);
    };

    makeToggle(x,      '🔊', save.getData().settings.soundEnabled,  (v) => { audio.setSoundEnabled(v);  save.updateSettings({ soundEnabled: v });  });
    makeToggle(x + 50, '🎵', save.getData().settings.musicEnabled,  (v) => { audio.setMusicEnabled(v);  save.updateSettings({ musicEnabled: v });  });
  }
}
