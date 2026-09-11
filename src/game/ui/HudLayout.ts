export type HudSide = 'left' | 'right';

export type HudResourceSlot = {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
};

export type HudResourceFillRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const HUD_LAYOUT = {
  frame: {
    width: 238,
    height: 72,
    top: 18,
  },
  player: {
    left: 96,
  },
  enemy: {
    right: 18,
  },
  portrait: {
    x: 33,
    y: 36,
    radius: 24,
    artSize: 50,
  },
  label: {
    x: 67,
    y: 8,
    fontSize: 10,
  },
  hp: {
    x: 67,
    y: 27,
    width: 158,
    height: 14,
    padding: 3,
  },
  mana: {
    x: 67,
    y: 50,
    width: 158,
    height: 9,
    padding: 2,
  },
} as const;

export function getHudFrameAnchor(viewportWidth: number, side: HudSide): number {
  return side === 'left' ? HUD_LAYOUT.player.left : viewportWidth - HUD_LAYOUT.enemy.right;
}

export function getHudWorldX(anchorX: number, localX: number, side: HudSide): number {
  return side === 'left' ? anchorX + localX : anchorX - localX;
}

export function getHudResourceFillRect(
  slot: HudResourceSlot,
  ratio: number,
): HudResourceFillRect {
  const clampedRatio = Math.min(1, Math.max(0, ratio));
  const innerWidth = Math.max(0, slot.width - slot.padding * 2);
  const innerHeight = Math.max(0, slot.height - slot.padding * 2);

  return {
    x: slot.x + slot.padding,
    y: slot.y + slot.height * 0.5,
    width: innerWidth * clampedRatio,
    height: innerHeight,
  };
}
