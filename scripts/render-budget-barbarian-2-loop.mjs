import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const root = process.cwd();
const sourcePath = path.join(root, 'public', 'assets', 'characters', 'budget-barbarian', 'budget_barbarian_2_spritesheet_160_normalized.png');
const outputDirectory = path.join(root, 'docs', 'qa', 'budget-barbarian-2-loop-frames');
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const frameSize = 160;
const scale = 3;
const walkFrames = [4, 5, 6, 7];

fs.mkdirSync(outputDirectory, { recursive: true });

for (const [position, frameIndex] of walkFrames.entries()) {
  const output = new PNG({ width: frameSize * scale, height: frameSize * scale });
  fillBackground(output);
  const originX = (frameIndex % 4) * frameSize;
  const originY = Math.floor(frameIndex / 4) * frameSize;

  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const sourceIndex = ((originY + y) * source.width + originX + x) * 4;
      const alpha = source.data[sourceIndex + 3] / 255;
      if (alpha <= 0) continue;
      for (let scaleY = 0; scaleY < scale; scaleY += 1) {
        for (let scaleX = 0; scaleX < scale; scaleX += 1) {
          const targetIndex = (((y * scale + scaleY) * output.width) + x * scale + scaleX) * 4;
          output.data[targetIndex] = Math.round(source.data[sourceIndex] * alpha + output.data[targetIndex] * (1 - alpha));
          output.data[targetIndex + 1] = Math.round(source.data[sourceIndex + 1] * alpha + output.data[targetIndex + 1] * (1 - alpha));
          output.data[targetIndex + 2] = Math.round(source.data[sourceIndex + 2] * alpha + output.data[targetIndex + 2] * (1 - alpha));
          output.data[targetIndex + 3] = 255;
        }
      }
    }
  }

  fs.writeFileSync(path.join(outputDirectory, `frame-${String(position).padStart(2, '0')}.png`), PNG.sync.write(output));
}

console.log(`Rendered ${walkFrames.length} runtime walk frames to ${path.relative(root, outputDirectory)}.`);

function fillBackground(png) {
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const stripe = Math.floor(y / 48) % 2 === 0;
      const index = (y * png.width + x) * 4;
      png.data[index] = stripe ? 21 : 29;
      png.data[index + 1] = stripe ? 33 : 43;
      png.data[index + 2] = stripe ? 47 : 59;
      png.data[index + 3] = 255;
    }
  }
}
