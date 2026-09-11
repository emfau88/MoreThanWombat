export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const ZERO_SAFE_AREA: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function convertCssSafeAreaToGame(
  cssInsets: SafeAreaInsets,
  gameWidth: number,
  gameHeight: number,
  displayWidth: number,
  displayHeight: number,
): SafeAreaInsets {
  const scaleX = displayWidth > 0 ? displayWidth / gameWidth : 1;
  const scaleY = displayHeight > 0 ? displayHeight / gameHeight : 1;

  return {
    top: cssInsets.top / scaleY,
    right: cssInsets.right / scaleX,
    bottom: cssInsets.bottom / scaleY,
    left: cssInsets.left / scaleX,
  };
}

export function readBrowserSafeAreaInsets(): SafeAreaInsets {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { ...ZERO_SAFE_AREA };
  }

  const styles = getComputedStyle(document.documentElement);
  const read = (property: string): number => {
    const parsed = Number.parseFloat(styles.getPropertyValue(property));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  return {
    top: read('--game-safe-area-top'),
    right: read('--game-safe-area-right'),
    bottom: read('--game-safe-area-bottom'),
    left: read('--game-safe-area-left'),
  };
}
