import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readManifest() {
  const manifestPath = path.join(projectRoot, 'config', 'character-sheets.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

export function resolveProjectPath(relativePath) {
  return path.join(projectRoot, ...relativePath.split('/'));
}

export function readPng(relativePath) {
  return PNG.sync.read(fs.readFileSync(resolveProjectPath(relativePath)));
}

export function writePng(relativePath, png) {
  const outputPath = resolveProjectPath(relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, PNG.sync.write(png, { colorType: 6 }));
}

export function frameOrigin(sheet, frameIndex) {
  return {
    x: (frameIndex % sheet.columns) * sheet.frameWidth,
    y: Math.floor(frameIndex / sheet.columns) * sheet.frameHeight,
  };
}

export function measureFrame(png, sheet, frameIndex, alphaThreshold) {
  const origin = frameOrigin(sheet, frameIndex);
  const pixels = [];
  let minX = sheet.frameWidth;
  let minY = sheet.frameHeight;
  let maxX = -1;
  let maxY = -1;
  let edgePixelCount = 0;

  for (let y = 0; y < sheet.frameHeight; y += 1) {
    for (let x = 0; x < sheet.frameWidth; x += 1) {
      const sourceIndex = ((origin.y + y) * png.width + origin.x + x) * 4;
      const alpha = png.data[sourceIndex + 3];
      if (alpha <= alphaThreshold) {
        continue;
      }

      if (x === 0 || y === 0 || x === sheet.frameWidth - 1 || y === sheet.frameHeight - 1) {
        edgePixelCount += 1;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      pixels.push({
        x,
        y,
        alpha,
        red: png.data[sourceIndex],
        green: png.data[sourceIndex + 1],
        blue: png.data[sourceIndex + 2],
      });
    }
  }

  if (pixels.length === 0) {
    return {
      frameIndex,
      empty: true,
      edgePixelCount,
      bbox: null,
      footLine: null,
      rootAnchorX: null,
      coreCenterX: null,
      palette: new Array(24).fill(0),
    };
  }

  const bottomBandTop = maxY - Math.max(7, Math.round(sheet.frameHeight * 0.075));
  const footPixels = pixels.filter((pixel) => pixel.y >= bottomBandTop);
  const footAnchorX = weightedMedian(footPixels, 'x');
  const coreCenterX = findDenseCoreCenter(pixels, sheet.frameWidth, minY, maxY);
  const palette = hueHistogram(pixels);

  return {
    frameIndex,
    empty: false,
    edgePixelCount,
    bbox: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    },
    footLine: maxY,
    footAnchorX: round(footAnchorX),
    rootAnchorX: round(coreCenterX),
    coreCenterX: round(coreCenterX),
    palette,
  };
}

export function summarizeGroup(name, frames, thresholds) {
  const valid = frames.filter((frame) => !frame.empty);
  const footLineDriftPx = round(range(valid.map((frame) => frame.footLine)));
  const rootAnchorDriftPx = round(range(valid.map((frame) => frame.rootAnchorX)));
  const coreCenterDriftPx = round(range(valid.map((frame) => frame.coreCenterX)));
  const heights = valid.map((frame) => frame.bbox.height);
  const medianHeight = median(heights);
  const heightDeltaPercent = medianHeight > 0 ? (range(heights) / medianHeight) * 100 : 0;
  const paletteDistance = maxPairwisePaletteDistance(valid.map((frame) => frame.palette));
  const edgePixelCount = valid.reduce((sum, frame) => sum + frame.edgePixelCount, 0);
  const hardFailures = [];
  const warnings = [];

  if (footLineDriftPx > thresholds.footLineDriftPx) {
    hardFailures.push(`foot line drift ${footLineDriftPx}px > ${thresholds.footLineDriftPx}px`);
  }
  if (rootAnchorDriftPx > thresholds.rootAnchorDriftPx) {
    hardFailures.push(`root anchor drift ${rootAnchorDriftPx}px > ${thresholds.rootAnchorDriftPx}px`);
  }
  if (edgePixelCount > 0) {
    hardFailures.push(`${edgePixelCount} visible edge pixels`);
  }
  if (heightDeltaPercent > thresholds.heightDeltaPercentWarning) {
    warnings.push(`height delta ${round(heightDeltaPercent)}% > ${thresholds.heightDeltaPercentWarning}%`);
  }
  if (paletteDistance > thresholds.paletteDistanceWarning) {
    warnings.push(`palette distance ${round(paletteDistance)} > ${thresholds.paletteDistanceWarning}`);
  }
  if (valid.length !== frames.length) {
    hardFailures.push(`${frames.length - valid.length} empty frames`);
  }

  return {
    name,
    footLineDriftPx,
    rootAnchorDriftPx,
    coreCenterDriftPx,
    heightDeltaPercent: round(heightDeltaPercent),
    paletteDistance: round(paletteDistance),
    edgePixelCount,
    hardFailures,
    warnings,
    passed: hardFailures.length === 0,
  };
}

export function normalizeLoopFrames(source, sheet, alphaThreshold) {
  const working = new PNG({ width: source.width, height: source.height });
  source.data.copy(working.data);
  const frameIndexes = [...new Set(
    sheet.normalizeGroups.flatMap((groupName) => sheet.groups[groupName] ?? []),
  )];
  const sourceMeasures = frameIndexes.map((frameIndex) => measureFrame(source, sheet, frameIndex, alphaThreshold));
  const margin = 2;
  const maxLeftExtent = Math.max(...sourceMeasures.map((frame) => frame.rootAnchorX - frame.bbox.minX));
  const maxRightExtent = Math.max(...sourceMeasures.map((frame) => frame.bbox.maxX - frame.rootAnchorX));
  const loopScale = Math.min(
    1,
    (sheet.frameWidth - margin * 2 - 3) / (maxLeftExtent + maxRightExtent),
  );

  if (loopScale < 0.999) {
    for (const measure of sourceMeasures) {
      scaleFrameAroundAnchor(source, working, sheet, measure.frameIndex, loopScale, measure.rootAnchorX, measure.footLine);
    }
  }

  const measures = frameIndexes.map((frameIndex) => measureFrame(working, sheet, frameIndex, alphaThreshold));
  const targetFootLine = Math.min(
    sheet.frameHeight - margin - 1,
    Math.round(median(measures.map((frame) => frame.footLine))),
  );
  const targetRootMinimum = Math.max(...measures.map((frame) => (
    frame.rootAnchorX + margin - frame.bbox.minX
  )));
  const targetRootMaximum = Math.min(...measures.map((frame) => (
    frame.rootAnchorX + sheet.frameWidth - margin - 1 - frame.bbox.maxX
  )));
  const integerMinimum = Math.ceil(targetRootMinimum);
  const integerMaximum = Math.floor(targetRootMaximum);
  const targetRootAnchorX = Math.round(clamp(
    sheet.frameWidth / 2,
    integerMinimum,
    Math.max(integerMinimum, integerMaximum),
  ));
  const output = new PNG({ width: source.width, height: source.height });
  working.data.copy(output.data);
  const shifts = [];

  for (const measure of measures) {
    const dx = Math.round(targetRootAnchorX - measure.rootAnchorX);
    const dy = Math.round(targetFootLine - measure.footLine);
    translateFrame(working, output, sheet, measure.frameIndex, dx, dy);
    shifts.push({
      frameIndex: measure.frameIndex,
      dx,
      dy,
      sourceRootAnchorX: measure.rootAnchorX,
      sourceFootLine: measure.footLine,
    });
  }

  return { output, shifts, targetFootLine, targetRootAnchorX, loopScale: round(loopScale) };
}

export function fitSheetFramesToMargins(source, sheet, alphaThreshold, margin = 2) {
  const frameCount = sheet.columns * sheet.rows;
  const maximumWidth = sheet.frameWidth - margin * 2;
  const maximumHeight = sheet.frameHeight - margin * 2;
  const scaled = new PNG({ width: source.width, height: source.height });
  source.data.copy(scaled.data);
  const adjustments = [];
  const scaleByFrame = new Map();

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const measure = measureFrame(source, sheet, frameIndex, alphaThreshold);
    if (measure.empty) continue;
    const scale = Math.min(
      1,
      maximumWidth / measure.bbox.width,
      maximumHeight / measure.bbox.height,
    );
    if (scale < 0.999) {
      scaleByFrame.set(frameIndex, scale);
      scaleFrameAroundAnchor(
        source,
        scaled,
        sheet,
        frameIndex,
        scale,
        measure.rootAnchorX,
        measure.footLine,
      );
    }
  }

  const output = new PNG({ width: source.width, height: source.height });
  scaled.data.copy(output.data);
  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    const measure = measureFrame(scaled, sheet, frameIndex, alphaThreshold);
    if (measure.empty) continue;
    const dx = chooseMarginShift(
      measure.bbox.minX,
      measure.bbox.maxX,
      sheet.frameWidth,
      margin,
    );
    const dy = chooseMarginShift(
      measure.bbox.minY,
      measure.bbox.maxY,
      sheet.frameHeight,
      margin,
    );
    const scale = scaleByFrame.get(frameIndex) ?? 1;
    if (dx !== 0 || dy !== 0) {
      translateFrame(scaled, output, sheet, frameIndex, dx, dy);
    }
    if (dx !== 0 || dy !== 0 || scale < 0.999) {
      adjustments.push({
        frameIndex,
        dx,
        dy,
        scale: round(scale),
      });
    }
  }

  return { output, adjustments };
}

