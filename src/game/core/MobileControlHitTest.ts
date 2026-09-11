export type ScreenPoint = { x: number; y: number };
export type CircleTarget = { x: number; y: number; radius: number };
export type RectTarget = { x: number; y: number; width: number; height: number };
export type MobileControlTarget = 'menu' | 'attack' | 'special' | 'ultimate' | 'jump' | 'defend' | 'joystick' | 'none';

export type MobileControlGeometry = {
  menu: RectTarget;
  attack: CircleTarget;
  special: CircleTarget;
  ultimate: CircleTarget;
  jump: CircleTarget;
  defend: CircleTarget;
  joystickRegion: RectTarget;
  joystickAvailable: boolean;
};

const ACTION_TARGETS = ['attack', 'jump', 'defend', 'ultimate', 'special'] as const;

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

  let nearestAction: typeof ACTION_TARGETS[number] | null = null;
  let nearestNormalizedDistance = Number.POSITIVE_INFINITY;
  for (const action of ACTION_TARGETS) {
    const target = geometry[action];
    if (!containsCircle(point, target)) continue;
    const normalizedDistance = Math.hypot(point.x - target.x, point.y - target.y) / target.radius;
    if (normalizedDistance < nearestNormalizedDistance) {
      nearestAction = action;
      nearestNormalizedDistance = normalizedDistance;
    }
  }

  if (nearestAction) {
    return nearestAction;
  }
  if (containsRect(point, geometry.joystickRegion) && geometry.joystickAvailable) {
    return 'joystick';
  }
  return 'none';
}
