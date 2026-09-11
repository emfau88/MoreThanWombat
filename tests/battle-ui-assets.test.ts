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

const opaqueBounds = (png: PNG) => {
  let left = png.width;
  let top = png.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] <= 16) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  return { width: right - left + 1, height: bottom - top + 1 };
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

test('runtime joystick parts are transparent square assets with circular bounds', () => {
  for (const [name, size, minimumUtilization] of [
    ['joystick_base.png', 384, 0.82],
    ['joystick_knob.png', 192, 0.52],
  ] as const) {
    const png = PNG.sync.read(readFileSync(assetUrl(name)));
    const bounds = opaqueBounds(png);
    const cornerAlphas = [
      png.data[3],
      png.data[(png.width - 1) * 4 + 3],
      png.data[((png.height - 1) * png.width) * 4 + 3],
      png.data[(png.width * png.height - 1) * 4 + 3],
    ];

    assert.equal(png.width, size);
    assert.equal(png.height, size);
    assert.ok(cornerAlphas.every((alpha) => alpha <= 16));
    assert.ok(Math.abs(bounds.width - bounds.height) / Math.max(bounds.width, bounds.height) < 0.025);
    assert.ok(bounds.width / png.width > minimumUtilization);
  }
});

test('R3 neutral HUD chassis is a compact transparent raster with a complete envelope', () => {
  const chassis = PNG.sync.read(readFileSync(assetUrl('hud_chassis_neutral.png')));
  const bounds = opaqueBounds(chassis);
  const cornerAlphas = [
    chassis.data[3],
    chassis.data[(chassis.width - 1) * 4 + 3],
    chassis.data[((chassis.height - 1) * chassis.width) * 4 + 3],
    chassis.data[(chassis.width * chassis.height - 1) * 4 + 3],
  ];

  assert.equal(chassis.width, 792);
  assert.equal(chassis.height, 240);
  assert.ok(cornerAlphas.every((alpha) => alpha <= 16));
  assert.ok(bounds.width / chassis.width > 0.94);
  assert.ok(bounds.height / chassis.height > 0.82);
});

test('R4 fighter portraits are optimized square PNGs with real transparency', () => {
  for (const name of [
    'wombat',
    'angry_pigeon',
    'discount_wizard',
    'budget_barbarian',
    'mara_breach',
    'buster_bulldog',
    'reference_fighter',
  ]) {
    const portrait = PNG.sync.read(readFileSync(assetUrl(`portraits/${name}.png`)));
    const bounds = opaqueBounds(portrait);
    const transparentCorners = [
      portrait.data[3],
      portrait.data[(portrait.width - 1) * 4 + 3],
      portrait.data[((portrait.height - 1) * portrait.width) * 4 + 3],
      portrait.data[(portrait.width * portrait.height - 1) * 4 + 3],
    ];

    assert.equal(portrait.width, 256);
    assert.equal(portrait.height, 256);
    assert.ok(transparentCorners.every((alpha) => alpha <= 16), `${name} must have transparent corners`);
    assert.ok(bounds.width / portrait.width > 0.55, `${name} must remain legible in the portrait socket`);
    assert.ok(bounds.height / portrait.height > 0.55, `${name} must remain legible in the portrait socket`);
  }
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
