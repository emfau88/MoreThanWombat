import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { projectRoot } from './character-sheet-tools.mjs';

const sourceDirectory = path.join(
  projectRoot,
  'public',
  'assets',
  'characters',
  'discount-wizard',
  'source',
);
const outputRelativePath = 'public/assets/characters/discount-wizard/discount_wizard_spritesheet_v2_128.png';
const outputPath = path.join(projectRoot, ...outputRelativePath.split('/'));
const frameSize = 128;
const targetGroundLine = 119;
const targetStandingHeight = 106;

const rowDefinitions = [
  { id: 'idle', file: 'discount_wizard_idle_v2_raw.png', scaleFrames: [0, 1, 2, 3] },
  { id: 'walk', file: 'discount_wizard_walk_v2_raw.png', scaleFrames: [0, 1, 2, 3] },
  { id: 'attack', file: 'discount_wizard_attack_v2_raw.png', scaleFrames: [0, 1, 2, 3] },
  { id: 'miscast', file: 'discount_wizard_miscast_v2_raw.png', scaleFrames: [0, 1, 2, 3] },
  { id: 'damage', file: 'discount_wizard_damage_v2_raw.png', scaleFrames: [0, 1], lyingFrames: [2, 3] },
];

const output = new PNG({ width: frameSize * 4, height: frameSize * rowDefinitions.length });
const report = {
  generatedAt: new Date().toISOString(),
  output: outputRelativePath,
  frameSize,
  targetGroundLine,
  targetStandingHeight,
  rows: [],
};

for (const [rowIndex, rowDefinition] of rowDefinitions.entries()) {
  const rawPath = path.join(sourceDirectory, rowDefinition.file);
  const raw = PNG.sync.read(fs.readFileSync(rawPath));
  const frameRanges = findFrameRanges(raw, rowDefinition.id);
  const frames = frameRanges.map((range) => extractFrame(raw, range));
  const referenceHeights = rowDefinition.scaleFrames.map((frameIndex) => frames[frameIndex].bbox.height);
  const rowScale = targetStandingHeight / median(referenceHeights);
  const frameReports = [];

  for (const [frameIndex, frame] of frames.entries()) {
    const lying = rowDefinition.lyingFrames?.includes(frameIndex) ?? false;
    const placement = placeFrame(output, frame, {
      cellX: frameIndex * frameSize,
      cellY: rowIndex * frameSize,
      scale: rowScale,
      lying,
    });
    frameReports.push({
      frameIndex: rowIndex * 4 + frameIndex,
      sourceBbox: frame.bbox,
      rootX: round(frame.rootX),
      placement,
    });
  }

  report.rows.push({
    id: rowDefinition.id,
    source: path.relative(projectRoot, rawPath).replaceAll('\\', '/'),
    sourceDimensions: `${raw.width}x${raw.height}`,
    frameRanges,
    rowScale: round(rowScale),
    frames: frameReports,
  });
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, PNG.sync.write(output, { colorType: 6 }));

