import { SaveManager } from '../systems/SaveManager';

export function triggerHaptic(duration: number = 18): void {
  const settings = SaveManager.getInstance().getData().settings;
  if (!settings.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(duration);
}