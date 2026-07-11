import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseInf } from '../src/drivers/infParser.js';

const SAMPLE_INF = `
; Example printer driver INF
[Version]
Signature="$Windows NT$"
Class=Printer

[Manufacturer]
%Vendor% = Models, NTamd64

[Models.NTamd64]
"Acme LaserJet 100" = Install100, ACME_LJ100
%FancyName% = Install200, ACME_LJ200, ACME_LJ200_ALT

[Strings]
Vendor = "Acme"
FancyName = "Acme LaserJet 200 Pro"
`;

test('parses display names from a decorated model section', () => {
  const { models } = parseInf(Buffer.from(SAMPLE_INF, 'utf8'));
  const names = models.map((m) => m.displayName);
  assert.deepEqual(names, ['Acme LaserJet 100', 'Acme LaserJet 200 Pro']);
});

test('resolves %Token% references against [Strings]', () => {
  const { models } = parseInf(Buffer.from(SAMPLE_INF, 'utf8'));
  const fancy = models.find((m) => m.installSection === 'Install200');
  assert.equal(fancy.displayName, 'Acme LaserJet 200 Pro');
});

test('extracts install section and hardware IDs', () => {
  const { models } = parseInf(Buffer.from(SAMPLE_INF, 'utf8'));
  const first = models.find((m) => m.displayName === 'Acme LaserJet 100');
  assert.equal(first.installSection, 'Install100');
  assert.deepEqual(first.hardwareIds, ['ACME_LJ100']);
});

test('returns models sorted alphabetically', () => {
  const inf = `
[Manufacturer]
%V% = Models
[Models]
"Zebra" = InstZ
"Alpha" = InstA
[Strings]
V = "Vendor"
`;
  const { models } = parseInf(Buffer.from(inf, 'utf8'));
  assert.deepEqual(
    models.map((m) => m.displayName),
    ['Alpha', 'Zebra']
  );
});

test('deduplicates models that appear in multiple sections', () => {
  const inf = `
[Manufacturer]
%V% = Models, NTamd64
[Models.NTamd64]
"Printer A" = InstA_amd64, HWID_A
[Models]
"Printer A" = InstA_base, HWID_A
[Strings]
V = "Vendor"
`;
  const { models } = parseInf(Buffer.from(inf, 'utf8'));
  assert.equal(models.length, 1);
  // First-seen wins: the decorated (.NTamd64) section is processed first.
  assert.equal(models[0].installSection, 'InstA_amd64');
});

test('decodes UTF-16 LE with BOM', () => {
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(SAMPLE_INF, 'utf16le')]);
  const { models } = parseInf(utf16);
  assert.ok(models.some((m) => m.displayName === 'Acme LaserJet 100'));
});

test('ignores comments and blank lines', () => {
  const inf = `
; a comment
[Manufacturer]
%V% = Models   ; trailing comment
[Models]
"Printer X" = InstX, HWID_X ; inline
[Strings]
V = "Vendor"
`;
  const { models } = parseInf(Buffer.from(inf, 'utf8'));
  assert.deepEqual(
    models.map((m) => m.displayName),
    ['Printer X']
  );
});
