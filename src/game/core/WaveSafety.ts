import type { FighterBounds } from '../combat/Fighter';

export type WavePoint = { x: number; y: number };
export type WaveView = { x: number; y: number; right: number; bottom: number };

export function isWaveActorVisible(point: WavePoint, view: WaveView): boolean {
  return point.x >= view.x + 48 && point.x <= view.right - 48
    && point.y >= view.y + 96 && point.y <= view.bottom - 24;
}

/** Complete bounded search; failure stays explicit instead of spawning inside the player. */
export function findSafeWaveSpawn(
  desired: WavePoint, bounds: FighterBounds, view: WaveView,
  occupied: readonly WavePoint[], minimumDistance = 112,
): WavePoint | null {
  const candidates: WavePoint[] = [desired];
  for (let x = bounds.minX; x <= bounds.maxX; x += 24) {
    for (let y = bounds.minY; y <= bounds.maxY; y += 24) candidates.push({ x, y });
  }
  candidates.sort((a, b) => Math.hypot(a.x - desired.x, a.y - desired.y)
    - Math.hypot(b.x - desired.x, b.y - desired.y));
  return candidates.find((candidate) => candidate.x >= bounds.minX && candidate.x <= bounds.maxX
    && candidate.y >= bounds.minY && candidate.y <= bounds.maxY
    && isWaveActorVisible(candidate, view)
    && occupied.every((other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) >= minimumDistance)) ?? null;
}
