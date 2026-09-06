import assert from 'node:assert/strict';
import test from 'node:test';
import { EncounterDirector } from '../src/game/core/EncounterDirector';

const pressureProfiles = [
  { meleeTokens: 1, rangedTokens: 0, disruptionBudget: 0 },
  { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0 },
  { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 1 },
] as const;

test('invalid pressure profiles fail explicitly instead of disabling or bypassing pressure', () => {
  for (const burst of [{ periodMs: 0, durationMs: 1 }, { periodMs: 100, durationMs: 101 },
    { periodMs: Infinity, durationMs: 1 }, { periodMs: 100, durationMs: NaN }]) {
    assert.throws(() => new EncounterDirector({ sectionCount: 1,
      pressureProfiles: [{ ...pressureProfiles[0], burst }] }), /burst duration/);
  }
  assert.throws(() => new EncounterDirector({ sectionCount: 1,
    pressureProfiles: [{ ...pressureProfiles[0], meleeTokens: NaN }] }), /pressure budgets/);
});

function createDirector(sectionCount = pressureProfiles.length): EncounterDirector {
  return new EncounterDirector({
    sectionCount,
    pressureProfiles: pressureProfiles.slice(0, sectionCount),
    sectionIntroMs: 10,
    spawnEntryMs: 20,
    clearDelayMs: 15,
    transitionMs: 12,
  });
}

function activateCurrentEncounter(director: EncounterDirector): void {
  assert.deepEqual(director.advance(10, false), [{ type: 'spawning', sectionIndex: 0 }]);
  assert.deepEqual(director.advance(20, false), [{ type: 'active', sectionIndex: 0 }]);
  assert.equal(director.getPhase(), 'active');
}

test('encounter director gates attacks and mana until a visible entry becomes active', () => {
  const director = createDirector();

  assert.equal(director.getPhase(), 'section_intro');
  assert.equal(director.requestAttack(101, 'melee'), false);
  assert.equal(director.canRegenerateMana(), false);

  assert.deepEqual(director.advance(10, false), [{ type: 'spawning', sectionIndex: 0 }]);
  assert.equal(director.requestAttack(101, 'melee'), false);
  assert.equal(director.canRegenerateMana(), false);

  assert.deepEqual(director.advance(20, false), [{ type: 'active', sectionIndex: 0 }]);
  assert.equal(director.canRegenerateMana(), true);
  assert.equal(director.requestAttack(101, 'melee'), true);
});

test('encounter director enforces separate pressure budgets and releases interrupted tokens', () => {
  const director = createDirector();
  activateCurrentEncounter(director);

  assert.equal(director.requestAttack(1, 'melee'), true);
  assert.equal(director.requestAttack(2, 'melee'), false);
  assert.equal(director.requestAttack(3, 'ranged'), false);
  assert.deepEqual(director.getTokenUsage(), { melee: 1, ranged: 0, disruption: 0 });
  director.advance(300, false);
  assert.equal(director.requestAttack(2, 'melee'), false, 'Budget must hold after the spacing timer expires');
  assert.equal(director.requestAttack(3, 'ranged'), false, 'Zero ranged budget must hold after the spacing timer expires');

  director.reconcileAttackTokens(new Set());
  director.advance(300, false);
  assert.deepEqual(director.getTokenUsage(), { melee: 0, ranged: 0, disruption: 0 });
  assert.equal(director.requestAttack(2, 'melee'), true);
  director.releaseAttack(2);
  director.advance(300, false);
  assert.equal(director.requestAttack(3, 'melee'), true);
});

test('encounter director clears tokens before travel and enters the following section without a scene timer', () => {
  const director = createDirector();
  activateCurrentEncounter(director);
  assert.equal(director.requestAttack(20, 'melee'), true);

  assert.deepEqual(director.advance(0, true), [{ type: 'clear_delay', sectionIndex: 0 }]);
  assert.equal(director.getPhase(), 'clear_delay');
  assert.deepEqual(director.getTokenUsage(), { melee: 0, ranged: 0, disruption: 0 });
  assert.equal(director.canRegenerateMana(), false);

  assert.deepEqual(director.advance(15, false), [{ type: 'travel', sectionIndex: 0 }]);
  assert.equal(director.getPhase(), 'travel');
  assert.equal(director.requestAttack(20, 'melee'), false);
  assert.equal(director.beginTransition(), true);
  assert.equal(director.getPhase(), 'transition');
  assert.equal(director.canRegenerateMana(), false);

  assert.deepEqual(director.advance(12, false), [
    { type: 'next_section', sectionIndex: 1 },
    { type: 'section_intro', sectionIndex: 1 },
  ]);
  assert.equal(director.getSectionIndex(), 1);
  assert.equal(director.getPhase(), 'section_intro');
  assert.deepEqual(director.getBudget(), { meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0 });
});

test('final clear produces victory', () => {
  const director = createDirector(1);
  activateCurrentEncounter(director);
  assert.equal(director.requestAttack(30, 'melee'), true);

  assert.deepEqual(director.advance(0, true), [{ type: 'clear_delay', sectionIndex: 0 }]);
  assert.deepEqual(director.advance(15, false), [{ type: 'victory', sectionIndex: 0 }]);
  assert.equal(director.getPhase(), 'victory');
  assert.equal(director.canRegenerateMana(), false);
});

test('defeat is terminal and a new run cannot inherit attack allocations', () => {
  const director = createDirector();
  activateCurrentEncounter(director);
  director.requestAttack(1, 'melee');
  director.finishDefeat();
  assert.equal(director.requestAttack(2, 'melee'), false);
  assert.equal(director.canRegenerateMana(), false);
  assert.deepEqual(director.advance(10000, true), []);
  assert.deepEqual(director.getTokenUsage(), { melee: 0, ranged: 0, disruption: 0 });
  const restarted = createDirector();
  activateCurrentEncounter(restarted);
  assert.equal(restarted.requestAttack(1, 'melee'), true);
});

test('long frames cannot skip the rendered entry phase', () => {
  const director = createDirector();
  assert.deepEqual(director.advance(10000, false), [{ type: 'spawning', sectionIndex: 0 }]);
  assert.equal(director.requestAttack(1, 'melee'), false);
  director.advance(0, false);
  assert.equal(director.getPhase(), 'spawning');
});

test('mixed attacks are staggered; burst profile limits additional commitments between windows', () => {
  const director = new EncounterDirector({ sectionCount: 1, sectionIntroMs: 0, spawnEntryMs: 0,
    pressureProfiles: [{ meleeTokens: 1, rangedTokens: 1, disruptionBudget: 0,
      burst: { periodMs: 5000, durationMs: 1800 } }] });
  director.advance(0, false);
  director.advance(0, false);
  assert.equal(director.requestAttack(1, 'melee'), true);
  assert.equal(director.requestAttack(2, 'ranged'), false);
  director.advance(300, false);
  assert.equal(director.requestAttack(2, 'ranged'), true);
  director.releaseAttack(2);
  director.advance(1500, false);
  assert.equal(director.requestAttack(2, 'ranged'), false);
  director.advance(3200, false);
  assert.equal(director.requestAttack(2, 'ranged'), true);
});
