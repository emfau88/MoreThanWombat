import type { CircleTarget, RectTarget } from './MobileControlHitTest';
import { ZERO_SAFE_AREA, type SafeAreaInsets } from './SafeArea';

export const ACTION_BUTTON_VISUAL_DIAMETERS = {
  attack: 86,
  jump: 74,
  special: 64,
  defend: 68,
  ultimate: 64,
} as const;

export const ACTION_BUTTON_HIT_DIAMETERS = {
  attack: 92,
  jump: 82,
  special: 82,
  defend: 82,
  ultimate: 82,
} as const;

export const ACTION_BUTTON_RADII = {
  attack: 46,
  jump: 41,
  special: 41,
  defend: 41,
  ultimate: 41,
} as const;

export const JOYSTICK_VISUAL_DIAMETER = 112;
export const JOYSTICK_KNOB_VISUAL_DIAMETER = 70;

export type MobileControlLayout = {
  joystick: CircleTarget;
  joystickRegion: RectTarget;
  joystickClamp: RectTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  defend: CircleTarget;
  menu: RectTarget;
};

export type MobileControlLayoutOptions = {
  safeArea?: SafeAreaInsets;
  cssPixelsPerGameUnit?: number;
};

const MIN_FREQUENT_TOUCH_TARGET_CSS_PX = 48;

export function getMobileControlLayout(
  width: number,
  height: number,
  options: MobileControlLayoutOptions = {},
): MobileControlLayout {
  const safeArea = options.safeArea ?? ZERO_SAFE_AREA;
  const cssPixelsPerGameUnit = Math.max(0.01, options.cssPixelsPerGameUnit ?? 1);
  const minimumLogicalDiameter = MIN_FREQUENT_TOUCH_TARGET_CSS_PX / cssPixelsPerGameUnit;
  const hitRadius = (button: keyof typeof ACTION_BUTTON_HIT_DIAMETERS): number => (
    Math.max(ACTION_BUTTON_HIT_DIAMETERS[button], minimumLogicalDiameter) * 0.5
  );
  const action = (right: number, bottom: number, radius: number): CircleTarget => ({
    x: width - safeArea.right - right,
    y: height - safeArea.bottom - bottom,
    radius,
  });
  const joystickRadius = JOYSTICK_VISUAL_DIAMETER * 0.5;
  const joystickRegionLeft = safeArea.left;
  const joystickRegionRight = Math.min(width * 0.43, safeArea.left + 460);
  const joystickRegionTop = Math.max(safeArea.top + 110, height * 0.42);
  const joystickRegionBottom = height - safeArea.bottom;
  const joystickClampLeft = joystickRegionLeft + joystickRadius;
  const joystickClampRight = Math.max(joystickClampLeft, joystickRegionRight - joystickRadius);
  const joystickClampTop = joystickRegionTop + joystickRadius;
  const joystickClampBottom = Math.max(joystickClampTop, joystickRegionBottom - joystickRadius);

  return {
    joystick: {
      x: clamp(safeArea.left + 92, joystickClampLeft, joystickClampRight),
      y: clamp(height - safeArea.bottom - 78, joystickClampTop, joystickClampBottom),
      radius: joystickRadius,
    },
    joystickRegion: rectFromBounds(
      joystickRegionLeft,
      joystickRegionTop,
      joystickRegionRight,
      joystickRegionBottom,
    ),
    joystickClamp: rectFromBounds(
      joystickClampLeft,
      joystickClampTop,
      joystickClampRight,
      joystickClampBottom,
    ),
    attack: action(65, 64, hitRadius('attack')),
    jump: action(158, 64, hitRadius('jump')),
    special: action(216, 150, hitRadius('special')),
    defend: action(62, 150, hitRadius('defend')),
    ultimate: action(139, 150, hitRadius('ultimate')),
    menu: { x: safeArea.left + 52, y: safeArea.top + 30, width: 70, height: 24 },
  };
}

export function getFloatingJoystickCenter(
  point: { x: number; y: number },
  layout: Pick<MobileControlLayout, 'joystickClamp'>,
): { x: number; y: number } {
  const clampRect = layout.joystickClamp;
  const halfWidth = clampRect.width * 0.5;
  const halfHeight = clampRect.height * 0.5;
  return {
    x: clamp(point.x, clampRect.x - halfWidth, clampRect.x + halfWidth),
    y: clamp(point.y, clampRect.y - halfHeight, clampRect.y + halfHeight),
  };
}

function rectFromBounds(left: number, top: number, right: number, bottom: number): RectTarget {
  return {
    x: (left + right) * 0.5,
    y: (top + bottom) * 0.5,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
