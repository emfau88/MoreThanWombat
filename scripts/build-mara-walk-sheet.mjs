import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, 'art-source', 'concepts', 'mara', 'mara_breach_walk_source_v2.png');
const outputPath = path.join(projectRoot, 'public', 'assets', 'characters', 'mara', 'mara_breach_walk_128.png');
const sourceColumns = 3;
const sourceRows = 2;
const frameSize = 128;
const groundLine = 119;
const rootX = 64;
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const output = new PNG({ width: sourceColumns * sourceRows * frameSize, height: frameSize });

function pixelAt(image, x, y) {
  const index = (y * image.width + x) * 4;
  return [image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]];
}

function isLightChecker(rgba) {
  const [red, green, blue, alpha] = rgba;
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  return alpha > 8 && brightest >= 165 && brightest - darkest <= 32;
}

function isWhiteMatte(rgba) {
  const [red, green, blue, alpha] = rgba;
  return alpha > 8 && red >= 205 && green >= 205 && blue >= 205
    && Math.max(red, green, blue) - Math.min(red, green, blue) <= 44;
}

function extractCell(column, row) {
  const left = Math.floor(column * source.width / sourceColumns);
  const right = Math.floor((column + 1) * source.width / sourceColumns);
  const top = Math.floor(row * source.height / sourceRows);
  const bottom = Math.floor((row + 1) * source.height / sourceRows);
  const width = right - left;
  const height = bottom - top;
  const background = new Uint8Array(width * height);
  const queue = [];
  const addBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (background[index] || !isLightChecker(pixelAt(source, left + x, top + y))) return;
    background[index] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < width; x += 1) {
    addBackground(x, 0);
    addBackground(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    addBackground(0, y);
    addBackground(width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const [x, y] = queue[cursor];
    for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]]) {
      addBackground(nextX, nextY);
    }
  }

  const foreground = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rgba = pixelAt(source, left + x, top + y);
      if (rgba[3] > 8 && !background[y * width + x] && !isWhiteMatte(rgba)) foreground[y * width + x] = 1;
    }
  }

  const visited = new Uint8Array(width * height);
  let largest = [];
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
      if (component.length > largest.length) largest = component;
    }
  }
  if (largest.length === 0) throw new Error(`Mara walk source cell ${row},${column} is empty.`);

  const pixels = largest.map(([x, y]) => ({ x, y, rgba: pixelAt(source, left + x, top + y) }));
  const minX = Math.min(...pixels.map((pixel) => pixel.x));
  const maxX = Math.max(...pixels.map((pixel) => pixel.x));
  const minY = Math.min(...pixels.map((pixel) => pixel.y));
  const maxY = Math.max(...pixels.map((pixel) => pixel.y));
  const torsoTop = minY + (maxY - minY) * 0.24;
  const torsoBottom = minY + (maxY - minY) * 0.62;
  const torsoPixels = pixels.filter((pixel) => pixel.y >= torsoTop && pixel.y <= torsoBottom);
  const torsoWeight = torsoPixels.reduce((sum, pixel) => sum + pixel.rgba[3], 0);
  const weightedRoot = torsoPixels.reduce((sum, pixel) => sum + pixel.x * pixel.rgba[3], 0) / torsoWeight;
  return { pixels, minX, maxX, minY, maxY, rootX: Number.isFinite(weightedRoot) ? weightedRoot : (minX + maxX) / 2 };
}

const cells = [];
for (let row = 0; row < sourceRows; row += 1) {
  for (let column = 0; column < sourceColumns; column += 1) cells.push(extractCell(column, row));
}
const maxWidth = Math.max(...cells.map((cell) => cell.maxX - cell.minX + 1));
const maxHeight = Math.max(...cells.map((cell) => cell.maxY - cell.minY + 1));
const scale = Math.min(1, 118 / maxWidth, 116 / maxHeight);

for (let frameIndex = 0; frameIndex < cells.length; frameIndex += 1) {
  const cell = cells[frameIndex];
  const relativeLeft = (cell.minX - cell.rootX) * scale;
  const relativeRight = (cell.maxX - cell.rootX) * scale;
  const inset = 3;
  const anchoredRootX = Math.max(inset - relativeLeft, Math.min(rootX, frameSize - inset - relativeRight));
  for (const pixel of cell.pixels) {
    const x = Math.round(frameIndex * frameSize + anchoredRootX + (pixel.x - cell.rootX) * scale);
    const y = Math.round(groundLine + (pixel.y - cell.maxY) * scale);
    if (x < frameIndex * frameSize + inset || x >= (frameIndex + 1) * frameSize - inset || y < inset || y >= frameSize - inset) continue;
    const index = (y * output.width + x) * 4;
    output.data[index] = pixel.rgba[0];
    output.data[index + 1] = pixel.rgba[1];
    output.data[index + 2] = pixel.rgba[2];
    output.data[index + 3] = pixel.rgba[3];
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));
console.log(`Built ${path.relative(projectRoot, outputPath)} from Mara's six-step walk source.`);
