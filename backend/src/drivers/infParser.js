// Parses the Windows printer-driver INF structure:
//   [Manufacturer]
//   %Vendor%=ModelsSectionName,NTamd64,...
//   [ModelsSectionName.NTamd64]
//   "Display Name" = InstallSectionName, HardwareID1, HardwareID2
// Resolves %Token% references against [Strings].

function decodeInf(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.slice(2).toString('utf16le');
  }
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.slice(3).toString('utf8');
  }
  return buffer.toString('utf8');
}

function stripComment(line) {
  const idx = line.indexOf(';');
  return idx === -1 ? line : line.slice(0, idx);
}

function splitSections(text) {
  const sections = new Map();
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (!line) continue;
    const headerMatch = line.match(/^\[(.+)\]$/);
    if (headerMatch) {
      current = headerMatch[1].trim();
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  return sections;
}

function splitTopLevelCommas(value) {
  const parts = [];
  let cur = '';
  let inQuotes = false;
  for (const ch of value) {
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === ',' && !inQuotes) {
      parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseStrings(sections) {
  const strings = {};
  const lines = sections.get('Strings') || [];
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    strings[key] = unquote(line.slice(eq + 1));
  }
  return strings;
}

function resolveToken(value, strings) {
  const match = value.match(/^%(.+)%$/);
  if (!match) return unquote(value);
  return strings[match[1]] ?? value;
}

function parseManufacturerSection(sections) {
  const lines = sections.get('Manufacturer') || [];
  const targets = [];
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const rhs = splitTopLevelCommas(line.slice(eq + 1));
    if (!rhs.length) continue;
    const baseSection = rhs[0];
    const archDecorations = rhs.slice(1);
    if (archDecorations.length === 0) {
      targets.push(baseSection);
    } else {
      for (const arch of archDecorations) {
        targets.push(`${baseSection}.${arch}`);
      }
    }
    // Some INFs list the base (undecorated) model section too.
    targets.push(baseSection);
  }
  return [...new Set(targets)];
}

function parseModelSection(sections, sectionName, strings) {
  const lines = sections.get(sectionName);
  if (!lines) return [];
  const models = [];
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const rawName = line.slice(0, eq).trim();
    const displayName = resolveToken(rawName, strings);
    const rhs = splitTopLevelCommas(line.slice(eq + 1));
    if (!rhs.length) continue;
    const [installSection, ...hardwareIds] = rhs;
    models.push({ displayName, installSection, hardwareIds });
  }
  return models;
}

export function parseInf(buffer) {
  const text = decodeInf(buffer);
  const sections = splitSections(text);
  const strings = parseStrings(sections);
  const modelSectionNames = parseManufacturerSection(sections);

  const modelsByName = new Map();
  for (const sectionName of modelSectionNames) {
    for (const model of parseModelSection(sections, sectionName, strings)) {
      if (!modelsByName.has(model.displayName)) {
        modelsByName.set(model.displayName, model);
      }
    }
  }

  return {
    models: [...modelsByName.values()].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    ),
  };
}
