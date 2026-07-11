import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { getDriverPackage, getDriverFilesDir } from '../drivers/storage.js';
import { renderPrinterScripts } from '../templates/render.js';

export function generateSourcePackage({
  driverPackageId,
  modelId,
  printerName,
  ipAddress,
  portName,
}) {
  const pkg = getDriverPackage(driverPackageId);
  if (!pkg) throw new Error('Driver package not found');

  const model = pkg.models.find((m) => m.displayName === modelId);
  if (!model) throw new Error('Model not found in driver package');

  if (!printerName || !ipAddress) {
    throw new Error('printerName and ipAddress are required');
  }

  const resolvedPortName = portName || `IP_${ipAddress}`;

  const { install, remove } = renderPrinterScripts({
    driverName: model.displayName,
    // pkg.infFileName is stored with POSIX separators (path.relative on the server);
    // the rendered script runs on Windows, so it needs backslashes.
    infFileName: pkg.infFileName.split(path.posix.sep).join('\\'),
    portName: resolvedPortName,
    ipAddress,
    printerName,
  });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'printdeploy-'));
  try {
    fs.cpSync(getDriverFilesDir(driverPackageId), tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'Install-Printer.ps1'), install);
    fs.writeFileSync(path.join(tempDir, 'Remove-Printer.ps1'), remove);

    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);
    const zipBuffer = zip.toBuffer();

    const detectionRegistryPath = `HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Print\\Printers\\${printerName}`;

    return {
      zipBuffer,
      meta: {
        driverPackageId,
        driverPackageName: pkg.name ?? pkg.originalName,
        printerName,
        driverName: model.displayName,
        ipAddress,
        portName: resolvedPortName,
        installCommand: 'powershell.exe -ExecutionPolicy Bypass -File .\\Install-Printer.ps1',
        uninstallCommand: 'powershell.exe -ExecutionPolicy Bypass -File .\\Remove-Printer.ps1',
        intuneWinAppUtilCommand:
          'IntuneWinAppUtil.exe -c <entpackter Ordner> -s Install-Printer.ps1 -o <output-ordner>',
        detectionRule: {
          ruleType: 'Registry',
          keyPath: detectionRegistryPath,
          value: 'Name',
          detectionMethod: 'String comparison',
          operator: 'Equals',
          name: printerName,
        },
      },
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
