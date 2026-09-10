export const HUD_LAYOUT = {
  player: { x: 122, y: 66 },
  enemy: { rightInset: 54, y: 66 },
  portraitRadius: 30,
  labelOffsetY: -30,
  labelFontSize: 11,
} as const;

const BAR_HORIZONTAL_INSET_RATIO = 0.06;

// Keep the frame geometry pure so the Node suite can guard against bars spilling
// over the beveled raster artwork again.
export function getHudBarMetrics(frameWidth: number): { inset: number; width: number } {
  const inset = frameWidth * BAR_HORIZONTAL_INSET_RATIO;
  return { inset, width: frameWidth - inset * 2 };
}
