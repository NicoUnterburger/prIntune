export default function PackageInfo({ record }) {
  return (
    <div className="text-sm space-y-2">
      <p className="text-gray-400">1. ZIP entpacken, dann lokal (Windows) ausführen:</p>
      <pre className="bg-gray-900 rounded p-3 text-gray-200 overflow-x-auto">
        {record.intuneWinAppUtilCommand}
      </pre>

      <p className="text-gray-400">2. Im Intune Win32-App-Wizard verwenden:</p>
      <pre className="bg-gray-900 rounded p-3 text-gray-200 overflow-x-auto">
{`Install:   ${record.installCommand}
Uninstall: ${record.uninstallCommand}`}
      </pre>

      <p className="text-gray-400">3. Detection Rule:</p>
      <pre className="bg-gray-900 rounded p-3 text-gray-200 overflow-x-auto">
{`Rule Type:  ${record.detectionRule.ruleType}
Key path:   ${record.detectionRule.keyPath}
Value:      ${record.detectionRule.value}
Method:     ${record.detectionRule.detectionMethod}
Operator:   ${record.detectionRule.operator}
Name:       ${record.detectionRule.name}`}
      </pre>
    </div>
  )
}
