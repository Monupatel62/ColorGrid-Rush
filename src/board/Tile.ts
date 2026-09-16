import Phaser from 'phaser';
import { TileColor, SpecialType } from '../data/colors';
import { SaveManager } from '../systems/SaveManager';

export class Tile extends Phaser.GameObjects.Container {
  public gridRow:   number;
  public gridCol:   number;
  public tileColor: TileColor;
  public special:   SpecialType;

  private sprite:           Phaser.GameObjects.Sprite;
  private badge:            Phaser.GameObjects.Sprite | null = null;
  private glowRing:         Phaser.GameObjects.Graphics;
  private glowTween:        Phaser.Tweens.Tween | null = null;
  private hintTween:        Phaser.Tweens.Tween | null = null;
  private tileSize:         number;

  constructor(
    scene:   Phaser.Scene,
    x: number, y: number,
    row: number, col: number,
    color:   TileColor,
    special: SpecialType = SpecialType.NONE,
    tileSize: number = 76
  ) {
    super(scene, x, y);

    this.gridRow   = row;
    this.gridCol   = col;
    this.tileColor = color;
    this.special   = special;
    this.tileSize  = tileSize;

    // ── 1. Selection glow ring (behind sprite) ──────────────────────────────
    // Two layered rings: outer glow + sharp white inner border
    this.glowRing = scene.add.graphics();
    this.buildGlowRing(this.glowRing, tileSize, 1);
    this.glowRing.setVisible(false);
    this.glowRing.setAlpha(0);
    this.add(this.glowRing);

    // ── 2. Gem sprite ──────────────────────────────────────────────────────
    const textureKey = color === TileColor.RAINBOW ? 'gem_rainbow' : `gem_${color}`;
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setDisplaySize(tileSize, tileSize);
    this.add(this.sprite);

    // ── 3. Special badge ───────────────────────────────────────────────────
    this.setupBadge();

    this.setSize(tileSize, tileSize);
    this.setInteractive();
    scene.add.existing(this);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  public setGridPosition(row: number, col: number): void {
    this.gridRow = row;
    this.gridCol = col;
  }

  public setColor(color: TileColor): void {
    this.tileColor = color;
    const key = color === TileColor.RAINBOW ? 'gem_rainbow' : `gem_${color}`;
    this.sprite.setTexture(key);
    this.sprite.setDisplaySize(this.tileSize, this.tileSize);
  }

  public setSpecial(special: SpecialType): void {
    this.special = special;
    this.setupBadge();
  }

  /** Toggle selection state with glow ring + gentle pulse. */
  public setSelected(selected: boolean): void {
    this.clearHint();

    // Kill any running pulse tween
    if (this.glowTween) { this.glowTween.stop(); this.glowTween = null; }

    // Restore sprite to exact tile size
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setDisplaySize(this.tileSize, this.tileSize);

    if (selected) {
      this.glowRing.setVisible(true);

      // Fade-in glow + repeating alpha pulse
      this.glowTween = this.scene.tweens.add({
        targets:  this.glowRing,
        alpha:    { from: 0.6, to: 1 },
        duration: 320,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut'
      });

      // Gentle sprite scale pulse (display-size based, no raw scale fighting)
      const base   = this.tileSize;
      const peaked = this.tileSize * 1.07;
      this.scene.tweens.add({
        targets:       this.sprite,
        displayWidth:  { from: base, to: peaked },
        displayHeight: { from: base, to: peaked },
        duration:      360,
        yoyo:          true,
        repeat:        -1,
        ease:          'Sine.easeInOut'
      });

    } else {
      this.glowRing.setVisible(false);
      this.glowRing.setAlpha(0);
    }
  }

  public showHint(): void {
    this.clearHint();
    this.hintTween = this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.08 },
      duration: 360,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => { this.scale = 1; this.hintTween = null; }
    });
  }

  public clearHint(): void {
    if (this.hintTween) {
      this.hintTween.stop();
      this.hintTween = null;
    }
    this.scale = 1;
  }

  /** Shake the tile and flash red — used when an invalid swap is attempted. */
  public shakeInvalid(): void {
    const ox = this.x;
    const d  = Math.round(this.tileSize * 0.12);   // shake distance ~12% of tile

    this.scene.tweens.add({
      targets:  this,
      x:        { from: ox - d, to: ox + d },
      duration: 55,
      repeat:   4,
      yoyo:     true,
      ease:     'Sine.easeInOut',
      onComplete: () => { this.x = ox; }
    });

    // Brief red tint on the sprite
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(320, () => this.sprite.clearTint());
  }

  public animatePop(onComplete?: () => void): void {
    const reducedMotion = SaveManager.getInstance().getData().settings.reducedMotion;
    if (reducedMotion) {
      this.alpha = 0;
      if (onComplete) onComplete();
      this.destroy();
      return;
    }

    // Brief scale-up flash, then pop out — more satisfying than a plain shrink
    this.scene.tweens.add({
      targets:  this.sprite,
      displayWidth:  { from: this.tileSize * 1.22, to: this.tileSize * 0.05 },
      displayHeight: { from: this.tileSize * 1.22, to: this.tileSize * 0.05 },
      duration: 200,
      ease:     'Back.easeIn'
    });
    this.scene.tweens.add({
      targets:    this,
      alpha:      0,
      duration:   200,
      delay:      40,
      ease:       'Cubic.easeIn',
      onComplete: () => { if (onComplete) onComplete(); this.destroy(); }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build two concentric rounded-rect rings:
   *   outer — wide soft glow (yellow-white)
   *   inner — sharp white border 2px inside the tile edge
   */
  private buildGlowRing(g: Phaser.GameObjects.Graphics, ts: number, _layer: number): void {
    g.clear();
    const half = ts / 2;
    const r    = Math.round(ts * 0.20);   // corner radius matching gem texture

    // Outer diffuse glow
    g.lineStyle(6, 0xfde047, 0.55);
    g.strokeRoundedRect(-half - 4, -half - 4, ts + 8, ts + 8, r + 4);

    // Sharp white inner border
    g.lineStyle(2.5, 0xffffff, 1);
    g.strokeRoundedRect(-half + 1, -half + 1, ts - 2, ts - 2, r);
  }

  private setupBadge(): void {
    if (this.badge) { this.badge.destroy(); this.badge = null; }

    let badgeKey: string | null = null;
    if      (this.special === SpecialType.LINE_HORIZONTAL) badgeKey = 'badge_line_h';
    else if (this.special === SpecialType.LINE_VERTICAL)   badgeKey = 'badge_line_v';
    else if (this.special === SpecialType.BOMB)            badgeKey = 'badge_bomb';

    if (badgeKey) {
      this.badge = this.scene.add.sprite(0, 0, badgeKey);
      this.badge.setDisplaySize(this.tileSize * 0.72, this.tileSize * 0.72);
      this.add(this.badge);
      this.scene.tweens.add({
        targets:  this.badge,
        alpha:    { from: 0.75, to: 1 },
        duration: 420,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.easeInOut'
      });
    }
  }
}
