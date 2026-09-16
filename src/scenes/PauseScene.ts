import Phaser from 'phaser';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AudioManager } from '../systems/AudioManager';
import { SaveManager } from '../systems/SaveManager';

export class PauseScene extends Phaser.Scene {
  private levelId: number = 1;

  constructor() {
    super({ key: 'PauseScene' });
  }

  public init(data: { levelId?: number }): void {
    this.levelId = data.levelId || 1;
  }

  public create(): void {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const panelW = Math.min(480, W - 32);
    const panelH = Math.min(580, H - 32);

    const modal = new Modal(this, panelW, panelH);

    const top  = cy - panelH / 2;

    const titleY  = top + panelH * 0.16;
    const btn1Y   = top + panelH * 0.36;
    const btn2Y   = top + panelH * 0.51;
    const btn3Y   = top + panelH * 0.64;
    const btn4Y   = top + panelH * 0.77;
    const audioY  = top + panelH * 0.90;

    const sp = (ideal: number, min: number) =>
      `${Math.max(min, Math.round(ideal * (panelH / 580)))}px`;

    // ── Title ──
    const title = this.add.text(cx, titleY, 'PAUSED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize:   sp(42, 28),
      color:      '#ffffff',
      fontStyle:  '900'
    }).setOrigin(0.5);
    modal.add(title);

    const btnW = Math.min(260, panelW * 0.76);
    const bh   = Math.min(60, panelH * 0.10);

    // ── Resume ──
    const resumeBtn = new Button(this, cx, btn1Y, '▶  RESUME', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.resume('PlayScene');
      });
    }, { width: btnW, height: bh, primaryColor: 0x10b981, hoverColor: 0x34d399, fontSize: sp(24, 17) });
    modal.add(resumeBtn);

    // ── Restart ──
    const restartBtn = new Button(this, cx, btn2Y, '↺  RESTART', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('PlayScene', { levelId: this.levelId });
      });
    }, { width: btnW, height: bh, primaryColor: 0x3b82f6, hoverColor: 0x60a5fa, fontSize: sp(24, 17) });
    modal.add(restartBtn);

    // ── Level Select ──
    const levelsBtn = new Button(this, cx, btn3Y, 'LEVEL SELECT', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('LevelSelectScene');
      });
    }, { width: btnW, height: bh, primaryColor: 0x475569, hoverColor: 0x64748b, fontSize: sp(22, 16) });
    modal.add(levelsBtn);

    // ── Main Menu ──
    const menuBtn = new Button(this, cx, btn4Y, 'MAIN MENU', () => {
      modal.close(() => {
        this.scene.stop();
        this.scene.stop('PlayScene');
        this.scene.start('MainMenuScene');
      });
    }, { width: btnW, height: bh, primaryColor: 0x334155, hoverColor: 0x475569, fontSize: sp(22, 16) });
    modal.add(menuBtn);

    // ── Audio toggles row ──
    this.createAudioToggles(modal, cx, audioY, panelW, sp);
  }

  private createAudioToggles(
    modal: Modal,
    cx: number, y: number, panelW: number,
    sp: (ideal: number, min: number) => string
  ): void {
    const save  = SaveManager.getInstance();
    const audio = AudioManager.getInstance();
    const gap   = Math.min(90, panelW * 0.22);

    const makeBtn = (px: number, onLabel: string, offLabel: string, isOn: boolean,
                     onToggle: (v: boolean) => void) => {
      let on = isOn;
      const btn = this.add.text(px, y, on ? onLabel : offLabel, {
        fontFamily: 'Outfit, sans-serif',
        fontSize:   sp(18, 13),
        color:      on ? '#38bdf8' : '#64748b',
        fontStyle:  'bold'
      }).setOrigin(0.5);
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        on = !on;
        btn.setText(on ? onLabel : offLabel);
        btn.setColor(on ? '#38bdf8' : '#64748b');
        audio.playClick();
        onToggle(on);
      });
      modal.add(btn);
    };

    makeBtn(cx - gap, '🔊 SFX', '🔇 SFX', save.getData().settings.soundEnabled,
      v => { audio.setSoundEnabled(v); save.updateSettings({ soundEnabled: v }); });

    makeBtn(cx + gap, '🎵 MUSIC', '🔇 MUSIC', save.getData().settings.musicEnabled,
      v => { audio.setMusicEnabled(v); save.updateSettings({ musicEnabled: v }); });
  }
}