const reportPath = path.join(projectRoot, 'docs', 'qa', 'discount-wizard-build-latest.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log('Built Discount Wizard v2 sheet from five reviewed source rows.');
console.log(`Sheet: ${path.relative(projectRoot, outputPath)}`);
console.log(`Report: ${path.relative(projectRoot, reportPath)}`);

function extractFrame(raw, range) {
  const segmentStartX = range.startX;
  const segmentEndX = range.endX;
  const segmentWidth = segmentEndX - segmentStartX;
  const cutout = new PNG({ width: segmentWidth, height: raw.height });
  const background = findConnectedBackground(raw, segmentStartX, segmentEndX);

  for (let y = 0; y < raw.height; y += 1) {
    for (let x = 0; x < segmentWidth; x += 1) {
      const sourceX = segmentStartX + x;
      const sourceIndex = (y * raw.width + sourceX) * 4;
      const destinationIndex = (y * segmentWidth + x) * 4;
      if (background.has(`${sourceX}:${y}`)) {
        continue;
      }
      cutout.data[destinationIndex] = raw.data[sourceIndex];
      cutout.data[destinationIndex + 1] = raw.data[sourceIndex + 1];
      cutout.data[destinationIndex + 2] = raw.data[sourceIndex + 2];
      cutout.data[destinationIndex + 3] = raw.data[sourceIndex + 3];
    }
  }

  const bbox = measureOpaqueBounds(cutout);
  return {
    cutout,
    bbox,
    rootX: findBodyRootX(cutout, bbox),
  };
}

function findFrameRanges(raw, rowId) {
  const background = findConnectedBackground(raw, 0, raw.width);
  const foregroundCounts = new Array(raw.width).fill(0);
  for (let x = 0; x < raw.width; x += 1) {
    for (let y = 0; y < raw.height; y += 1) {
      if (!background.has(`${x}:${y}`)) {
        foregroundCounts[x] += 1;
      }
    }
  }

  const occupiedIndexes = foregroundCounts
    .map((count, index) => (count > 0 ? index : -1))
    .filter((index) => index >= 0);
  if (occupiedIndexes.length === 0) {
    throw new Error(`${rowId}: generated row contains no foreground pixels.`);
  }

  // Image-generation output may leave a few antialiased pixels in an otherwise
  // empty separator. Find the lowest-density vertical band near each expected
  // quarter instead of requiring a perfectly empty column.
  const bandRadius = 3;
  const separators = [1, 2, 3].map((quarter) => {
    const expected = (raw.width * quarter) / 4;
    const searchRadius = raw.width / 8;
    const minimumX = Math.max(bandRadius, Math.floor(expected - searchRadius));
    const maximumX = Math.min(raw.width - bandRadius - 1, Math.ceil(expected + searchRadius));
    let best = null;
    for (let x = minimumX; x <= maximumX; x += 1) {
      let density = 0;
      for (let offset = -bandRadius; offset <= bandRadius; offset += 1) {
        density += foregroundCounts[x + offset];
      }
      const candidate = { x, density, distance: Math.abs(x - expected) };
      if (
        best === null
        || candidate.density < best.density
        || (candidate.density === best.density && candidate.distance < best.distance)
      ) {
        best = candidate;
      }
    }
    if (best === null) {
      throw new Error(`${rowId}: unable to locate separator ${quarter}.`);
    }
    return best.x;
  });

  if (!(separators[0] < separators[1] && separators[1] < separators[2])) {
    throw new Error(`${rowId}: invalid separator order ${JSON.stringify(separators)}.`);
  }
  const boundaries = [0, ...separators, raw.width];
  return Array.from({ length: 4 }, (_, index) => ({
    startX: boundaries[index],
    endX: boundaries[index + 1],
  }));
}

function findConnectedBackground(raw, minimumX, maximumX) {
  const queue = [];
  const background = new Set();
  for (let x = minimumX; x < maximumX; x += 1) {
    queue.push({ x, y: 0 }, { x, y: raw.height - 1 });
  }
  for (let y = 0; y < raw.height; y += 1) {
    queue.push({ x: minimumX, y }, { x: maximumX - 1, y });
  }

  while (queue.length > 0) {
    const pixel = queue.pop();
    const key = `${pixel.x}:${pixel.y}`;
    if (
      background.has(key)
      || pixel.x < minimumX
      || pixel.x >= maximumX
      || pixel.y < 0
      || pixel.y >= raw.height
      || !isBackgroundPixel(raw, pixel.x, pixel.y)
    ) {
      continue;
    }
    background.add(key);
    queue.push(
      { x: pixel.x - 1, y: pixel.y },
      { x: pixel.x + 1, y: pixel.y },
      { x: pixel.x, y: pixel.y - 1 },
      { x: pixel.x, y: pixel.y + 1 },
    );
  }
  return background;
}

function isBackgroundPixel(png, x, y) {
  const index = (y * png.width + x) * 4;
  const red = png.data[index];
  const green = png.data[index + 1];
  const blue = png.data[index + 2];
  const minimum = Math.min(red, green, blue);
  const maximum = Math.max(red, green, blue);
  return png.data[index + 3] <= 8 || (minimum >= 205 && maximum - minimum <= 16);
}

function measureOpaqueBounds(png) {
  let minimumX = png.width;
  let minimumY = png.height;
  let maximumX = -1;
  let maximumY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      if (alpha <= 8) continue;
      minimumX = Math.min(minimumX, x);
      minimumY = Math.min(minimumY, y);
      maximumX = Math.max(maximumX, x);
      maximumY = Math.max(maximumY, y);
    }
  }
  if (maximumX < 0) {
    throw new Error('Generated source segment contains no foreground pixels.');
  }
  return {
    minX: minimumX,
    minY: minimumY,
    maxX: maximumX,
    maxY: maximumY,
    width: maximumX - minimumX + 1,
    height: maximumY - minimumY + 1,
  };
}

