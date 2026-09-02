export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function intersectsRect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function getRectOverlapCenter(a: Rect, b: Rect): { x: number; y: number } | null {
  if (!intersectsRect(a, b)) {
    return null;
  }

  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return {
    x: (left + right) * 0.5,
    y: (top + bottom) * 0.5,
  };
}
