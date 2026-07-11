import { useEffect, useState } from 'react'
import { downloadGeneratedUrl, listGeneratedPackages } from './api'
import PackageInfo from './PackageInfo'

export default function HistoryPage() {
  const [records, setRecords] = useState([])
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    listGeneratedPackages().then(setRecords).catch((err) => setError(err.message))
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Verlauf</h2>
        <p className="text-gray-400 text-sm mt-1">
          Bereits generierte Pakete. ZIPs bleiben dauerhaft gespeichert und können jederzeit
          erneut heruntergeladen werden.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-3">
        {records.length === 0 && (
          <p className="text-gray-500 text-sm">Noch keine Pakete generiert.</p>
        )}
        {records.map((record) => {
          const expanded = expandedId === record.id
          return (
            <div key={record.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-gray-100 font-medium">
                    {record.printerName} <span className="text-gray-500">· {record.ipAddress}</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{record.driverName}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {record.driverPackageName} · {new Date(record.generatedAt).toLocaleString('de-DE')}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <a
                    href={downloadGeneratedUrl(record.id)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-white text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    ZIP herunterladen
                  </a>
                  <button
                    onClick={() => setExpandedId(expanded ? null : record.id)}
                    className="text-gray-500 hover:text-gray-300 text-xs"
                  >
                    {expanded ? 'Details ausblenden' : 'Details anzeigen'}
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <PackageInfo record={record} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
