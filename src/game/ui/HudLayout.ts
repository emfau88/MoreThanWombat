export const HUD_LAYOUT = {
  player: { x: 96, y: 66 },
  // Keep this pure so it can be checked in the Node test suite without Phaser.
  enemy: { x: 960 - 18, y: 66 },
  labelOffsetY: -30,
  labelFontSize: 11,
} as const;
