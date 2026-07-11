import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const HISTORY_DIR = path.join(__dirname, '..', '..', 'data', 'generated');

export function saveGeneratedPackage(zipBuffer, meta) {
  const id = uuidv4();
  const recordDir = path.join(HISTORY_DIR, id);
  fs.mkdirSync(recordDir, { recursive: true });
  fs.writeFileSync(path.join(recordDir, 'package.zip'), zipBuffer);

  const record = { id, generatedAt: new Date().toISOString(), ...meta };
  fs.writeFileSync(
    path.join(recordDir, 'metadata.json'),
    JSON.stringify(record, null, 2)
  );
  return record;
}

export function listGeneratedPackages() {
  if (!fs.existsSync(HISTORY_DIR)) return [];
  return fs
    .readdirSync(HISTORY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => getGeneratedPackage(e.name))
    .filter(Boolean)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export function getGeneratedPackage(id) {
  const metaPath = path.join(HISTORY_DIR, id, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

export function getGeneratedZipPath(id) {
  return path.join(HISTORY_DIR, id, 'package.zip');
}
