import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
const sourcePath = path.join(
  projectRoot,
  'public',
  'assets',
  'characters',
  'budget-barbarian',
  'budget_barbarian_spritesheet_chroma.png',
);
const outputPath = path.join(
  projectRoot,
  'public',
  'assets',
  'characters',
  'budget-barbarian',
  'budget_barbarian_spritesheet_128_normalized.png',
);
const columns = 4;
const rows = 5;
const frameSize = 128;
const groundLine = 119;
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const output = new PNG({ width: columns * frameSize, height: rows * frameSize });

function sourcePixel(x, y) {
  const index = (y * source.width + x) * 4;
  return [source.data[index], source.data[index + 1], source.data[index + 2], source.data[index + 3]];
}

function isChromaBackground([red, green, blue, alpha]) {
  // The historical Barbarian source uses a pure green key. Green is not part
  // of the character palette, so keying it before scaling removes the former
  // neon fringe without touching the paper helmet, skin, axe or fur colours.
  return alpha <= 8 || (green >= 55 && green > red * 1.05 && green > blue * 1.05);
}

function extractCell(column, row) {
  const left = Math.floor(column * source.width / columns);
  const right = Math.floor((column + 1) * source.width / columns);
  const top = Math.floor(row * source.height / rows);
  const bottom = Math.floor((row + 1) * source.height / rows);
  const rawPixels = [];
  const occupied = new Uint8Array((right - left) * (bottom - top));
  let minX = right - left;
  let minY = bottom - top;
  let maxX = -1;
  let maxY = -1;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const rgba = sourcePixel(x, y);
      if (isChromaBackground(rgba)) continue;
      const localX = x - left;
      const localY = y - top;
      rawPixels.push({ x: localX, y: localY, rgba });
      occupied[localY * (right - left) + localX] = 1;
    }
  }

  if (rawPixels.length === 0) {
    throw new Error(`Budget Barbarian source cell ${row},${column} is empty.`);
  }
  // The old export stores ground sparkles as detached coloured components
  // below some attack poses. The axe, body and cape are one silhouette, so
  // retain only the largest connected component and never let those embedded
  // ground effects travel with the Barbarian during Air Bonk.
  const width = right - left;
  const height = bottom - top;
  const visited = new Uint8Array(width * height);
  let largestComponent = [];
  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX;
      if (!occupied[startIndex] || visited[startIndex]) continue;
      const component = [[startX, startY]];
      visited[startIndex] = 1;
      for (let cursor = 0; cursor < component.length; cursor += 1) {
        const [x, y] = component[cursor];
        for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
          const nextIndex = nextY * width + nextX;
          if (!occupied[nextIndex] || visited[nextIndex]) continue;
          visited[nextIndex] = 1;
          component.push([nextX, nextY]);
        }
      }
      if (component.length > largestComponent.length) largestComponent = component;
    }
  }
  const retained = new Uint8Array(width * height);
  for (const [x, y] of largestComponent) retained[y * width + x] = 1;
  const pixels = rawPixels.filter((pixel) => retained[pixel.y * width + pixel.x]);
  for (const pixel of pixels) {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  }
  // Anchor to the dense torso band rather than the full bounds. Wide axe
  // swings then keep the Barbarian's body in the same world position instead
  // of shifting him left merely because the weapon reaches farther right.
  const torsoTop = minY + (maxY - minY) * 0.24;
  const torsoBottom = minY + (maxY - minY) * 0.62;
  const torsoPixels = pixels.filter((pixel) => pixel.y >= torsoTop && pixel.y <= torsoBottom);
  const torsoWeight = torsoPixels.reduce((sum, pixel) => sum + pixel.rgba[3], 0);
  const weightedRootX = torsoPixels.reduce((sum, pixel) => sum + pixel.x * pixel.rgba[3], 0) / torsoWeight;

  return {
    pixels,
    minX,
    minY,
    maxX,
    maxY,
    rootX: Number.isFinite(weightedRootX) ? weightedRootX : (minX + maxX) / 2,
  };
}

const cells = Array.from({ length: rows * columns }, (_, frameIndex) => (
  extractCell(frameIndex % columns, Math.floor(frameIndex / columns))
));
// Source frame 2 is the one historical idle pose that omitted the axe. Keep
// the timing slot, but use the adjacent calm stance so every gameplay pose
// keeps the weapon visible.
cells[2] = cells[0];

// Mara's runtime atlas keeps a shared body scale across every state. Apply
// the same contract here: the long axe may approach a frame edge on a lunge,
// but it must never make Attack or Air Bonk inflate relative to Idle/Walk.
// At this scale the Barbarian's standing body matches the Pigeon's combat
// height after each fighter's authored display scale is applied.
const sharedScale = 0.5;
const rootX = 64;
const frameInset = 2;

for (const [frameIndex, cell] of cells.entries()) {
  const cellX = (frameIndex % columns) * frameSize;
  const cellY = Math.floor(frameIndex / columns) * frameSize;
  const relativeLeft = (cell.minX - cell.rootX) * sharedScale;
  const relativeRight = (cell.maxX - cell.rootX) * sharedScale;
  const minimumRootX = frameInset - relativeLeft;
  const maximumRootX = frameSize - frameInset - relativeRight;
  const anchoredRootX = minimumRootX <= maximumRootX
    ? Math.max(minimumRootX, Math.min(rootX, maximumRootX))
    : rootX;

  for (const pixel of cell.pixels) {
    const x = Math.round(cellX + anchoredRootX + (pixel.x - cell.rootX) * sharedScale);
    const y = Math.round(cellY + groundLine + (pixel.y - cell.maxY) * sharedScale);
    if (x < cellX + frameInset || y < cellY + frameInset || x >= cellX + frameSize - frameInset || y >= cellY + frameSize - frameInset) continue;
    const index = (y * output.width + x) * 4;
    if (pixel.rgba[3] < output.data[index + 3]) continue;
    output.data[index] = pixel.rgba[0];
    output.data[index + 1] = pixel.rgba[1];
    output.data[index + 2] = pixel.rgba[2];
    output.data[index + 3] = pixel.rgba[3];
  }
}

fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));
console.log(`Built ${path.relative(projectRoot, outputPath)} from the retro chroma source.`);
