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
  // Old chroma-keyed exports contain a few isolated coloured pixels. Keep
  // every meaningful silhouette part (body, axe and cape) while dropping
  // detached specks, which avoids visible single-pixel artefacts in motion.
  const width = right - left;
  const height = bottom - top;
  const visited = new Uint8Array(width * height);
  const retained = new Uint8Array(width * height);
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
      if (component.length < 6) continue;
      for (const [x, y] of component) retained[y * width + x] = 1;
    }
  }
  const pixels = rawPixels.filter((pixel) => retained[pixel.y * width + pixel.x]);
  for (const pixel of pixels) {
    minX = Math.min(minX, pixel.x);
    minY = Math.min(minY, pixel.y);
    maxX = Math.max(maxX, pixel.x);
    maxY = Math.max(maxY, pixel.y);
  }
  return { pixels, minX, minY, maxX, maxY };
}

const cells = Array.from({ length: rows * columns }, (_, frameIndex) => (
  extractCell(frameIndex % columns, Math.floor(frameIndex / columns))
));
const loopCells = cells.slice(0, 8);
const loopWidth = Math.max(...loopCells.map((cell) => cell.maxX - cell.minX + 1));
const loopHeight = Math.max(...loopCells.map((cell) => cell.maxY - cell.minY + 1));
const loopScale = Math.min(1, 118 / loopWidth, 116 / loopHeight);

for (const [frameIndex, cell] of cells.entries()) {
  const width = cell.maxX - cell.minX + 1;
  const height = cell.maxY - cell.minY + 1;
  const scale = frameIndex < 8 ? loopScale : Math.min(1, 118 / width, 116 / height);
  const destinationWidth = width * scale;
  const left = (frameSize - destinationWidth) / 2;
  const top = Math.min(groundLine - height * scale, frameSize - height * scale - 3);
  const cellX = (frameIndex % columns) * frameSize;
  const cellY = Math.floor(frameIndex / columns) * frameSize;

  for (const pixel of cell.pixels) {
    const x = Math.round(cellX + left + (pixel.x - cell.minX) * scale);
    const y = Math.round(cellY + top + (pixel.y - cell.minY) * scale);
    if (x < cellX || y < cellY || x >= cellX + frameSize || y >= cellY + frameSize) continue;
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
