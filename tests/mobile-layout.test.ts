import assert from 'node:assert/strict';
import test from 'node:test';
import { getFloatingJoystickCenter, getMobileControlLayout } from '../src/game/core/MobileControlLayout';
import { convertCssSafeAreaToGame } from '../src/game/core/SafeArea';
import {
  getHudFrameAnchor,
  getHudResourceFillRect,
  HUD_LAYOUT,
} from '../src/game/ui/HudLayout';

function circleFitsViewport(circle: { x: number; y: number; radius: number }, width: number, height: number): boolean {
  return circle.x - circle.radius >= 0
    && circle.x + circle.radius <= width
    && circle.y - circle.radius >= 0
    && circle.y + circle.radius <= height;
}

test('mobile controls stay inside the smallest supported landscape viewport', () => {
  const layout = getMobileControlLayout(568, 320, { cssPixelsPerGameUnit: 568 / 960 });

  for (const control of [layout.joystick, layout.attack, layout.special, layout.ultimate, layout.jump, layout.defend]) {
    assert.equal(circleFitsViewport(control, 568, 320), true);
  }
  assert.ok(layout.menu.x - layout.menu.width / 2 >= 0);
  assert.ok(layout.menu.y - layout.menu.height / 2 >= 0);
});

test('secondary touch targets preserve a 48 CSS pixel minimum', () => {
  const cssScale = 0.5;
  const layout = getMobileControlLayout(960, 540, { cssPixelsPerGameUnit: cssScale });

  for (const action of ['jump', 'special', 'ultimate', 'defend'] as const) {
    assert.ok(layout[action].radius * 2 * cssScale >= 48);
  }
});

test('safe-area insets shift controls and keep their hit circles inside the usable rectangle', () => {
  const safeArea = { top: 12, right: 40, bottom: 30, left: 24 };
  const layout = getMobileControlLayout(960, 540, { safeArea });

  assert.ok(layout.menu.x - layout.menu.width / 2 >= safeArea.left);
  assert.ok(layout.menu.y - layout.menu.height / 2 >= safeArea.top);
  for (const action of ['attack', 'jump', 'special', 'ultimate', 'defend'] as const) {
    const target = layout[action];
    assert.ok(target.x + target.radius <= 960 - safeArea.right);
    assert.ok(target.y + target.radius <= 540 - safeArea.bottom);
  }
  assert.ok(layout.joystick.x - layout.joystick.radius >= safeArea.left);
  assert.ok(layout.joystick.y + layout.joystick.radius <= 540 - safeArea.bottom);
});

test('floating joystick origin clamps to its fully usable movement rectangle', () => {
  const layout = getMobileControlLayout(960, 540, { safeArea: { top: 0, right: 0, bottom: 24, left: 18 } });
  const topLeft = getFloatingJoystickCenter({ x: -100, y: -100 }, layout);
  const bottomRight = getFloatingJoystickCenter({ x: 900, y: 900 }, layout);
  const clamp = layout.joystickClamp;

  assert.equal(topLeft.x, clamp.x - clamp.width / 2);
  assert.equal(topLeft.y, clamp.y - clamp.height / 2);
  assert.equal(bottomRight.x, clamp.x + clamp.width / 2);
  assert.equal(bottomRight.y, clamp.y + clamp.height / 2);
});

test('CSS safe-area pixels convert into logical Phaser coordinates', () => {
  const converted = convertCssSafeAreaToGame(
    { top: 10, right: 20, bottom: 30, left: 40 },
    960,
    540,
    480,
    270,
  );

  assert.deepEqual(converted, { top: 20, right: 40, bottom: 60, left: 80 });
});

test('menu control clears the player HUD frame instead of covering it', () => {
  const layout = getMobileControlLayout(568, 320);
  const menuRight = layout.menu.x + layout.menu.width / 2;

  assert.ok(HUD_LAYOUT.player.left > menuRight);
});

test('modular HUD frames, portrait sockets and resource slots fit their viewport envelopes', () => {
  const viewportWidth = 960;
  const playerLeft = getHudFrameAnchor(viewportWidth, 'left');
  const enemyRight = getHudFrameAnchor(viewportWidth, 'right');

  assert.ok(playerLeft >= 0);
  assert.ok(playerLeft + HUD_LAYOUT.frame.width <= viewportWidth);
  assert.ok(enemyRight - HUD_LAYOUT.frame.width >= 0);
  assert.ok(enemyRight <= viewportWidth);
  assert.ok(HUD_LAYOUT.portrait.x - HUD_LAYOUT.portrait.radius >= 0);
  assert.ok(HUD_LAYOUT.portrait.x + HUD_LAYOUT.portrait.radius <= HUD_LAYOUT.frame.width);
  for (const slot of [HUD_LAYOUT.hp, HUD_LAYOUT.mana]) {
    assert.ok(slot.x >= 0);
    assert.ok(slot.x + slot.width <= HUD_LAYOUT.frame.width);
    assert.ok(slot.y >= 0);
    assert.ok(slot.y + slot.height <= HUD_LAYOUT.frame.height);
  }
});

test('HUD fills stay behind the bevel at 0%, 1%, 50% and 100%', () => {
  for (const slot of [HUD_LAYOUT.hp, HUD_LAYOUT.mana]) {
    const innerWidth = slot.width - slot.padding * 2;
    for (const ratio of [0, 0.01, 0.5, 1]) {
      const fill = getHudResourceFillRect(slot, ratio);
      assert.equal(fill.x, slot.x + slot.padding);
      assert.equal(fill.width, innerWidth * ratio);
      assert.ok(fill.x + fill.width <= slot.x + slot.width - slot.padding);
      assert.ok(fill.height <= slot.height - slot.padding * 2);
    }
  }
});
