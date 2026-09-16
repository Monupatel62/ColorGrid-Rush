import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { syncCanvasSize } from '../utils/syncCanvasSize';
import { triggerHaptic } from '../utils/feedback';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  public create(): void {
    window.ColorGridBridge?.setDesktopMode('menu');
    if (window.ColorGridBridge) {
      window.ColorGridBridge.onMenuClick = () => this.scene.start('MainMenuScene');
      window.ColorGridBridge.onLevelsClick = () => this.scene.start('LevelSelectScene');
      window.ColorGridBridge.onSettingsClick = () => this.scene.start('SettingsScene');
    }
    const size = syncCanvasSize(this);
    const W  = size.width;
    const H  = size.height;
    const cx = W / 2;

    const save     = SaveManager.getInstance();
    const audio    = AudioManager.getInstance();
    const settings = save.getData().settings;
    const isWide   = window.innerWidth >= 960;

    // ── Background ──
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x111827, 0x111827, 1);
    bg.fillRect(0, 0, W, H);

    // ── Back button ──
    new Button(this, isWide ? 90 : 76, 55, '← BACK', () => {
      this.scene.start('MainMenuScene');
    }, { width: isWide ? 130 : 110, height: 44, fontSize: '19px', primaryColor: 0x334155, hoverColor: 0x475569 });

    // ── Header ──
    this.add.text(cx, 55, 'SETTINGS', {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   isWide ? '34px' : '28px',
      color:      '#ffffff',
      fontStyle:  '900'
    }).setOrigin(0.5);

    // ── Panel ──
    const panelW  = Math.min(560, W - 40);
    const panelH  = Math.min(560, H - 160);
    const panelX  = cx - panelW / 2;
    const panelY  = 100;

    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.9);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 22);
    panel.lineStyle(1.5, 0x334155, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 22);

    const labelX  = panelX + 28;
    const toggleW = 72;
    const toggleX = panelX + panelW - 28 - toggleW / 2;
    let rowY      = panelY + Math.round(panelH * 0.11);
    const rowGap  = Math.round(panelH * 0.155);

    // ── Toggle rows ──
    this.createToggleRow(rowY, labelX, toggleX, 'Sound Effects (SFX)', settings.soundEnabled,
      (v) => { audio.setSoundEnabled(v); save.updateSettings({ soundEnabled: v }); });

    rowY += rowGap;
    this.createToggleRow(rowY, labelX, toggleX, 'Background Music', settings.musicEnabled,
      (v) => { audio.setMusicEnabled(v); save.updateSettings({ musicEnabled: v }); });

    rowY += rowGap;
    this.createToggleRow(rowY, labelX, toggleX, 'Reduced Motion', settings.reducedMotion,
      (v) => { save.updateSettings({ reducedMotion: v }); });

    rowY += rowGap;
    this.createToggleRow(rowY, labelX, toggleX, 'Haptic Vibration', settings.hapticsEnabled,
      (v) => { save.updateSettings({ hapticsEnabled: v }); });

    // ── Danger zone ──
    const resetY = panelY + panelH - Math.round(panelH * 0.14);
    new Button(this, cx, resetY, 'RESET ALL PROGRESS', () => {
      this.showResetConfirmation(W, H, cx);
    }, { width: Math.min(360, panelW - 40), height: 54, primaryColor: 0xdc2626, hoverColor: 0xef4444, fontSize: '19px' });

    // ── Footer ──
    this.add.text(cx, panelY + panelH + 24, 'All data is saved locally. No account required.', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', color: '#475569', align: 'center'
    }).setOrigin(0.5);
  }

  private createToggleRow(
    y: number, labelX: number, toggleX: number,
    label: string, initial: boolean,
    onToggle: (v: boolean) => void
  ): void {
    this.add.text(labelX, y, label, {
      fontFamily: 'Outfit, sans-serif', fontSize: '20px',
      color: '#f8fafc', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setWordWrapWidth(Math.max(150, toggleX - labelX - 52));

    let on = initial;
    const c   = this.add.container(toggleX, y);
    const bg  = this.add.graphics();
    const knb = this.add.graphics();

    const draw = (active: boolean) => {
      bg.clear();
      bg.fillStyle(active ? 0x10b981 : 0x475569, 1);
      bg.fillRoundedRect(-36, -18, 72, 36, 18);
      knb.clear();
      knb.fillStyle(0xffffff, 1);
      knb.fillCircle(active ? 18 : -18, 0, 14);
    };

    draw(on);
    c.add(bg);
    c.add(knb);
    c.setSize(72, 36);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => {
      on = !on;
      draw(on);
      AudioManager.getInstance().playClick();
      triggerHaptic(24);
      onToggle(on);
    });
  }

  private showResetConfirmation(W: number, H: number, cx: number): void {
    const cy  = H / 2;
    const box = this.add.container(0, 0);
    box.setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.86);
    overlay.fillRect(0, 0, W, H);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
    box.add(overlay);

    const pw = Math.min(460, W - 40);
    const ph = 300;
    const panel = this.add.graphics();
    panel.fillStyle(0x0f172a, 1);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 22);
    panel.lineStyle(2.5, 0xef4444, 1);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 22);
    box.add(panel);

    const ttl = this.add.text(cx, cy - 100, 'RESET ALL PROGRESS?', {
      fontFamily: 'Outfit, sans-serif', fontSize: '26px', color: '#ef4444', fontStyle: '900'
    }).setOrigin(0.5);
    box.add(ttl);

    const msg = this.add.text(cx, cy - 42,
      'This will permanently wipe all unlocked levels,\nscores, and stars!', {
      fontFamily: 'Outfit, sans-serif', fontSize: '16px',
      color: '#94a3b8', align: 'center', lineSpacing: 5
    }).setOrigin(0.5);
    box.add(msg);

    const btnW = Math.min(300, pw - 40);

    const confirmBtn = new Button(this, cx, cy + 46, 'YES, WIPE EVERYTHING', () => {
      SaveManager.getInstance().resetProgress();
      box.destroy();
      this.scene.start('MainMenuScene');
    }, { width: btnW, height: 52, primaryColor: 0xdc2626, hoverColor: 0xef4444, fontSize: '19px' });
    box.add(confirmBtn);

    const cancelBtn = new Button(this, cx, cy + 110, 'CANCEL', () => {
      box.destroy();
    }, { width: btnW, height: 46, primaryColor: 0x334155, hoverColor: 0x475569, fontSize: '17px' });
    box.add(cancelBtn);
  }
}