function chooseMarginShift(minimum, maximum, size, margin) {
  const minimumShift = margin - minimum;
  const maximumShift = size - margin - 1 - maximum;
  if (minimumShift > 0) return minimumShift;
  if (maximumShift < 0) return maximumShift;
  return 0;
}

function scaleFrameAroundAnchor(source, output, sheet, frameIndex, scale, anchorX, anchorY) {
  const origin = frameOrigin(sheet, frameIndex);
  for (let y = 0; y < sheet.frameHeight; y += 1) {
    for (let x = 0; x < sheet.frameWidth; x += 1) {
      const outputIndex = ((origin.y + y) * output.width + origin.x + x) * 4;
      const sourceX = anchorX + (x - anchorX) / scale;
      const sourceY = anchorY + (y - anchorY) / scale;
      const color = sampleBilinear(source, origin.x + sourceX, origin.y + sourceY, origin, sheet);
      output.data[outputIndex] = color[0];
      output.data[outputIndex + 1] = color[1];
      output.data[outputIndex + 2] = color[2];
      output.data[outputIndex + 3] = color[3];
    }
  }
}

function sampleBilinear(source, sourceX, sourceY, origin, sheet) {
  const localX = sourceX - origin.x;
  const localY = sourceY - origin.y;
  if (localX < 0 || localY < 0 || localX > sheet.frameWidth - 1 || localY > sheet.frameHeight - 1) {
    return [0, 0, 0, 0];
  }
  const left = Math.floor(sourceX);
  const top = Math.floor(sourceY);
  const right = Math.min(origin.x + sheet.frameWidth - 1, left + 1);
  const bottom = Math.min(origin.y + sheet.frameHeight - 1, top + 1);
  const tx = sourceX - left;
  const ty = sourceY - top;
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
    const index = (sample.y * source.width + sample.x) * 4;
    const sampleAlpha = source.data[index + 3] / 255;
    const weightedAlpha = sample.weight * sampleAlpha;
    alpha += weightedAlpha;
    red += source.data[index] * weightedAlpha;
    green += source.data[index + 1] * weightedAlpha;
    blue += source.data[index + 2] * weightedAlpha;
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

function translateFrame(source, output, sheet, frameIndex, dx, dy) {
  const origin = frameOrigin(sheet, frameIndex);
  for (let y = 0; y < sheet.frameHeight; y += 1) {
    for (let x = 0; x < sheet.frameWidth; x += 1) {
      const outputIndex = ((origin.y + y) * output.width + origin.x + x) * 4;
      output.data[outputIndex] = 0;
      output.data[outputIndex + 1] = 0;
      output.data[outputIndex + 2] = 0;
      output.data[outputIndex + 3] = 0;
    }
  }

  for (let y = 0; y < sheet.frameHeight; y += 1) {
    for (let x = 0; x < sheet.frameWidth; x += 1) {
      const targetX = x + dx;
      const targetY = y + dy;
      if (targetX < 0 || targetY < 0 || targetX >= sheet.frameWidth || targetY >= sheet.frameHeight) {
        continue;
      }
      const sourceIndex = ((origin.y + y) * source.width + origin.x + x) * 4;
      const outputIndex = ((origin.y + targetY) * output.width + origin.x + targetX) * 4;
      output.data[outputIndex] = source.data[sourceIndex];
      output.data[outputIndex + 1] = source.data[sourceIndex + 1];
      output.data[outputIndex + 2] = source.data[sourceIndex + 2];
      output.data[outputIndex + 3] = source.data[sourceIndex + 3];
    }
  }
}

function weightedMedian(pixels, axis) {
  const sorted = [...pixels].sort((left, right) => left[axis] - right[axis]);
  const total = sorted.reduce((sum, pixel) => sum + pixel.alpha, 0);
  let accumulated = 0;
  for (const pixel of sorted) {
    accumulated += pixel.alpha;
    if (accumulated >= total / 2) {
      return pixel[axis];
    }
  }
  return sorted.at(-1)?.[axis] ?? 0;
}

function weightedMean(pixels, axis) {
  const total = pixels.reduce((sum, pixel) => sum + pixel.alpha, 0);
  return total > 0
    ? pixels.reduce((sum, pixel) => sum + pixel[axis] * pixel.alpha, 0) / total
    : 0;
}

function findDenseCoreCenter(pixels, frameWidth, minY, maxY) {
  const verticalMin = minY + (maxY - minY) * 0.08;
  const verticalMax = minY + (maxY - minY) * 0.82;
  const candidates = pixels.filter((pixel) => pixel.y >= verticalMin && pixel.y <= verticalMax);
  const radius = Math.max(12, Math.round(frameWidth * 0.18));
  let bestCenter = Math.round(frameWidth / 2);
  let bestMass = -1;

  for (let center = 0; center < frameWidth; center += 1) {
    const mass = candidates.reduce((sum, pixel) => (
      Math.abs(pixel.x - center) <= radius ? sum + pixel.alpha : sum
    ), 0);
    if (mass > bestMass || (mass === bestMass && Math.abs(center - frameWidth / 2) < Math.abs(bestCenter - frameWidth / 2))) {
      bestMass = mass;
      bestCenter = center;
    }
  }

  const corePixels = candidates.filter((pixel) => Math.abs(pixel.x - bestCenter) <= radius);
  return weightedMean(corePixels.length > 0 ? corePixels : pixels, 'x');
}

function hueHistogram(pixels) {
  const histogram = new Array(24).fill(0);
  let total = 0;
  for (const pixel of pixels) {
    const { hue, saturation } = rgbToHsv(pixel.red, pixel.green, pixel.blue);
    if (saturation < 0.18) {
      continue;
    }
    const weight = pixel.alpha * saturation;
    histogram[Math.min(23, Math.floor(hue * 24))] += weight;
    total += weight;
  }
  return total > 0 ? histogram.map((value) => value / total) : histogram;
}

function rgbToHsv(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue /= 6;
    if (hue < 0) hue += 1;
  }
  return { hue, saturation: max === 0 ? 0 : delta / max };
}

function maxPairwisePaletteDistance(histograms) {
  let maximum = 0;
  for (let left = 0; left < histograms.length; left += 1) {
    for (let right = left + 1; right < histograms.length; right += 1) {
      const distance = histograms[left].reduce(
        (sum, value, index) => sum + Math.abs(value - histograms[right][index]),
        0,
      ) / 2;
      maximum = Math.max(maximum, distance);
    }
  }
  return maximum;
}

function range(values) {
  return values.length > 0 ? Math.max(...values) - Math.min(...values) : 0;
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value) {
  return Math.round(value * 100) / 100;
}
