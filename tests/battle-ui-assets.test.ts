import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PNG } from 'pngjs';

const assetUrl = (name: string) =>
  new URL(`../public/assets/ui/battle/${name}`, import.meta.url);

const opaqueColorRatio = (
  png: PNG,
  predicate: (red: number, green: number, blue: number) => boolean,
) => {
  let opaquePixels = 0;
  let matchingPixels = 0;

  for (let index = 0; index < png.data.length; index += 4) {
    const alpha = png.data[index + 3];
    if (alpha <= 64) continue;

    opaquePixels += 1;
    if (predicate(png.data[index], png.data[index + 1], png.data[index + 2])) {
      matchingPixels += 1;
    }
  }

  return matchingPixels / opaquePixels;
};

test('ultimate button keeps its purple star asset instead of the cyan joystick artwork', () => {
  const ultimate = PNG.sync.read(readFileSync(assetUrl('ultimate_button.png')));
  const joystick = PNG.sync.read(readFileSync(assetUrl('joystick_base.png')));
  const isPurple = (red: number, green: number, blue: number) =>
    red > 90 && blue > 100 && blue > green * 1.2 && red > green * 1.15;

  assert.equal(ultimate.width, 256);
  assert.equal(ultimate.height, 256);
  assert.ok(opaqueColorRatio(ultimate, isPurple) > 0.25);
  assert.ok(opaqueColorRatio(joystick, isPurple) < 0.05);
});
