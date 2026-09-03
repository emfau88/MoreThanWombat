import type { CircleTarget, RectTarget } from './MobileControlHitTest';

export type MobileControlLayout = {
  joystick: CircleTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  menu: RectTarget;
};

export function getMobileControlLayout(width: number, height: number): MobileControlLayout {
  return {
    joystick: { x: 92, y: height - 92, radius: 58 },
    attack: { x: width - 96, y: height - 86, radius: 42 },
    special: { x: width - 170, y: height - 146, radius: 34 },
    ultimate: { x: width - 98, y: height - 178, radius: 32 },
    jump: { x: width - 176, y: height - 68, radius: 32 },
    menu: { x: 52, y: 30, width: 70, height: 24 },
  };
}
