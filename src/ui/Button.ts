import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

export interface ButtonOptions {
  width?: number;
  height?: number;
  primaryColor?: number;
  hoverColor?: number;
  textColor?: string;
  fontSize?: string;
  radius?: number;
}

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private labelText: Phaser.GameObjects.Text;
  private btnWidth: number;
  private btnHeight: number;
  private primaryColor: number;
  private hoverColor: number;
  private radius: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: ButtonOptions = {}
  ) {
    super(scene, x, y);

    this.btnWidth = options.width || 240;
    this.btnHeight = options.height || 64;
    this.primaryColor = options.primaryColor ?? 0x3b82f6;
    this.hoverColor = options.hoverColor ?? 0x60a5fa;
    this.radius = options.radius ?? 16;

    // Background graphics
    this.bg = scene.add.graphics();
    this.drawBackground(this.primaryColor);
    this.add(this.bg);

    // Label
    this.labelText = scene.add.text(0, 0, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: options.fontSize || '26px',
      color: options.textColor || '#ffffff',
      fontStyle: 'bold'
    });
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    // Hit area & interactivity
    this.setSize(this.btnWidth, this.btnHeight);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => {
      this.drawBackground(this.hoverColor);
      scene.tweens.add({
        targets: this,
        scale: 1.04,
        duration: 120,
        ease: 'Cubic.easeOut'
      });
    });

    this.on('pointerout', () => {
      this.drawBackground(this.primaryColor);
      scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 120,
        ease: 'Cubic.easeOut'
      });
    });

    this.on('pointerdown', () => {
      scene.tweens.add({
        targets: this,
        scale: 0.96,
        duration: 80,
        yoyo: true
      });
      AudioManager.getInstance().playClick();
      onClick();
    });

    scene.add.existing(this);
  }

  public setText(text: string): void {
    this.labelText.setText(text);
  }

  private drawBackground(color: number): void {
    this.bg.clear();

    // Shadow
    this.bg.fillStyle(0x000000, 0.35);
    this.bg.fillRoundedRect(
      -this.btnWidth / 2,
      -this.btnHeight / 2 + 4,
      this.btnWidth,
      this.btnHeight,
      this.radius
    );

    // Main button face
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(
      -this.btnWidth / 2,
      -this.btnHeight / 2,
      this.btnWidth,
      this.btnHeight,
      this.radius
    );

    // Top glossy bevel
    this.bg.lineStyle(2, 0xffffff, 0.3);
    this.bg.strokeRoundedRect(
      -this.btnWidth / 2 + 1,
      -this.btnHeight / 2 + 1,
      this.btnWidth - 2,
      this.btnHeight - 2,
      this.radius
    );
  }
}
