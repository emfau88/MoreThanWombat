import assert from 'node:assert/strict';
import test from 'node:test';
import { InputBuffer } from '../src/game/combat/InputBuffer';

const emptyInput = {
  attackPressed: false,
  specialPressed: false,
  ultimatePressed: false,
  jumpPressed: false,
};

test('input buffer retains a tap through a short freeze and consumes it once', () => {
  const buffer = new InputBuffer(120);
  buffer.capture({ ...emptyInput, attackPressed: true });
  buffer.advance(100);
  assert.equal(buffer.has('attack'), true);
  assert.equal(buffer.consume('attack'), true);
  assert.equal(buffer.consume('attack'), false);
});

test('input buffer expires unconsumed actions', () => {
  const buffer = new InputBuffer(120);
  buffer.capture({ ...emptyInput, specialPressed: true });
  buffer.advance(121);
  assert.equal(buffer.has('special'), false);
});

test('production buffer remains alive across the longest default hitstop', () => {
  const buffer = new InputBuffer(150);
  buffer.capture({ ...emptyInput, jumpPressed: true });
  buffer.advance(110);
  assert.equal(buffer.has('jump'), true);
  buffer.advance(41);
  assert.equal(buffer.has('jump'), false);
});

test('buffer lifetime does not age while combat is frozen', () => {
  const buffer = new InputBuffer(120);
  buffer.capture({ ...emptyInput, attackPressed: true });
  buffer.advance(500, true);
  assert.equal(buffer.has('attack'), true);
  buffer.advance(120);
  assert.equal(buffer.has('attack'), false);
});
