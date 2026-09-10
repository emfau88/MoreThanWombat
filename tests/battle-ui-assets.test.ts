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

test('Junkyard zone transition is a transparent full-height seam cover', () => {
  const transition = PNG.sync.read(readFileSync(assetUrl('../../arenas/junkyard-run/zone_transition.png')));
  let transparentPixels = 0;

  for (let index = 3; index < transition.data.length; index += 4) {
    if (transition.data[index] < 16) transparentPixels += 1;
  }

  assert.equal(transition.width, 180);
  assert.equal(transition.height, 540);
  assert.ok(transparentPixels / (transition.width * transition.height) > 0.45);
});
