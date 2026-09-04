import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
// v3 is the reviewed production source for the replacement animation sheet.
// Keep this input unmodified; this builder owns cropping, alpha extraction and
// shared-scale placement in the runtime atlas.
const sourcePath = path.join(projectRoot, 'art-source', 'concepts', 'mara', 'mara_breach_animation_source_v3.png');
const outputPath = path.join(projectRoot, 'public', 'assets', 'characters', 'mara', 'mara_breach_spritesheet_160.png');
const columns = 4;
const rows = 7;
// Runtime fighters use the same 128px atlas contract as Wombat and Wizard.
// Downsampling once during the asset build gives them a shared readable pixel
// density and avoids magnifying the source's high-resolution brush detail.
const frameSize = 128;
const groundLine = 119;
const rootX = 64;
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const output = new PNG({ width: columns * frameSize, height: rows * frameSize });

function getSourcePixel(image, x, y) {
  const index = (y * image.width + x) * 4;
  return [image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]];
}

function setOutputPixel(x, y, rgba) {
  if (x < 0 || y < 0 || x >= output.width || y >= output.height) return;
  const index = (y * output.width + x) * 4;
  if (rgba[3] < output.data[index + 3]) return;
  output.data[index] = rgba[0];
  output.data[index + 1] = rgba[1];
  output.data[index + 2] = rgba[2];
  output.data[index + 3] = rgba[3];
}

function isGeneratedGridBackground(rgba) {
  const [red, green, blue, alpha] = rgba;
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  // The image generator rendered its transparency preview as an opaque neutral
  // checkerboard. It is safely removable from the frame edges; warm skin and
  // yellow costume highlights retain chroma and are therefore preserved.
  // The generator exports a white display matte around some contours. Flood
  // every neutral near-white exterior pixel, not merely pure white, so that
  // it cannot survive as a bright halo after the character is composited in
  // Phaser. Saturated costume and skin highlights remain foreground.
  // Only remove the light checker cells at the exterior. Treating dark neutral
  // tones as a key also cuts holes into Mara's charcoal jacket and boots.
  return alpha > 8 && brightest >= 165 && brightest - darkest <= 32;
}

function isOpaqueWhiteMatte(rgba) {
  const [red, green, blue, alpha] = rgba;
  return alpha > 8 && red >= 205 && green >= 205 && blue >= 205
    && Math.max(red, green, blue) - Math.min(red, green, blue) <= 44;
}

function extractCell(column, row, image = source, imageColumns = columns, imageRows = rows) {
  const left = Math.floor(column * image.width / imageColumns);
  const right = Math.floor((column + 1) * image.width / imageColumns);
  const top = Math.floor(row * image.height / imageRows);
  const bottom = Math.floor((row + 1) * image.height / imageRows);
  const width = right - left;
  const height = bottom - top;
  const background = new Uint8Array(width * height);
  const queue = [];
  const enqueueBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (background[index] || !isGeneratedGridBackground(getSourcePixel(image, left + x, top + y))) return;
    background[index] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    enqueueBackground(x, 0);
    enqueueBackground(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueueBackground(0, y);
    enqueueBackground(width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    enqueueBackground(x - 1, y);
    enqueueBackground(x + 1, y);
    enqueueBackground(x, y - 1);
    enqueueBackground(x, y + 1);
    enqueueBackground(x - 1, y - 1);
    enqueueBackground(x + 1, y - 1);
    enqueueBackground(x - 1, y + 1);
    enqueueBackground(x + 1, y + 1);
  }

  const foreground = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgba = getSourcePixel(image, left + x, top + y);
      if (rgba[3] > 8 && !background[y * width + x] && !isOpaqueWhiteMatte(rgba)) {
        foreground[y * width + x] = 1;
      }
    }
  }
  // Generator grids can let a toe or boot overlap into the adjacent row. Keep
  // the main connected silhouette in each declared cell and reject detached
  // fragments before alignment; this is a source-cleaning step, not a runtime
  // offset hack.
  const visited = new Uint8Array(width * height);
  let largestComponent = [];
  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX;
      if (!foreground[startIndex] || visited[startIndex]) continue;
      const component = [];
      const componentQueue = [[startX, startY]];
      visited[startIndex] = 1;
      for (let cursor = 0; cursor < componentQueue.length; cursor += 1) {
        const [x, y] = componentQueue[cursor];
        component.push([x, y]);
        for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
          const nextIndex = nextY * width + nextX;
          if (!foreground[nextIndex] || visited[nextIndex]) continue;
          visited[nextIndex] = 1;
          componentQueue.push([nextX, nextY]);
        }
      }
      if (component.length > largestComponent.length) largestComponent = component;
    }
  }

  const pixels = [];
  let minX = right - left;
  let minY = bottom - top;
  let maxX = -1;
  let maxY = -1;

  for (const [localX, localY] of largestComponent) {
    const rgba = getSourcePixel(image, left + localX, top + localY);
    pixels.push({ x: localX, y: localY, rgba });
    minX = Math.min(minX, localX);
    minY = Math.min(minY, localY);
    maxX = Math.max(maxX, localX);
    maxY = Math.max(maxY, localY);
  }

  if (pixels.length === 0) {
    throw new Error(`Mara source cell ${row},${column} is empty.`);
  }

  const torsoTop = minY + (maxY - minY) * 0.24;
  const torsoBottom = minY + (maxY - minY) * 0.62;
  const torsoPixels = pixels.filter((pixel) => pixel.y >= torsoTop && pixel.y <= torsoBottom);
  const weightedRoot = torsoPixels.reduce((sum, pixel) => sum + pixel.x * pixel.rgba[3], 0)
    / torsoPixels.reduce((sum, pixel) => sum + pixel.rgba[3], 0);

  return {
    pixels,
    minX,
    minY,
    maxX,
    maxY,
    rootX: Number.isFinite(weightedRoot) ? weightedRoot : (minX + maxX) / 2,
  };
}