function findBodyRootX(png, bbox) {
  const verticalMinimum = bbox.minY + bbox.height * 0.18;
  const verticalMaximum = bbox.minY + bbox.height * 0.86;
  const horizontalMinimum = bbox.minX + bbox.width * 0.08;
  const horizontalMaximum = bbox.minX + bbox.width * 0.78;
  let weightedX = 0;
  let weight = 0;
  for (let y = Math.floor(verticalMinimum); y <= Math.ceil(verticalMaximum); y += 1) {
    for (let x = Math.floor(horizontalMinimum); x <= Math.ceil(horizontalMaximum); x += 1) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      weightedX += x * alpha;
      weight += alpha;
    }
  }
  return weight > 0 ? weightedX / weight : (bbox.minX + bbox.maxX) / 2;
}

function placeFrame(destination, frame, options) {
  const { bbox, cutout } = frame;
  const scaledWidth = bbox.width * options.scale;
  const scaledHeight = bbox.height * options.scale;
  const rootWithinBox = (frame.rootX - bbox.minX) * options.scale;
  let destinationX = options.lying
    ? (frameSize - scaledWidth) / 2
    : frameSize / 2 - rootWithinBox;
  let destinationY = targetGroundLine - scaledHeight;
  destinationX = clamp(destinationX, 4, frameSize - 4 - scaledWidth);
  destinationY = Math.max(4, destinationY);

  for (let targetY = Math.floor(destinationY); targetY <= Math.ceil(destinationY + scaledHeight); targetY += 1) {
    for (let targetX = Math.floor(destinationX); targetX <= Math.ceil(destinationX + scaledWidth); targetX += 1) {
      if (targetX < 0 || targetY < 0 || targetX >= frameSize || targetY >= frameSize) continue;
      const sourceX = bbox.minX + (targetX - destinationX) / options.scale;
      const sourceY = bbox.minY + (targetY - destinationY) / options.scale;
      const sample = sampleBilinear(cutout, sourceX, sourceY);
      const destinationIndex = (
        (options.cellY + targetY) * destination.width + options.cellX + targetX
      ) * 4;
      destination.data[destinationIndex] = sample[0];
      destination.data[destinationIndex + 1] = sample[1];
      destination.data[destinationIndex + 2] = sample[2];
      destination.data[destinationIndex + 3] = sample[3];
    }
  }

  return {
    x: round(destinationX),
    y: round(destinationY),
    width: round(scaledWidth),
    height: round(scaledHeight),
  };
}

function sampleBilinear(png, x, y) {
  const left = clamp(Math.floor(x), 0, png.width - 1);
  const top = clamp(Math.floor(y), 0, png.height - 1);
  const right = clamp(left + 1, 0, png.width - 1);
  const bottom = clamp(top + 1, 0, png.height - 1);
  const xWeight = x - Math.floor(x);
  const yWeight = y - Math.floor(y);
  const samples = [
    { x: left, y: top, weight: (1 - xWeight) * (1 - yWeight) },
    { x: right, y: top, weight: xWeight * (1 - yWeight) },
    { x: left, y: bottom, weight: (1 - xWeight) * yWeight },
    { x: right, y: bottom, weight: xWeight * yWeight },
  ];
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const sample of samples) {
    const index = (sample.y * png.width + sample.x) * 4;
    const sampleAlpha = png.data[index + 3] / 255;
    const premultipliedWeight = sample.weight * sampleAlpha;
    alpha += premultipliedWeight;
    red += png.data[index] * premultipliedWeight;
    green += png.data[index + 1] * premultipliedWeight;
    blue += png.data[index + 2] * premultipliedWeight;
  }
  if (alpha <= 0) return [0, 0, 0, 0];
  return [
    Math.round(red / alpha),
    Math.round(green / alpha),
    Math.round(blue / alpha),
    Math.round(alpha * 255),
  ];
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}
