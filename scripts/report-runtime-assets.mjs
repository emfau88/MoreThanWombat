import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const assetRoot = path.join(projectRoot, 'public', 'assets');
const preloadPath = path.join(projectRoot, 'src', 'game', 'scenes', 'PreloadScene.ts');
const sourceNamePattern = /(^|[\\/._-])(source|original|raw|chroma|reserve|master)([\\/._-]|$)/i;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

const preloadSource = await readFile(preloadPath, 'utf8');
const files = await listFiles(assetRoot);
const records = await Promise.all(files.map(async (absolutePath) => {
  const relativePath = path.relative(assetRoot, absolutePath).replaceAll('\\', '/');
  const bytes = (await stat(absolutePath)).size;
  const loadedByPreload = preloadSource.includes(relativePath);

  return {
    relativePath,
    bytes,
    loadedByPreload,
    likelySource: sourceNamePattern.test(relativePath),
  };
}));

const totals = records.reduce((summary, record) => ({
  totalBytes: summary.totalBytes + record.bytes,
  loadedBytes: summary.loadedBytes + (record.loadedByPreload ? record.bytes : 0),
  likelySourceBytes: summary.likelySourceBytes + (record.likelySource ? record.bytes : 0),
  loadedFiles: summary.loadedFiles + (record.loadedByPreload ? 1 : 0),
  likelySourceFiles: summary.likelySourceFiles + (record.likelySource ? 1 : 0),
}), { totalBytes: 0, loadedBytes: 0, likelySourceBytes: 0, loadedFiles: 0, likelySourceFiles: 0 });

const largestFiles = [...records]
  .sort((left, right) => right.bytes - left.bytes)
  .slice(0, 12);
const likelySourceFiles = records
  .filter((record) => record.likelySource)
  .sort((left, right) => right.bytes - left.bytes);

console.log('# Runtime Asset Report');
console.log('');
console.log(`- Public assets: ${records.length} files, ${formatMiB(totals.totalBytes)}`);
console.log(`- Directly referenced by PreloadScene: ${totals.loadedFiles} files, ${formatMiB(totals.loadedBytes)}`);
console.log(`- Likely source-only by filename: ${totals.likelySourceFiles} files, ${formatMiB(totals.likelySourceBytes)}`);
console.log('');
console.log('## Largest public assets');
console.log('');
console.log('| File | Size | Preload | Likely source |');
console.log('| --- | ---: | :---: | :---: |');
for (const record of largestFiles) {
  console.log(`| ${record.relativePath} | ${formatMiB(record.bytes)} | ${record.loadedByPreload ? 'yes' : 'no'} | ${record.likelySource ? 'yes' : 'no'} |`);
}

console.log('');
console.log('## Likely source-only candidates');
console.log('');
if (likelySourceFiles.length === 0) {
  console.log('None.');
} else {
  for (const record of likelySourceFiles) {
    console.log(`- ${record.relativePath} (${formatMiB(record.bytes)})${record.loadedByPreload ? ' — also referenced by PreloadScene' : ''}`);
  }
}
