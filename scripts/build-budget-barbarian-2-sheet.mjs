import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'art-source', 'concepts', 'budget-barbarian-2', 'budget_barbarian_2_generated_reference.png');
const outputPath = path.join(projectRoot, 'public', 'assets', 'characters', 'budget-barbarian', 'budget_barbarian_2_spritesheet_160.png');
const columns = 4;
const rows = 7;
const frameSize = 160;
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const output = new PNG({ width: columns * frameSize, height: rows * frameSize });

function sourcePixel(x, y) {
  const index = (y * source.width + x) * 4;
  return [source.data[index], source.data[index + 1], source.data[index + 2], source.data[index + 3]];
}

function setOutputPixel(x, y, rgba) {
  const index = (y * output.width + x) * 4;
  output.data[index] = rgba[0];
  output.data[index + 1] = rgba[1];
  output.data[index + 2] = rgba[2];
  output.data[index + 3] = rgba[3];
}

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function isBackgroundCandidate(x, y, left, top, width, height) {
  const rgba = sourcePixel(left + x, top + y);
  const [r, g, b, a] = rgba;
  if (a < 32) return true;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const chroma = maximum - minimum;
  if (chroma > 126 && maximum > 135) return false;

  // The reference background is a soft studio gradient. Its local color changes
  // are small, while an inked contour has a strong change to at least one of its
  // neighbours. Flooding only this low-detail edge-connected region preserves
  // the character and turns the generated reference into a real alpha sheet.
  const neighbours = [
    [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
  ].filter(([sampleX, sampleY]) => sampleX >= 0 && sampleY >= 0 && sampleX < width && sampleY < height);
  const maximumNeighbourDistance = Math.max(
    ...neighbours.map(([sampleX, sampleY]) => colorDistance(rgba, sourcePixel(left + sampleX, top + sampleY))),
  );
  return maximumNeighbourDistance < 76;
}

function extractCell(column, row) {
  const left = Math.round(column * source.width / columns);
  const right = Math.round((column + 1) * source.width / columns);
  const top = Math.round(row * source.height / rows);
  const bottom = Math.round((row + 1) * source.height / rows);
  const width = right - left;
  const height = bottom - top;
  const transparent = new Uint8Array(width * height);
  const queue = [];

  const pushIfBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (transparent[index]) return;
    if (!isBackgroundCandidate(x, y, left, top, width, height)) return;
    transparent[index] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    pushIfBackground(x - 1, y);
    pushIfBackground(x + 1, y);
    pushIfBackground(x, y - 1);
    pushIfBackground(x, y + 1);
  }

  const pixels = [];
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (transparent[y * width + x]) continue;
      const rgba = sourcePixel(left + x, top + y);
      if (rgba[3] < 32) continue;
      pixels.push({ x, y, rgba });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { pixels, minX, minY, maxX, maxY };
}

const cellsByFrame = new Map();
for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const frameIndex = row * columns + column;
    if (frameIndex !== 23 && frameIndex !== 27) {
      cellsByFrame.set(frameIndex, extractCell(column, row));
    }
  }
}

// A compact two-step loop deliberately prioritizes a stable body silhouette
// over the generated reference's exaggerated camera-scale changes.
const walkSourceFrameIndexes = [4, 6, 4, 6];
const loopFrames = [0, 1, 2, 3, ...walkSourceFrameIndexes].map((frameIndex) => cellsByFrame.get(frameIndex));
const loopMaxWidth = Math.max(...loopFrames.map((cell) => cell.maxX - cell.minX + 1));
const loopMaxHeight = Math.max(...loopFrames.map((cell) => cell.maxY - cell.minY + 1));
const loopScale = Math.min(140 / loopMaxWidth, 142 / loopMaxHeight);

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const frameIndex = row * columns + column;
    // The reference has intentionally empty cells at 23 and 27.
    if (frameIndex === 23 || frameIndex === 27) continue;
    const sourceFrameIndex = frameIndex >= 4 && frameIndex < 8
      ? walkSourceFrameIndexes[frameIndex - 4]
      : frameIndex;
    const cell = cellsByFrame.get(sourceFrameIndex);
    if (cell.maxX < cell.minX || cell.maxY < cell.minY) continue;

    const sourceWidth = cell.maxX - cell.minX + 1;
    const sourceHeight = cell.maxY - cell.minY + 1;
    const scale = frameIndex < 8 ? loopScale : Math.min(148 / sourceWidth, 146 / sourceHeight);
    const destinationWidth = sourceWidth * scale;
    const destinationHeight = sourceHeight * scale;
    const destinationLeft = (frameSize - destinationWidth) / 2;
    const destinationTop = Math.min(151 - destinationHeight, frameSize - destinationHeight - 4);

    for (const pixel of cell.pixels) {
      const x = Math.round(destinationLeft + (pixel.x - cell.minX) * scale);
      const y = Math.round(destinationTop + (pixel.y - cell.minY) * scale);
      if (x < 0 || y < 0 || x >= frameSize || y >= frameSize) continue;
      setOutputPixel(column * frameSize + x, row * frameSize + y, pixel.rgba);
    }
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, PNG.sync.write(output));
console.log(`Built ${path.relative(projectRoot, outputPath)} from generated Barbarian 2.0 reference.`);
