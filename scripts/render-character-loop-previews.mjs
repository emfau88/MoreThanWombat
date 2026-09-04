import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  frameOrigin,
  projectRoot,
  readManifest,
  readPng,
} from './character-sheet-tools.mjs';

const manifest = readManifest();
const scale = 3;
const gap = 8;
const border = 2;
const outputDirectory = path.join(projectRoot, 'docs', 'qa', 'character-loop-previews');

fs.mkdirSync(outputDirectory, { recursive: true });

for (const sheet of manifest.sheets) {
  const previewGroups = sheet.previewGroups ?? sheet.groups;
  for (const [groupName, group] of Object.entries(previewGroups)) {
    const frameIndexes = Array.isArray(group) ? group : group.frames;
    const previewSheet = Array.isArray(group)
      ? sheet
      : { ...sheet, runtime: group.runtime ?? sheet.runtime, columns: group.columns ?? sheet.columns, rows: group.rows ?? sheet.rows };
    const source = readPng(previewSheet.runtime);
    const frameWidth = previewSheet.frameWidth * scale;
    const frameHeight = previewSheet.frameHeight * scale;
    const preview = new PNG({
      width: gap + frameIndexes.length * (frameWidth + gap),
      height: gap + 2 * (frameHeight + gap),
    });

    fillBackground(preview);
    frameIndexes.forEach((frameIndex, position) => {
      drawFrame({
        destination: preview,
        source,
        sheet: previewSheet,
        frameIndex,
        destinationX: gap + position * (frameWidth + gap),
        destinationY: gap,
        flipX: false,
      });
      drawFrame({
        destination: preview,
        source,
        sheet: previewSheet,
        frameIndex,
        destinationX: gap + position * (frameWidth + gap),
        destinationY: gap + frameHeight + gap,
        flipX: true,
      });
    });

    const outputPath = path.join(outputDirectory, `${sheet.id}-${groupName}.png`);
    fs.writeFileSync(outputPath, PNG.sync.write(preview, { colorType: 6 }));
  }
}

console.log(`Rendered loop previews for ${manifest.sheets.length} character sheets.`);
console.log(`Output: ${path.relative(projectRoot, outputDirectory)}`);

function fillBackground(png) {
  const checkerSize = 24;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const light = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2 === 0;
      const value = light ? 42 : 22;
      setPixel(png, x, y, value, value + 4, value + 9, 255);
    }
  }
}

function drawFrame({ destination, source, sheet, frameIndex, destinationX, destinationY, flipX }) {
  const origin = frameOrigin(sheet, frameIndex);
  const scaledWidth = sheet.frameWidth * scale;
  const scaledHeight = sheet.frameHeight * scale;

  for (let outlineY = -border; outlineY < scaledHeight + border; outlineY += 1) {
    for (let outlineX = -border; outlineX < scaledWidth + border; outlineX += 1) {
      if (
        outlineX >= 0
        && outlineY >= 0
        && outlineX < scaledWidth
        && outlineY < scaledHeight
      ) {
        continue;
      }
      setPixel(destination, destinationX + outlineX, destinationY + outlineY, 83, 196, 184, 255);
    }
  }

  for (let targetY = 0; targetY < scaledHeight; targetY += 1) {
    for (let targetX = 0; targetX < scaledWidth; targetX += 1) {
      const localX = Math.floor(targetX / scale);
      const localY = Math.floor(targetY / scale);
      const sampledX = flipX ? sheet.frameWidth - 1 - localX : localX;
      const sourceIndex = ((origin.y + localY) * source.width + origin.x + sampledX) * 4;
      const alpha = source.data[sourceIndex + 3] / 255;
      if (alpha <= 0) {
        continue;
      }
      const destinationPixelX = destinationX + targetX;
      const destinationPixelY = destinationY + targetY;
      const destinationIndex = (destinationPixelY * destination.width + destinationPixelX) * 4;
      const inverseAlpha = 1 - alpha;
      destination.data[destinationIndex] = Math.round(
        source.data[sourceIndex] * alpha + destination.data[destinationIndex] * inverseAlpha,
      );
      destination.data[destinationIndex + 1] = Math.round(
        source.data[sourceIndex + 1] * alpha + destination.data[destinationIndex + 1] * inverseAlpha,
      );
      destination.data[destinationIndex + 2] = Math.round(
        source.data[sourceIndex + 2] * alpha + destination.data[destinationIndex + 2] * inverseAlpha,
      );
      destination.data[destinationIndex + 3] = 255;
    }
  }
}

function setPixel(png, x, y, red, green, blue, alpha) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return;
  }
  const index = (y * png.width + x) * 4;
  png.data[index] = red;
  png.data[index + 1] = green;
  png.data[index + 2] = blue;
  png.data[index + 3] = alpha;
}
