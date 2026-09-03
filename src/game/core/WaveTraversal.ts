import type { FighterBounds } from '../combat/Fighter';
import type { StageDefinition } from '../data/stages';

export type WaveTraversalPhase = 'combat' | 'travel' | 'transition';

export function getWaveTraversalBounds(
  stage: StageDefinition,
  sectionIndex: number,
  phase: WaveTraversalPhase,
): FighterBounds | null {
  const section = stage.sections[sectionIndex];
  if (!section) {
    return null;
  }

  return phase === 'travel' ? section.travelBounds ?? section.bounds : section.bounds;
}

export function canEnterNextWaveSection(stage: StageDefinition, sectionIndex: number, playerX: number): boolean {
  const section = stage.sections[sectionIndex];
  const nextSection = stage.sections[sectionIndex + 1];

  return Boolean(
    section
      && nextSection
      && section.arrivalTriggerX !== undefined
      && playerX >= section.arrivalTriggerX,
  );
}
