import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { PlayScene } from './scenes/PlayScene';
import { PauseScene } from './scenes/PauseScene';
import { VictoryScene } from './scenes/VictoryScene';
import { GameOverScene } from './scenes/GameOverScene';
import { SettingsScene } from './scenes/SettingsScene';

const gameHost = document.getElementById('game-canvas-wrap');
const initialWidth = gameHost?.clientWidth || window.innerWidth;
const initialHeight = gameHost?.clientHeight || window.innerHeight;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-canvas-wrap',
  backgroundColor: '#0d1117',
  scale: {
    /**
     * RESIZE mode: Phaser continuously resizes the canvas to fill
     * its parent element (#game-canvas-wrap).
     * On mobile  → parent is position:absolute, inset:0  → fills viewport.
     * On desktop → parent is a flex child of #desktop-main → fills centre column.
     */
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,   // we centre via CSS flex, not Phaser
    width:  initialWidth,
    height: initialHeight
  },
  input: {
    activePointers: 3   // support pinch gestures on mobile
  },
  scene: [
    BootScene,
    MainMenuScene,
    LevelSelectScene,
    PlayScene,
    PauseScene,
    VictoryScene,
    GameOverScene,
    SettingsScene
  ]
};
