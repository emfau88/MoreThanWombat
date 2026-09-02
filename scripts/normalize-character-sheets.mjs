import fs from 'node:fs';
import path from 'node:path';
import {
  fitSheetFramesToMargins,
  normalizeLoopFrames,
  projectRoot,
  readManifest,
  readPng,
  writePng,
} from './character-sheet-tools.mjs';

const manifest = readManifest();
const report = {
  generatedAt: new Date().toISOString(),
  manifestVersion: manifest.version,
  sheets: [],
};

for (const sheet of manifest.sheets) {
  const source = readPng(sheet.source);
  const expectedWidth = sheet.frameWidth * sheet.columns;
  const expectedHeight = sheet.frameHeight * sheet.rows;
  if (source.width !== expectedWidth || source.height !== expectedHeight) {
    throw new Error(`${sheet.id}: expected ${expectedWidth}x${expectedHeight}, got ${source.width}x${source.height}`);
  }

  const normalized = normalizeLoopFrames(source, sheet, manifest.thresholds.alpha);
  const fitted = fitSheetFramesToMargins(
    normalized.output,
    sheet,
    manifest.thresholds.alpha,
  );
  writePng(sheet.runtime, fitted.output);
  report.sheets.push({
    id: sheet.id,
    source: sheet.source,
    runtime: sheet.runtime,
    targetFootLine: normalized.targetFootLine,
    targetRootAnchorX: normalized.targetRootAnchorX,
    loopScale: normalized.loopScale,
    shifts: normalized.shifts,
    marginAdjustments: fitted.adjustments,
  });
}

const reportPath = path.join(projectRoot, 'docs', 'qa', 'character-normalization-latest.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Normalized ${report.sheets.length} character sheets.`);
console.log(`Report: ${path.relative(projectRoot, reportPath)}`);