const baseCells = [];
for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    baseCells.push(extractCell(column, row));
  }
}
const cells = baseCells;

// One shared scale across the whole body sheet prevents scale pops when
// transitioning between idle, movement, kicks, hit reactions and landings.
const maxWidth = Math.max(...baseCells.map((cell) => cell.maxX - cell.minX + 1));
const maxHeight = Math.max(...baseCells.map((cell) => cell.maxY - cell.minY + 1));
const scale = Math.min(1, 118 / maxWidth, 116 / maxHeight);
const airborneFrameOffsets = new Map([
  [20, -14], // jump
  [21, -9], // fall
  [22, -12], // air kick
  [25, -6], // spinning knee in the ultimate
]);

for (let frameIndex = 0; frameIndex < cells.length; frameIndex += 1) {
  const cell = cells[frameIndex];
  const cellScale = scale;
  const frameColumn = frameIndex % columns;
  const frameRow = Math.floor(frameIndex / columns);
  const offsetY = airborneFrameOffsets.get(frameIndex) ?? 0;
  // A stretched kick can reach much farther to one side than its torso. Keep
  // the complete pose inside its own atlas cell: otherwise an overhanging boot
  // is drawn into the next frame and flashes beside Mara on the return frame.
  const relativeLeft = (cell.minX - cell.rootX) * cellScale;
  const relativeRight = (cell.maxX - cell.rootX) * cellScale;
  const cellInset = 3;
  const minimumRootX = cellInset - relativeLeft;
  const maximumRootX = frameSize - cellInset - relativeRight;
  const anchoredRootX = Math.max(minimumRootX, Math.min(rootX, maximumRootX));
  const destinationRootX = frameColumn * frameSize + anchoredRootX;
  const destinationFootY = frameRow * frameSize + groundLine + offsetY;

  for (const pixel of cell.pixels) {
    const x = Math.round(destinationRootX + (pixel.x - cell.rootX) * cellScale);
    const y = Math.round(destinationFootY + (pixel.y - cell.maxY) * cellScale);
    // Atlas frames must never write into a neighbour. This is deliberately
    // checked before the global write so a long kick cannot pollute the guard
    // frame that follows it.
    if (x < frameColumn * frameSize + cellInset || x >= (frameColumn + 1) * frameSize - cellInset) continue;
    if (y < frameRow * frameSize + cellInset || y >= (frameRow + 1) * frameSize - cellInset) continue;
    setOutputPixel(x, y, pixel.rgba);
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));
console.log(`Built ${path.relative(projectRoot, outputPath)} from Mara's original animation source.`);
