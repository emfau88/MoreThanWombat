import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMobileControlTarget } from '../src/game/core/MobileControlHitTest';
import { ACTION_BUTTON_RADII, getMobileControlLayout } from '../src/game/core/MobileControlLayout';

const geometry = {
  menu: { x: 52, y: 30, width: 70, height: 24 },
  attack: { x: 864, y: 454, radius: 42 },
  special: { x: 790, y: 394, radius: 34 },
  ultimate: { x: 862, y: 362, radius: 32 },
  jump: { x: 784, y: 472, radius: 32 },
  defend: { x: 192, y: 468, radius: 28 },
  joystickRegion: { x: 206, y: 384, width: 412, height: 312 },
  joystickAvailable: true,
};

test('menu wins over the broad left-half joystick capture', () => {
  assert.equal(resolveMobileControlTarget({ x: 52, y: 30 }, geometry), 'menu');
});

test('left-side playfield still captures the joystick', () => {
  assert.equal(resolveMobileControlTarget({ x: 180, y: 400 }, geometry), 'joystick');
});

test('compact action cluster resolves every button center across landscape widths', () => {
  const actions = ['attack', 'jump', 'special', 'defend', 'ultimate'] as const;
  for (const width of [960, 1169, 1398]) {
    const layout = getMobileControlLayout(width, 540);
    const geometry = { ...layout, joystickAvailable: true };
    for (const action of actions) {
      const button = layout[action];
      assert.equal(button.radius, ACTION_BUTTON_RADII[action]);
      assert.ok(button.x + button.radius < width && button.y + button.radius < 540);
      assert.equal(resolveMobileControlTarget({ x: button.x, y: button.y }, geometry), action);
    }
  }
});

test('overlapping touch targets resolve to the closest normalized action center', () => {
  const layout = getMobileControlLayout(960, 540);
  const compactGeometry = { ...layout, joystickAvailable: true };
  const overlapY = layout.defend.y;

  assert.equal(resolveMobileControlTarget({ x: 860, y: overlapY }, compactGeometry), 'defend');
  assert.equal(resolveMobileControlTarget({ x: 859, y: overlapY }, compactGeometry), 'ultimate');
});

test('right-side action fan stays separate from the left joystick', () => {
  for (const [width, height] of [[568, 320], [844, 390], [960, 540]]) {
    const layout = getMobileControlLayout(width, height);
    const geometry = { ...layout, joystickAvailable: true };
    assert.equal(resolveMobileControlTarget({ x: layout.defend.x, y: layout.defend.y }, geometry), 'defend');
    assert.ok(Math.hypot(layout.defend.x - layout.joystick.x, layout.defend.y - layout.joystick.y)
      > layout.defend.radius + layout.joystick.radius + 8);
  }
});

test('joystick only captures the bounded lower-left movement region', () => {
  const layout = getMobileControlLayout(960, 540);
  const compactGeometry = { ...layout, joystickAvailable: true };

  assert.equal(resolveMobileControlTarget({ x: 180, y: 400 }, compactGeometry), 'joystick');
  assert.equal(resolveMobileControlTarget({ x: 180, y: 120 }, compactGeometry), 'none');
  assert.equal(resolveMobileControlTarget({ x: 180, y: 400 }, { ...compactGeometry, joystickAvailable: false }), 'none');
});
