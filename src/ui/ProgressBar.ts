import Phaser from 'phaser';

export class ProgressBar extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private barWidth: number;
  private barHeight: number;
  private fillRatio: number = 0;
  private fillColor: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 240,
    height: number = 18,
    fillColor: number = 0x10b981
  ) {
    super(scene, x, y);

    this.barWidth = width;
    this.barHeight = height;
    this.fillColor = fillColor;

    this.bg = scene.add.graphics();
    this.bar = scene.add.graphics();

    this.add(this.bg);
    this.add(this.bar);

    this.drawBg();
    this.drawProgress(0);

    scene.add.existing(this);
  }

  public setProgress(ratio: number): void {
    this.fillRatio = Math.max(0, Math.min(1, ratio));
    this.drawProgress(this.fillRatio);
  }

  private drawBg(): void {
    this.bg.clear();
    this.bg.fillStyle(0x0f172a, 0.8);
    this.bg.fillRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, this.barHeight / 2);
    this.bg.lineStyle(1.5, 0x334155, 0.9);
    this.bg.strokeRoundedRect(-this.barWidth / 2, -this.barHeight / 2, this.barWidth, this.barHeight, this.barHeight / 2);
  }

  private drawProgress(ratio: number): void {
    this.bar.clear();
    if (ratio <= 0) return;

    const w = (this.barWidth - 4) * ratio;
    const h = this.barHeight - 4;
    const r = h / 2;

    this.bar.fillStyle(this.fillColor, 1);
    this.bar.fillRoundedRect(-this.barWidth / 2 + 2, -this.barHeight / 2 + 2, Math.max(w, r * 2), h, r);
  }
}
