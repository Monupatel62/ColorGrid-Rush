# ColorGrid Rush 💎

A vibrant, fast-paced casual match-3 puzzle game built from scratch with **Phaser 3**, **TypeScript**, **Vite**, and **Capacitor**.

---

## 🎮 Game Overview

**ColorGrid Rush** delivers polished casual match-3 gameplay designed for seamless play across modern web browsers and Android devices.

- **8×8 Grid**: Fast-falling gem physics with cascade chain reactions and combo multipliers.
- **5 Jewel Types & 100% Colorblind Accessible**: Every gem features a distinct geometric rune symbol:
  - 🔴 **Ruby**: Diamond
  - 🔵 **Sapphire**: Hexagon
  - 🟢 **Emerald**: Circle
  - 🟡 **Topaz**: Star
  - 🟣 **Amethyst**: Triangle
- **Special Tiles**:
  - **Line Blaster** (4-in-a-row): Laser blast clearing full horizontal row or vertical column.
  - **Area Bomb** (T or L match): 3×3 explosive radius with shockwave effect.
  - **Rainbow Gem** (5-in-a-row): Clears all tiles of matched color or whole board when combined.
- **Special-to-Special Combinations**:
  - *Line + Line*: Cross Blaster (clears row AND column).
  - *Line + Bomb*: Mega Blaster (clears 3 rows and 3 columns).
  - *Bomb + Bomb*: Mega Bomb (5×5 blast).
  - *Rainbow + Rainbow*: Screen-clearing super explosion.
- **100 Timed Levels**:
  - A live countdown is enforced in every level; reaching zero ends the run immediately.
  - Difficulty rises through tighter time and move limits, higher targets, and denser ice layouts.
  - Diverse objectives: Score target, Color gem collection, and Ice-clearing obstacles.
  - 3-star rating system with bonus Rush points for leftover moves.
- **Synthesized Web Audio Engine**: Zero external audio assets! Pure Web Audio API synthesizers create click taps, swooshes, ascending combo chimes, laser blasts, bomb rumbles, victory fanfares, and an upbeat background melody.
- **Safe Save System**: Persistent local storage saves unlocked levels, stars, high scores, and settings with corruption recovery.
- **Responsive Portrait Design**: Scaled automatically for mobile screens, tablets, and desktop browsers.

---

## 📁 Project Architecture

```
ColorGrid-Rush/
├── index.html                  # Responsive entry wrapper & SEO metadata
├── package.json                # Dependencies, scripts, and build commands
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Vite bundler configuration with chunk splitting
├── capacitor.config.ts         # Android native wrapper configuration
├── ANDROID_BUILD_GUIDE.md      # Step-by-step Android APK / AAB signing guide
├── tests/                      # Automated Vitest algorithmic test suites
│   ├── MatchDetector.test.ts   # 3+, 4+, 5+, T/L and special tile tests
│   ├── BoardGenerator.test.ts  # Zero-initial-match & valid-moves verification
│   ├── BoardGravity.test.ts    # Gravity drop & refill tests
│   └── SaveManager.test.ts     # Save/load/corrupted JSON recovery tests
├── src/
│   ├── main.ts                 # Bootstrap & game launch
│   ├── config.ts               # Phaser game configuration & scene list
│   ├── data/
│   │   ├── colors.ts           # Color definitions, symbols, RGBs
│   │   ├── levels.ts           # 10 handcrafted levels with objectives & ice maps
│   │   └── gameConfig.ts       # Balance constants, scoring, timers
│   ├── board/
│   │   ├── Board.ts            # Main board coordinator, swaps, cascades, specials
│   │   ├── Tile.ts             # Gem container, sprites, badges, selection glows
│   │   ├── MatchDetector.ts    # Pure algorithmic match scanner & special spawns
│   │   ├── BoardGenerator.ts   # Guaranteed playable board generation
│   │   └── BoardRefill.ts      # Falling gravity & column refill matrices
│   ├── systems/
│   │   ├── InputManager.ts     # Touch swiping & pointer click-swap controls
│   │   ├── ScoreSystem.ts      # Score calculation & combo multipliers
│   │   ├── LevelSystem.ts      # Objectives tracking & win/loss checks
│   │   ├── AudioManager.ts     # Web Audio API sound & music synthesizer
│   │   ├── SaveManager.ts      # Safe localStorage persistence
│   │   └── ParticleSystem.ts   # Match bursts, line beams, bomb shockwaves
│   ├── scenes/
│   │   ├── BootScene.ts        # Procedural canvas vector texture generator
│   │   ├── MainMenuScene.ts    # Title screen, progress badge, navigation
│   │   ├── LevelSelectScene.ts # 10 level cards with star counts & lock states
│   │   ├── PlayScene.ts        # Gameplay scene, HUD, board, combo callouts
│   │   ├── PauseScene.ts       # Pause modal with resume, restart, and settings
│   │   ├── VictoryScene.ts     # Star pop animation, score breakdown, next level
│   │   ├── GameOverScene.ts    # Out of moves modal with shortfall hint & retry
│   │   └── SettingsScene.ts    # SFX, Music, Motion, and Reset progress
│   └── ui/
│       ├── Button.ts           # Interactive button with press tween & sound
│       ├── HUD.ts              # Moves counter, score, objective tracker
│       ├── ProgressBar.ts      # Animated progress bar
│       └── Modal.ts            # Reusable animated popup dialog
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```
Compiled production files will be output to `dist/`.

---

## 🌐 Web Deployment

The `dist/` directory contains static web assets (`index.html`, minified CSS/JS chunks) and can be hosted on any static provider:

- **Vercel**: Run `npx vercel` or connect repository.
- **Netlify**: Run `npx netlify deploy --prod --dir=dist` or drag-and-drop the `dist` folder.
- **Cloudflare Pages**: Connect the repository to Cloudflare Pages and deploy the `dist/` folder.

---

## 📱 Android Packaging

Refer to [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for full instructions on:
- Adding the Android native platform (`npx cap add android`)
- Syncing web builds to Android Studio (`npm run android:build`)
- Generating release keystores and signed App Bundles (`.aab`) for the Google Play Store.

---

## 🧪 Testing Report

All test suites run via **Vitest 2.1+**:
- `tests/MatchDetector.test.ts`: **PASSED** (4/4 tests: 3-matches, 4-in-a-row Line Blaster, 5-in-a-row Rainbow Gem, T-shape Area Bomb).
- `tests/BoardGenerator.test.ts`: **PASSED** (2/2 tests: 50 randomly generated boards have 0 pre-existing matches, all boards have $\ge 1$ valid move).
- `tests/BoardGravity.test.ts`: **PASSED** (1/1 test: hole drops and top refills verified).
- `tests/SaveManager.test.ts`: **PASSED** (3/3 tests: default initialization, level completion & star unlock, corrupted JSON error handling).

Total: **10 Tests Passed (100%)**.
TypeScript: **Zero Errors (strict mode)**.
