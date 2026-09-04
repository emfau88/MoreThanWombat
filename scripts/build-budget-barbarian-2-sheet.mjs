import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
// v2 is the original production source for the replacement animation sheet.
// Keep this input unmodified; this builder owns alpha extraction and placement
// in the runtime atlas.
const sourcePath = path.join(projectRoot, 'art-source', 'concepts', 'budget-barbarian-2', 'budget_barbarian_2_generated_reference_v2.png');
const outputPath = path.join(projectRoot, 'public', 'assets', 'characters', 'budget-barbarian', 'budget_barbarian_2_spritesheet_160.png');
const columns = 4;
const rows = 7;
// Match the source cells (948 / 4 = 237, 1659 / 7 = 237). Do not shrink the
// artwork before Phaser receives it: that would blur the pixel rendering.
const frameSize = 237;
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

function isOpaqueWhiteMatte(rgba) {
  const [red, green, blue, alpha] = rgba;
  return alpha > 8 && red >= 240 && green >= 240 && blue >= 240;
}

function isBackgroundCandidate(x, y, left, top, width, height) {
  const rgba = sourcePixel(left + x, top + y);
  const [r, g, b, a] = rgba;
  if (a < 32) return true;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const chroma = maximum - minimum;
  // Clear the neutral display matte that surrounds generated sprite edges.
  // Only edge-connected pixels are flooded, preserving internal light metal
  // details while removing the white outline visible in-game.
  if (maximum >= 165 && chroma <= 32) return true;
  // This source uses an opaque white display matte, not a gradient. Do not
  // infer a background from low-detail/dark pixels: the previous heuristic
  // incorrectly removed the Barbarian's charcoal trousers and boots.
  return false;
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
    pushIfBackground(x - 1, y - 1);
    pushIfBackground(x + 1, y - 1);
    pushIfBackground(x - 1, y + 1);
    pushIfBackground(x + 1, y + 1);
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
      if (isOpaqueWhiteMatte(rgba)) continue;
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

// The authored four-frame cycle has real opposing weight shifts. Preserve all
// four poses rather than repeating two frames, which was the source of the
// previous stuttering walk.
const walkSourceFrameIndexes = [4, 5, 6, 7];
const loopFrames = [0, 1, 2, 3, ...walkSourceFrameIndexes].map((frameIndex) => cellsByFrame.get(frameIndex));
const loopMaxWidth = Math.max(...loopFrames.map((cell) => cell.maxX - cell.minX + 1));
const loopMaxHeight = Math.max(...loopFrames.map((cell) => cell.maxY - cell.minY + 1));
const loopScale = Math.min(1, 220 / loopMaxWidth, 222 / loopMaxHeight);

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
    const scale = frameIndex < 8
      ? loopScale
      : Math.min(1, 225 / sourceWidth, 223 / sourceHeight);
    const destinationWidth = sourceWidth * scale;
    const destinationHeight = sourceHeight * scale;
    const destinationLeft = (frameSize - destinationWidth) / 2;
    const destinationTop = Math.min(229 - destinationHeight, frameSize - destinationHeight - 4);

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
