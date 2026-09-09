import type { CircleTarget, RectTarget } from './MobileControlHitTest';

export const ACTION_BUTTON_RADII = {
  attack: 46,
  jump: 40,
  special: 36,
  defend: 34,
  ultimate: 31,
} as const;

export type MobileControlLayout = {
  joystick: CircleTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  defend: CircleTarget;
  menu: RectTarget;
};

export function getMobileControlLayout(width: number, height: number): MobileControlLayout {
  // Right-thumb fan: the primary and mobility actions sit on the lower arc,
  // guard remains reachable while the left thumb steers, and the rare ultimate
  // stays deliberately furthest from the resting thumb.
  const action = (right: number, bottom: number, radius: number): CircleTarget => ({
    x: width - right,
    y: height - bottom,
    radius,
  });
  return {
    joystick: { x: 92, y: height - 92, radius: 58 },
    attack: action(83, 76, ACTION_BUTTON_RADII.attack),
    jump: action(185, 68, ACTION_BUTTON_RADII.jump),
    special: action(185, 158, ACTION_BUTTON_RADII.special),
    defend: action(101, 171, ACTION_BUTTON_RADII.defend),
    ultimate: action(178, 234, ACTION_BUTTON_RADII.ultimate),
    menu: { x: 52, y: 30, width: 70, height: 24 },
  };
}
