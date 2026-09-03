export const HUD_LAYOUT = {
  player: { x: 28, y: 66 },
  // Keep this pure so it can be checked in the Node test suite without Phaser.
  enemy: { x: 960 - 28, y: 54 },
  labelOffsetY: -20,
  labelFontSize: 13,
} as const;
