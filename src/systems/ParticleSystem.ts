import Phaser from 'phaser';
import { TILE_COLORS, TileColor } from '../data/colors';
import { SaveManager } from './SaveManager';

export class ParticleSystem {
  private scene:   Phaser.Scene;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene   = scene;
    this.emitter = this.scene.add.particles(0, 0, 'particle_glow', {
      lifespan:  550,
      speed:     { min: 90, max: 240 },
      scale:     { start: 0.85, end: 0 },
      alpha:     { start: 1,    end: 0 },
      blendMode: 'ADD',
      emitting:  false
    });
    this.emitter.setDepth(50);
  }

  /** Burst of coloured particles at match position */
  public emitMatchBurst(x: number, y: number, color: TileColor): void {
    if (SaveManager.getInstance().getData().settings.reducedMotion) return;
    const hex = TILE_COLORS[color]?.hex ?? 0xffffff;
    this.emitter.setParticleTint(hex);
    this.emitter.explode(16, x, y);
  }

  /** Streaming particles along a cleared row or column */
  public emitLineBlast(x: number, y: number, isHorizontal: boolean): void {
    if (SaveManager.getInstance().getData().settings.reducedMotion) return;
    this.emitter.setParticleTint(0x38bdf8);
    const count = 22;
    for (let i = 0; i < count; i++) {
      const ox = isHorizontal ? (i - count / 2) * 34 : 0;
      const oy = isHorizontal ? 0 : (i - count / 2) * 34;
      this.emitter.explode(3, x + ox, y + oy);
    }
  }

  /** Expanding shockwave + burst for bomb clear */
  public emitBombExplosion(x: number, y: number): void {
    if (SaveManager.getInstance().getData().settings.reducedMotion) return;
    this.emitter.setParticleTint(0xf97316);
    this.emitter.explode(38, x, y);

    const ring = this.scene.add.circle(x, y, 10);
    ring.setStrokeStyle(4, 0xfacc15, 0.9);
    ring.setDepth(51);
    this.scene.tweens.add({
      targets: ring, radius: 130, alpha: 0,
      duration: 360, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  /** Rainbow confetti shower across the whole canvas */
  public emitVictoryConfetti(): void {
    if (SaveManager.getInstance().getData().settings.reducedMotion) return;
    const W      = this.scene.scale.width;
    const H      = this.scene.scale.height;
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xffffff, 0xfde047];

    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const cx = Phaser.Math.Between(Math.round(W * 0.1), Math.round(W * 0.9));
        const cy = Phaser.Math.Between(Math.round(H * 0.2), Math.round(H * 0.75));
        this.emitter.setParticleTint(colors[i % colors.length]);
        this.emitter.explode(28, cx, cy);
      });
    }
  }
}
