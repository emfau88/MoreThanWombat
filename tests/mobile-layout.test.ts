import assert from 'node:assert/strict';
import test from 'node:test';
import { getMobileControlLayout } from '../src/game/core/MobileControlLayout';
import { HUD_LAYOUT } from '../src/game/ui/HudLayout';

function circleFitsViewport(circle: { x: number; y: number; radius: number }, width: number, height: number): boolean {
  return circle.x - circle.radius >= 0
    && circle.x + circle.radius <= width
    && circle.y - circle.radius >= 0
    && circle.y + circle.radius <= height;
}

test('mobile controls stay inside the smallest supported landscape viewport', () => {
  const layout = getMobileControlLayout(568, 320);

  for (const control of [layout.joystick, layout.attack, layout.special, layout.ultimate, layout.jump]) {
    assert.equal(circleFitsViewport(control, 568, 320), true);
  }
  assert.ok(layout.menu.x - layout.menu.width / 2 >= 0);
  assert.ok(layout.menu.y - layout.menu.height / 2 >= 0);
});

test('menu control clears the player HUD label instead of covering it', () => {
  const layout = getMobileControlLayout(568, 320);
  const menuBottom = layout.menu.y + layout.menu.height / 2;
  const playerLabelTop = HUD_LAYOUT.player.y + HUD_LAYOUT.labelOffsetY;

  assert.ok(playerLabelTop > menuBottom);
});
