import Phaser from 'phaser';

export function syncCanvasSize(scene: Phaser.Scene): { width: number; height: number } {
  const host = document.getElementById('game-canvas-wrap');
  const width = host?.clientWidth || scene.scale.width;
  const height = host?.clientHeight || scene.scale.height;

  if (scene.scale.width !== width || scene.scale.height !== height) {
    scene.scale.setGameSize(width, height);
    scene.scale.resize(width, height);
    scene.cameras.resize(width, height);
  }

  return { width, height };
}