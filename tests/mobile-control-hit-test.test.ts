import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMobileControlTarget } from '../src/game/core/MobileControlHitTest';

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
