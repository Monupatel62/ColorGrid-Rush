import Phaser from 'phaser';
import { TILE_COLORS, STANDARD_COLORS } from '../data/colors';
import { GAME_CONFIG } from '../data/gameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    this.createTileTextures();
    this.createSpecialBadges();
    this.createBoardSlotTexture();
    this.createIceTexture();
    this.createParticleTexture();
    this.createStarTextures();
    this.createUiTextures();
  }

  public create(): void {
    this.scene.start('MainMenuScene');
  }

  // ─── Gem tiles ────────────────────────────────────────────────────────────
  private createTileTextures(): void {
    const size = GAME_CONFIG.TILE_SIZE;   // 96 px
    const pad  = 5;                        // outer padding
    const r    = 20;                       // corner radius — rounder than before
    const inner = {
      x: pad, y: pad,
      w: size - pad * 2,
      h: size - pad * 2
    };

    STANDARD_COLORS.forEach((colorId) => {
      const def = TILE_COLORS[colorId];
      const tex = this.textures.createCanvas(`gem_${colorId}`, size, size);
      if (!tex) return;
      const ctx = tex.context;

      // ── 1. Outer drop-shadow ──
      ctx.save();
      ctx.shadowColor   = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur    = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle     = this.darkenHex(def.hexString, 40);
      this.roundRect(ctx, inner.x, inner.y, inner.w, inner.h, r);
      ctx.fill();
      ctx.restore();

      // ── 2. Main body gradient (top-light) ──
      const bodyGrad = ctx.createLinearGradient(0, inner.y, 0, inner.y + inner.h);
      bodyGrad.addColorStop(0,   this.lightenHex(def.hexString, 40));
      bodyGrad.addColorStop(0.45, def.hexString);
      bodyGrad.addColorStop(1,   this.darkenHex(def.hexString, 30));
      ctx.fillStyle = bodyGrad;
      this.roundRect(ctx, inner.x, inner.y, inner.w, inner.h, r);
      ctx.fill();

      // ── 3. Bright inner bevel (top + left edge) ──
      ctx.save();
      this.roundRect(ctx, inner.x, inner.y, inner.w, inner.h, r);
      ctx.clip();
      const bevelGrad = ctx.createLinearGradient(inner.x, inner.y, inner.x + inner.w * 0.5, inner.y + inner.h * 0.5);
      bevelGrad.addColorStop(0,   'rgba(255,255,255,0.45)');
      bevelGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = bevelGrad;
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
      ctx.restore();

      // ── 4. Gloss highlight (upper 38% oval) ──
      ctx.save();
      this.roundRect(ctx, inner.x + 4, inner.y + 4, inner.w - 8, inner.h * 0.42, r - 4);
      ctx.clip();
      const glossGrad = ctx.createLinearGradient(0, inner.y + 4, 0, inner.y + inner.h * 0.42);
      glossGrad.addColorStop(0, 'rgba(255,255,255,0.72)');
      glossGrad.addColorStop(1, 'rgba(255,255,255,0.04)');
      ctx.fillStyle = glossGrad;
      ctx.fillRect(inner.x + 4, inner.y + 4, inner.w - 8, inner.h * 0.42);
      ctx.restore();

      // ── 5. Outer stroke ──
      ctx.lineWidth   = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      this.roundRect(ctx, inner.x + 1, inner.y + 1, inner.w - 2, inner.h - 2, r - 1);
      ctx.stroke();

      // ── 6. Symbol — larger, centred, readable ──
      const symSize = Math.round(size * 0.26);   // 25 px at 96-px texture
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 2.5;
      this.drawSymbol(ctx, def.symbol, size / 2, size / 2 + 2, symSize);

      tex.refresh();
    });

    // ── Rainbow gem ──
    const rainTex = this.textures.createCanvas('gem_rainbow', size, size);
    if (rainTex) {
      const ctx  = rainTex.context;
      const cx   = size / 2;
      const cy   = size / 2;

      // Body — radial rainbow
      const rg = ctx.createRadialGradient(cx, cy - 8, 4, cx, cy, size * 0.52);
      rg.addColorStop(0,    '#ffffff');
      rg.addColorStop(0.18, '#fef08a');
      rg.addColorStop(0.38, '#f59e0b');
      rg.addColorStop(0.58, '#ef4444');
      rg.addColorStop(0.78, '#8b5cf6');
      rg.addColorStop(1,    '#3b82f6');
      ctx.fillStyle = rg;
      this.roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, r);
      ctx.fill();

      // Gloss
      ctx.save();
      this.roundRect(ctx, pad + 4, pad + 4, size - pad * 2 - 8, (size - pad * 2) * 0.40, r - 4);
      ctx.clip();
      const gg = ctx.createLinearGradient(0, pad + 4, 0, size * 0.44);
      gg.addColorStop(0, 'rgba(255,255,255,0.68)');
      gg.addColorStop(1, 'rgba(255,255,255,0.02)');
      ctx.fillStyle = gg;
      ctx.fillRect(pad + 4, pad + 4, size - pad * 2 - 8, size * 0.44);
      ctx.restore();

      // Golden border
      ctx.lineWidth   = 2.5;
      ctx.strokeStyle = 'rgba(254,240,138,0.9)';
      this.roundRect(ctx, pad + 1, pad + 1, size - pad * 2 - 2, size - pad * 2 - 2, r - 1);
      ctx.stroke();

      // Star symbol
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth   = 2;
      const ss = Math.round(size * 0.22);
      this.drawStar(ctx, cx, cy + 2, 5, ss, ss * 0.42);
      ctx.fill();
      ctx.stroke();

      rainTex.refresh();
    }
  }

  // ─── Special badges ────────────────────────────────────────────────────────
  private createSpecialBadges(): void {
    const size = GAME_CONFIG.TILE_SIZE;

    // Line Horizontal
    const hTex = this.textures.createCanvas('badge_line_h', size, size);
    if (hTex) {
      const ctx = hTex.context;
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12;
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      const m  = size / 2;
      const aw = size * 0.32;
      // Left arrow
      ctx.moveTo(size * 0.08, m);
      ctx.lineTo(size * 0.08 + aw * 0.55, m - size * 0.12);
      ctx.lineTo(size * 0.08 + aw * 0.55, m + size * 0.12);
      // Right arrow
      ctx.moveTo(size * 0.92, m);
      ctx.lineTo(size * 0.92 - aw * 0.55, m - size * 0.12);
      ctx.lineTo(size * 0.92 - aw * 0.55, m + size * 0.12);
      // Centre bar
      ctx.rect(size * 0.08 + aw * 0.55 - 2, m - size * 0.05,
               size * 0.84 - aw * 1.1 + 4, size * 0.10);
      ctx.fill();
      hTex.refresh();
    }

    // Line Vertical
    const vTex = this.textures.createCanvas('badge_line_v', size, size);
    if (vTex) {
      const ctx = vTex.context;
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12;
      ctx.fillStyle   = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      const m  = size / 2;
      const ah = size * 0.32;
      // Top arrow
      ctx.moveTo(m, size * 0.08);
      ctx.lineTo(m - size * 0.12, size * 0.08 + ah * 0.55);
      ctx.lineTo(m + size * 0.12, size * 0.08 + ah * 0.55);
      // Bottom arrow
      ctx.moveTo(m, size * 0.92);
      ctx.lineTo(m - size * 0.12, size * 0.92 - ah * 0.55);
      ctx.lineTo(m + size * 0.12, size * 0.92 - ah * 0.55);
      // Centre bar
      ctx.rect(m - size * 0.05, size * 0.08 + ah * 0.55 - 2,
               size * 0.10, size * 0.84 - ah * 1.1 + 4);
      ctx.fill();
      vTex.refresh();
    }

    // Bomb badge
    const bTex = this.textures.createCanvas('badge_bomb', size, size);
    if (bTex) {
      const ctx = bTex.context;
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 14;
      ctx.fillStyle   = '#f97316';
      this.drawStar(ctx, size / 2, size / 2, 8, size * 0.22, size * 0.12);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      bTex.refresh();
    }
  }

  // ─── Board slot ────────────────────────────────────────────────────────────
  private createBoardSlotTexture(): void {
    const size = GAME_CONFIG.TILE_SIZE;
    const tex  = this.textures.createCanvas('board_slot', size, size);
    if (!tex) return;
    const ctx = tex.context;
    ctx.fillStyle = 'rgba(10,16,32,0.72)';
    this.roundRect(ctx, 3, 3, size - 6, size - 6, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth   = 1.5;
    this.roundRect(ctx, 4, 4, size - 8, size - 8, 17);
    ctx.stroke();
    tex.refresh();
  }

  // ─── Ice tile ──────────────────────────────────────────────────────────────
  private createIceTexture(): void {
    const size = GAME_CONFIG.TILE_SIZE;
    const tex  = this.textures.createCanvas('ice_tile', size, size);
    if (!tex) return;
    const ctx = tex.context;
    const g   = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, 'rgba(186,230,253,0.78)');
    g.addColorStop(0.5, 'rgba(125,211,252,0.58)');
    g.addColorStop(1, 'rgba(56,189,248,0.72)');
    ctx.fillStyle = g;
    this.roundRect(ctx, 3, 3, size - 6, size - 6, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth   = 2;
    // Frost cracks
    ctx.beginPath();
    ctx.moveTo(10, 14); ctx.lineTo(28, 32); ctx.lineTo(46, 22); ctx.lineTo(size - 10, size - 12);
    ctx.moveTo(size - 16, 18); ctx.lineTo(48, 38); ctx.lineTo(22, 54);
    ctx.stroke();
    tex.refresh();
  }

  // ─── Particle ──────────────────────────────────────────────────────────────
  private createParticleTexture(): void {
    const tex = this.textures.createCanvas('particle_glow', 32, 32);
    if (!tex) return;
    const ctx = tex.context;
    const g   = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.18)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    tex.refresh();
  }

  // ─── Stars ────────────────────────────────────────────────────────────────
  private createStarTextures(): void {
    const filled = this.textures.createCanvas('star_filled', 64, 64);
    if (filled) {
      const ctx = filled.context;
      ctx.shadowColor = 'rgba(245,158,11,0.9)'; ctx.shadowBlur = 14;
      const g = ctx.createLinearGradient(0, 8, 0, 56);
      g.addColorStop(0, '#fef08a'); g.addColorStop(0.5, '#f59e0b'); g.addColorStop(1, '#d97706');
      ctx.fillStyle = g;
      this.drawStar(ctx, 32, 32, 5, 27, 12);
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff';
      this.drawStar(ctx, 32, 32, 5, 27, 12); ctx.stroke();
      filled.refresh();
    }
    const empty = this.textures.createCanvas('star_empty', 64, 64);
    if (empty) {
      const ctx = empty.context;
      ctx.fillStyle = 'rgba(51,65,85,0.55)';
      this.drawStar(ctx, 32, 32, 5, 25, 11); ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(148,163,184,0.38)';
      this.drawStar(ctx, 32, 32, 5, 25, 11); ctx.stroke();
      empty.refresh();
    }
  }

  // ─── UI icons ─────────────────────────────────────────────────────────────
  private createUiTextures(): void {
    const lockTex = this.textures.createCanvas('icon_lock', 40, 40);
    if (lockTex) {
      const ctx = lockTex.context;
      ctx.fillStyle = '#94a3b8';
      this.roundRect(ctx, 8, 18, 24, 18, 4); ctx.fill();
      ctx.lineWidth = 3.5; ctx.strokeStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(20, 18, 7, Math.PI, 0, false); ctx.stroke();
      lockTex.refresh();
    }
  }

  // ─── Canvas helpers ───────────────────────────────────────────────────────

  /** Reusable rounded-rect path (replaces old drawRoundedRect) */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ): void {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y,         x + rad, y);
    ctx.closePath();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, spikes: number, outer: number, inner: number
  ): void {
    let rot  = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer); rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner); rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
  }

  private drawSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: string, cx: number, cy: number, s: number
  ): void {
    ctx.beginPath();
    switch (symbol) {
      case 'diamond':
        ctx.moveTo(cx,         cy - s);
        ctx.lineTo(cx + s * 0.72, cy);
        ctx.lineTo(cx,         cy + s);
        ctx.lineTo(cx - s * 0.72, cy);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = cx + s * Math.cos(a);
          const py = cy + s * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case 'circle':
        ctx.arc(cx, cy, s * 0.82, 0, Math.PI * 2);
        break;
      case 'star':
        this.drawStar(ctx, cx, cy, 5, s, s * 0.44);
        break;
      case 'triangle':
        ctx.moveTo(cx,          cy - s * 0.95);
        ctx.lineTo(cx + s * 0.95, cy + s * 0.78);
        ctx.lineTo(cx - s * 0.95, cy + s * 0.78);
        ctx.closePath();
        break;
    }
    ctx.fill();
    ctx.stroke();
  }

  private lightenHex(hex: string, pct: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const a = Math.round(2.55 * pct);
    return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`;
  }

  private darkenHex(hex: string, pct: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const a = Math.round(2.55 * pct);
    return `rgb(${Math.max(0, (n >> 16) - a)},${Math.max(0, ((n >> 8) & 0xff) - a)},${Math.max(0, (n & 0xff) - a)})`;
  }
}
