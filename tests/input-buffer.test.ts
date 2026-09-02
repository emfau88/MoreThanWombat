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
