import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMobileControlTarget } from '../src/game/core/MobileControlHitTest';
import { getMobileControlLayout } from '../src/game/core/MobileControlLayout';

const geometry = {
  screenWidth: 960,
  menu: { x: 52, y: 30, width: 70, height: 24 },
  attack: { x: 864, y: 454, radius: 42 },
  special: { x: 790, y: 394, radius: 34 },
  ultimate: { x: 862, y: 362, radius: 32 },
  jump: { x: 784, y: 472, radius: 32 },
  joystickAvailable: true,
};

test('menu wins over the broad left-half joystick capture', () => {
  assert.equal(resolveMobileControlTarget({ x: 52, y: 30 }, geometry), 'menu');
});

test('left-side playfield still captures the joystick', () => {
  assert.equal(resolveMobileControlTarget({ x: 180, y: 400 }, geometry), 'joystick');
});

test('larger action buttons keep separate matching touch circles across landscape widths', () => {
  const actions = ['attack', 'special', 'ultimate', 'jump'] as const;
  for (const width of [960, 1169, 1398]) {
    const layout = getMobileControlLayout(width, 540);
    const geometry = { ...layout, screenWidth: width, joystickAvailable: true };
    for (const action of actions) {
      const button = layout[action];
      const originalRadius = action === 'attack' ? 42 : action === 'special' ? 34 : 32;
      assert.equal(button.radius, originalRadius * 1.1);
      assert.ok(button.x + button.radius < width && button.y + button.radius < 540);
      for (let sample = 0; sample < 8; sample++) {
        const angle = sample * Math.PI / 4;
        const point = (distance: number) => ({ x: button.x + Math.cos(angle) * distance,
          y: button.y + Math.sin(angle) * distance });
        assert.equal(resolveMobileControlTarget(point(button.radius - 0.1), geometry), action);
        assert.equal(resolveMobileControlTarget(point(button.radius + 1), geometry), 'none');
      }
      for (const other of actions.filter((candidate) => candidate !== action)) {
        const target = layout[other];
        assert.ok(Math.hypot(target.x - button.x, target.y - button.y) - target.radius - button.radius > 8);
      }
    }
  }
});
