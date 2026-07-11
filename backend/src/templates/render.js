import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function renderTemplate(templateName, tokens) {
  const templatePath = path.join(__dirname, templateName);
  let content = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(tokens)) {
    content = content.replaceAll(`{{${key}}}`, value);
  }
  return content;
}

export function renderPrinterScripts({
  driverName,
  infFileName,
  portName,
  ipAddress,
  printerName,
}) {
  const tokens = {
    DRIVER_NAME: driverName,
    INF_FILENAME: infFileName,
    PORT_NAME: portName,
    IP_ADDRESS: ipAddress,
    PRINTER_NAME: printerName,
  };
  return {
    install: renderTemplate('Install-Printer.ps1.tpl', tokens),
    remove: renderTemplate('Remove-Printer.ps1.tpl', tokens),
  };
}
