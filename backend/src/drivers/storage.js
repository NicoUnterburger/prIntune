import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { parseInf } from './infParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DRIVERS_DIR = path.join(__dirname, '..', '..', 'data', 'drivers');

// Entpackt eine ZIP sicher: jeder Eintrag muss innerhalb von targetDir landen.
// Schützt vor Zip-Slip (Einträge mit "../" oder absoluten Pfaden).
function safeExtract(zip, targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  for (const entry of zip.getEntries()) {
    const destPath = path.resolve(targetDir, entry.entryName);
    if (destPath !== resolvedTarget && !destPath.startsWith(resolvedTarget + path.sep)) {
      throw new Error(`Unsafe path in archive: ${entry.entryName}`);
    }
    if (entry.isDirectory) {
      fs.mkdirSync(destPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, entry.getData());
    }
  }
}

function findInfFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findInfFiles(full));
    } else if (entry.name.toLowerCase().endsWith('.inf')) {
      results.push(full);
    }
  }
  return results;
}

// Combined driver packages often ship one INF per language subfolder (e.g.
// ".../German/OEMSETUP.inf", ".../English/OEMSETUP.inf"). Prefer German, then
// English, since those are the languages used here; fall back to the largest
// INF (usually the most complete model list) if neither is present.
const PREFERRED_LANGUAGE_FOLDERS = ['german', 'deutsch', 'english'];

function pickInfFile(infFiles, filesDir) {
  for (const lang of PREFERRED_LANGUAGE_FOLDERS) {
    const match = infFiles.find((p) =>
      path.relative(filesDir, p).toLowerCase().split(path.sep).includes(lang)
    );
    if (match) return match;
  }
  return infFiles.map((p) => ({ p, size: fs.statSync(p).size })).sort((a, b) => b.size - a.size)[0]
    .p;
}

export function createDriverPackage(zipBuffer, originalName) {
  const id = uuidv4();
  const packageDir = path.join(DRIVERS_DIR, id);
  const filesDir = path.join(packageDir, 'files');
  fs.mkdirSync(filesDir, { recursive: true });

  let zip;
  try {
    zip = new AdmZip(zipBuffer);
    safeExtract(zip, filesDir);
  } catch (err) {
    fs.rmSync(packageDir, { recursive: true, force: true });
    throw new Error(`Invalid or unsafe ZIP archive: ${err.message}`);
  }

  const infFiles = findInfFiles(filesDir);
  if (infFiles.length === 0) {
    fs.rmSync(packageDir, { recursive: true, force: true });
    throw new Error('No .inf file found in uploaded driver package');
  }
  const infPath = pickInfFile(infFiles, filesDir);

  const { models } = parseInf(fs.readFileSync(infPath));

  const metadata = {
    id,
    originalName,
    name: originalName,
    comment: '',
    uploadedAt: new Date().toISOString(),
    infFileName: path.relative(filesDir, infPath),
    models,
  };
  fs.writeFileSync(
    path.join(packageDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  return metadata;
}

export function updateDriverPackage(id, { name, comment }) {
  const metadata = getDriverPackage(id);
  if (!metadata) return null;
  if (name !== undefined) metadata.name = name;
  if (comment !== undefined) metadata.comment = comment;
  fs.writeFileSync(
    path.join(DRIVERS_DIR, id, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  return metadata;
}

export function listDriverPackages() {
  if (!fs.existsSync(DRIVERS_DIR)) return [];
  return fs
    .readdirSync(DRIVERS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => getDriverPackage(e.name))
    .filter(Boolean)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function getDriverPackage(id) {
  const metaPath = path.join(DRIVERS_DIR, id, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  // Packages uploaded before name/comment existed don't have these fields yet.
  if (metadata.name === undefined) metadata.name = metadata.originalName;
  if (metadata.comment === undefined) metadata.comment = '';
  return metadata;
}

export function deleteDriverPackage(id) {
  const packageDir = path.join(DRIVERS_DIR, id);
  if (!fs.existsSync(path.join(packageDir, 'metadata.json'))) return false;
  fs.rmSync(packageDir, { recursive: true, force: true });
  return true;
}

export function getDriverFilesDir(id) {
  return path.join(DRIVERS_DIR, id, 'files');
}
