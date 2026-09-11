import type { BattleMode } from '../core/BattleModes';
import type { StageEnemySpawnDefinition, StageSectionDefinition } from '../data/stages';

export type WaveHudKind = 'normal' | 'midboss' | 'boss';

export function getWaveHudKind(section: StageSectionDefinition | undefined): WaveHudKind {
  if (section?.enemies.some((spawn) => spawn.aiProfile === 'junkyard_boss')) return 'boss';
  if (section?.enemies.some((spawn) => spawn.aiProfile === 'scrap_foreman')) return 'midboss';
  return 'normal';
}

export function shouldShowLocalEnemyHealthBar(
  mode: BattleMode,
  section: StageSectionDefinition | undefined,
  spawn: StageEnemySpawnDefinition | undefined,
): boolean {
  return mode === 'waves' && getWaveHudKind(section) === 'normal' && spawn?.aiProfile === undefined;
}

export function formatWaveHudHeader(input: {
  stageTitle: string;
  sectionIndex: number;
  sectionCount: number;
  sectionTitle: string;
  remainingEnemies: number;
  kind: WaveHudKind;
  bossPhase?: number;
  traversalLabel?: string;
}): string {
  const prefix = `${input.stageTitle.toUpperCase()} · ${input.sectionIndex + 1}/${input.sectionCount}`;
  if (input.traversalLabel) return `${prefix} · ${input.traversalLabel.toUpperCase()}`;
  if (input.kind === 'boss') return `${prefix} · BOSS · PHASE ${input.bossPhase ?? 1}/2`;
  if (input.kind === 'midboss') return `${prefix} · MIDBOSS`;
  return `${prefix} · ${input.remainingEnemies} LEFT · ${input.sectionTitle.toUpperCase()}`;
}
