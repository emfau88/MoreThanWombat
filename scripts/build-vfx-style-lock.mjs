import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, process.argv[2] ?? 'config/vfx-style-lock.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sourceRoot = path.join(projectRoot, manifest.sourceRoot);
const runtimeRoot = path.join(projectRoot, manifest.runtimeRoot);

fs.mkdirSync(runtimeRoot, { recursive: true });

for (const asset of manifest.assets) {
  const sourcePath = path.join(sourceRoot, asset.source);
  const outputPath = path.join(runtimeRoot, asset.output);
  const source = PNG.sync.read(fs.readFileSync(sourcePath));
  const bounds = measureAlphaBounds(source, 4);
  if (!bounds) {
    throw new Error(`${asset.id}: source has no visible alpha pixels`);
  }

  const output = new PNG({ width: asset.canvasWidth, height: asset.canvasHeight });
  const sourceWidth = bounds.maxX - bounds.minX + 1;
  const sourceHeight = bounds.maxY - bounds.minY + 1;
  const scale = Math.min(asset.fitWidth / sourceWidth, asset.fitHeight / sourceHeight);
  const destinationWidth = sourceWidth * scale;
  const destinationHeight = sourceHeight * scale;
  const destinationX = (asset.canvasWidth - destinationWidth) / 2;
  const destinationY = asset.alignment === 'ground'
    ? asset.canvasHeight - 6 - destinationHeight
    : (asset.canvasHeight - destinationHeight) / 2;

  renderScaledCutout({
    source,
    output,
    bounds,
    scale,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  });
  fs.writeFileSync(outputPath, PNG.sync.write(output));
  console.log(`${asset.id}: ${source.width}x${source.height} -> ${output.width}x${output.height}`);
}

function measureAlphaBounds(png, threshold) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] <= threshold) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null;
}

function renderScaledCutout(options) {
  const {
    source,
    output,
    bounds,
    scale,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  } = options;
  const startX = Math.max(0, Math.floor(destinationX) - 1);
  const endX = Math.min(output.width - 1, Math.ceil(destinationX + destinationWidth) + 1);
  const startY = Math.max(0, Math.floor(destinationY) - 1);
  const endY = Math.min(output.height - 1, Math.ceil(destinationY + destinationHeight) + 1);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const sourceX = bounds.minX + (x - destinationX) / scale;
      const sourceY = bounds.minY + (y - destinationY) / scale;
      if (sourceX < bounds.minX || sourceX > bounds.maxX || sourceY < bounds.minY || sourceY > bounds.maxY) {
        continue;
      }
      const color = sampleBilinear(source, sourceX, sourceY);
      const outputIndex = (y * output.width + x) * 4;
      output.data[outputIndex] = color[0];
      output.data[outputIndex + 1] = color[1];
      output.data[outputIndex + 2] = color[2];
      output.data[outputIndex + 3] = color[3];
    }
  }
}

function sampleBilinear(png, x, y) {
  const left = clamp(Math.floor(x), 0, png.width - 1);
  const top = clamp(Math.floor(y), 0, png.height - 1);
  const right = clamp(left + 1, 0, png.width - 1);
  const bottom = clamp(top + 1, 0, png.height - 1);
  const tx = x - Math.floor(x);
  const ty = y - Math.floor(y);
  const samples = [
    { x: left, y: top, weight: (1 - tx) * (1 - ty) },
    { x: right, y: top, weight: tx * (1 - ty) },
    { x: left, y: bottom, weight: (1 - tx) * ty },
    { x: right, y: bottom, weight: tx * ty },
  ];
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const sample of samples) {
    const index = (sample.y * png.width + sample.x) * 4;
    const sampleAlpha = png.data[index + 3] / 255;
    const weightedAlpha = sample.weight * sampleAlpha;
    alpha += weightedAlpha;
    red += png.data[index] * weightedAlpha;
    green += png.data[index + 1] * weightedAlpha;
    blue += png.data[index + 2] * weightedAlpha;
  }
  if (alpha <= 0) {
    return [0, 0, 0, 0];
  }
  return [
    Math.round(red / alpha),
    Math.round(green / alpha),
    Math.round(blue / alpha),
    Math.round(alpha * 255),
  ];
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
