import Phaser from 'phaser';

/**
 * Responsive modal overlay.
 * Reads the live canvas size so it covers the full canvas at every resolution
 * instead of using the old hardcoded 720×1280 values.
 */
export class Modal extends Phaser.GameObjects.Container {
  protected overlay:     Phaser.GameObjects.Graphics;
  protected panel:       Phaser.GameObjects.Graphics;
  protected panelWidth:  number;
  protected panelHeight: number;

  constructor(scene: Phaser.Scene, width: number = 560, height: number = 680) {
    super(scene, 0, 0);

    const W = scene.scale.width;
    const H = scene.scale.height;

    // Clamp panel so it always fits the canvas with 20 px margin each side
    this.panelWidth  = Math.min(width,  W - 40);
    this.panelHeight = Math.min(height, H - 40);

    const pw = this.panelWidth;
    const ph = this.panelHeight;
    const cx = W / 2;
    const cy = H / 2;

    // 1. Full-canvas dark backdrop
    this.overlay = scene.add.graphics();
    this.overlay.fillStyle(0x000000, 0.78);
    this.overlay.fillRect(0, 0, W, H);
    this.overlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(this.overlay);

    // 2. Panel frame
    this.panel = scene.add.graphics();

    // Drop-shadow layer
    this.panel.fillStyle(0x000000, 0.45);
    this.panel.fillRoundedRect(cx - pw / 2 + 4, cy - ph / 2 + 8, pw, ph, 28);

    // Main face
    this.panel.fillStyle(0x0f172a, 0.97);
    this.panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 28);

    // Accent glow border
    this.panel.lineStyle(2.5, 0x38bdf8, 0.65);
    this.panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 28);

    this.add(this.panel);

    this.setDepth(200);
    scene.add.existing(this);

    // Pop-in animation
    this.setScale(0.88);
    this.setAlpha(0);
    scene.tweens.add({
      targets:  this,
      scale:    1,
      alpha:    1,
      duration: 210,
      ease:     'Back.easeOut'
    });
  }

  /** Canvas centre X — helper for child scene layouts */
  public getCX(): number { return this.scene.scale.width  / 2; }
  /** Canvas centre Y — helper for child scene layouts */
  public getCY(): number { return this.scene.scale.height / 2; }

  public close(onComplete?: () => void): void {
    this.scene.tweens.add({
      targets:    this,
      scale:      0.88,
      alpha:      0,
      duration:   150,
      ease:       'Cubic.easeIn',
      onComplete: () => {
        if (onComplete) onComplete();
        this.destroy();
      }
    });
  }
}
