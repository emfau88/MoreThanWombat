import type { CircleTarget, RectTarget } from './MobileControlHitTest';

export const ACTION_BUTTON_SCALE = 1.1;
export const ACTION_BUTTON_RADII = {
  attack: 42 * ACTION_BUTTON_SCALE,
  special: 34 * ACTION_BUTTON_SCALE,
  ultimate: 32 * ACTION_BUTTON_SCALE,
  jump: 32 * ACTION_BUTTON_SCALE,
} as const;

export type MobileControlLayout = {
  joystick: CircleTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  menu: RectTarget;
};

export function getMobileControlLayout(width: number, height: number): MobileControlLayout {
  // Grow the cluster around its bottom/right margins, including the spaces
  // between buttons, so the larger circles never crowd each other.
  const action = (right: number, bottom: number, radius: number): CircleTarget => ({
    x: width - 54 - (right - 54) * ACTION_BUTTON_SCALE,
    y: height - 36 - (bottom - 36) * ACTION_BUTTON_SCALE,
    radius,
  });
  return {
    joystick: { x: 92, y: height - 92, radius: 58 },
    attack: action(96, 86, ACTION_BUTTON_RADII.attack),
    special: action(170, 146, ACTION_BUTTON_RADII.special),
    ultimate: action(98, 178, ACTION_BUTTON_RADII.ultimate),
    jump: action(176, 68, ACTION_BUTTON_RADII.jump),
    menu: { x: 52, y: 30, width: 70, height: 24 },
  };
}
