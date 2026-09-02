import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'config', 'vfx-style-lock.json'), 'utf8'));
const reportDirectory = path.join(projectRoot, 'docs', 'qa');
const results = manifest.assets.map(auditAsset);
const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}: ${failure}`));

fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(
  path.join(reportDirectory, 'vfx-style-lock-latest.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), results, failures }, null, 2)}\n`,
);
fs.writeFileSync(path.join(reportDirectory, 'vfx-style-lock-latest.md'), renderMarkdown(results, failures));

console.log(`VFX style-lock QA: ${results.length - new Set(failures.map((failure) => failure.split(':')[0])).size}/${results.length} assets pass.`);
if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

function auditAsset(asset) {
  const sourcePath = path.join(projectRoot, manifest.sourceRoot, asset.source);
  const runtimePath = path.join(projectRoot, manifest.runtimeRoot, asset.output);
  const source = PNG.sync.read(fs.readFileSync(sourcePath));
  const runtime = PNG.sync.read(fs.readFileSync(runtimePath));
  const sourceMetrics = measure(source);
  const runtimeMetrics = measure(runtime);
  const failures = [];

  if (!sourceMetrics.cornersTransparent) failures.push('source corners are not transparent');
  if (sourceMetrics.transparentRatio < 0.3) failures.push('source resembles a filled background instead of a cutout');
  if (runtime.width !== asset.canvasWidth || runtime.height !== asset.canvasHeight) failures.push('runtime canvas does not match manifest');
  if (!runtimeMetrics.cornersTransparent) failures.push('runtime corners are not transparent');
  if (!runtimeMetrics.borderTransparent) failures.push('runtime alpha touches the canvas border');
  if (!runtimeMetrics.bounds) failures.push('runtime asset is empty');
  const minimumPadding = asset.category === 'ground' ? 6 : 4;
  if (runtimeMetrics.bounds && getMinimumPadding(runtime, runtimeMetrics.bounds) < minimumPadding) {
    failures.push(`runtime alpha padding is below ${minimumPadding}px`);
  }
  if (runtimeMetrics.transparentRatio < 0.2) failures.push('runtime transparency budget is too low');

  return {
    id: asset.id,
    category: asset.category,
    source: asset.source,
    output: asset.output,
    sourceMetrics,
    runtimeMetrics,
    failures,
  };
}

function getMinimumPadding(png, bounds) {
  return Math.min(
    bounds.minX,
    bounds.minY,
    png.width - 1 - bounds.maxX,
    png.height - 1 - bounds.maxY,
  );
}

function measure(png) {
  let transparentPixels = 0;
  let partialPixels = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  let borderTransparent = true;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      if (alpha === 0) transparentPixels += 1;
      else if (alpha < 255) partialPixels += 1;
      if (alpha > 4) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) {
          borderTransparent = false;
        }
      }
    }
  }
  const totalPixels = png.width * png.height;
  const cornerIndexes = [
    3,
    (png.width - 1) * 4 + 3,
    ((png.height - 1) * png.width) * 4 + 3,
    (totalPixels - 1) * 4 + 3,
  ];
  return {
    width: png.width,
    height: png.height,
    transparentRatio: round(transparentPixels / totalPixels),
    partialRatio: round(partialPixels / totalPixels),
    cornersTransparent: cornerIndexes.every((index) => png.data[index] === 0),
    borderTransparent,
    bounds: maxX >= minX ? { minX, minY, maxX, maxY } : null,
  };
}

function renderMarkdown(results, failures) {
  const rows = results.map((result) => (
    `| ${result.id} | ${result.category} | ${Math.round(result.sourceMetrics.transparentRatio * 100)}% | ${result.runtimeMetrics.width}×${result.runtimeMetrics.height} | ${result.failures.length === 0 ? 'PASS' : result.failures.join('; ')} |`
  ));
  return `# VFX Style-Lock QA\n\nGenerated: ${new Date().toISOString()}\n\n| Asset | Category | Source transparency | Runtime | Result |\n|---|---|---:|---:|---|\n${rows.join('\n')}\n\nOverall: **${failures.length === 0 ? 'PASS' : 'FAIL'}**\n`;
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
