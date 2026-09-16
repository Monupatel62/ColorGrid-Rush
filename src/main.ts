import Phaser from 'phaser';
import { gameConfig } from './config';

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(gameConfig);
});
