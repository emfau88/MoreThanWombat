export type ScreenPoint = { x: number; y: number };
export type CircleTarget = { x: number; y: number; radius: number };
export type RectTarget = { x: number; y: number; width: number; height: number };
export type MobileControlTarget = 'menu' | 'attack' | 'special' | 'ultimate' | 'jump' | 'joystick' | 'none';

export type MobileControlGeometry = {
  screenWidth: number;
  menu: RectTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  joystickAvailable: boolean;
};

export function containsCircle(point: ScreenPoint, target: CircleTarget): boolean {
  const deltaX = point.x - target.x;
  const deltaY = point.y - target.y;
  return Math.hypot(deltaX, deltaY) <= target.radius;
}

export function containsRect(point: ScreenPoint, target: RectTarget): boolean {
  const halfWidth = target.width * 0.5;
  const halfHeight = target.height * 0.5;
  return point.x >= target.x - halfWidth
    && point.x <= target.x + halfWidth
    && point.y >= target.y - halfHeight
    && point.y <= target.y + halfHeight;
}

export function resolveMobileControlTarget(point: ScreenPoint, geometry: MobileControlGeometry): MobileControlTarget {
  if (containsRect(point, geometry.menu)) {
    return 'menu';
  }
  if (containsCircle(point, geometry.attack)) {
    return 'attack';
  }
  if (containsCircle(point, geometry.special)) {
    return 'special';
  }
  if (containsCircle(point, geometry.ultimate)) {
    return 'ultimate';
  }
  if (containsCircle(point, geometry.jump)) {
    return 'jump';
  }
  if (point.x <= geometry.screenWidth * 0.5 && geometry.joystickAvailable) {
    return 'joystick';
  }
  return 'none';
}
