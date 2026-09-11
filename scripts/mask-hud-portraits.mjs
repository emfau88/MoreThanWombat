import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';

const portraitDirectory = resolve('public/assets/ui/battle/portraits');
const files = (await readdir(portraitDirectory)).filter((file) => file.endsWith('.png'));

for (const file of files) {
  const path = resolve(portraitDirectory, file);
  const png = PNG.sync.read(await readFile(path));
  if (png.width !== png.height) throw new Error(`${file}: HUD portrait must be square`);

  const center = (png.width - 1) * 0.5;
  const radius = png.width * 0.495;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const distance = Math.hypot(x - center, y - center);
      const edgeAlpha = Math.max(0, Math.min(1, radius + 0.5 - distance));
      const alphaIndex = (y * png.width + x) * 4 + 3;
      png.data[alphaIndex] = Math.round(png.data[alphaIndex] * edgeAlpha);
    }
  }
  await writeFile(path, PNG.sync.write(png));
}

console.log(`Masked ${files.length} HUD portraits with deterministic circular alpha.`);
