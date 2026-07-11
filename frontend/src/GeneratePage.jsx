import { useEffect, useMemo, useState } from 'react'
import { downloadGeneratedUrl, generatePackage, listDriverPackages } from './api'
import PackageInfo from './PackageInfo'

export default function GeneratePage() {
  const [packages, setPackages] = useState([])
  const [driverPackageId, setDriverPackageId] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [modelId, setModelId] = useState('')
  const [printerName, setPrinterName] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [portName, setPortName] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listDriverPackages().then((pkgs) => {
      setPackages(pkgs)
      if (pkgs.length > 0) setDriverPackageId(pkgs[0].id)
    })
  }, [])

  const selectedPackage = packages.find((p) => p.id === driverPackageId)

  const filteredModels = useMemo(() => {
    if (!selectedPackage) return []
    const q = modelSearch.trim().toLowerCase()
    if (!q) return selectedPackage.models
    return selectedPackage.models.filter((m) => m.displayName.toLowerCase().includes(q))
  }, [selectedPackage, modelSearch])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setSubmitting(true)
    try {
      const res = await generatePackage({
        driverPackageId,
        modelId,
        printerName,
        ipAddress,
        portName: portName || undefined,
      })
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = driverPackageId && modelId && printerName && ipAddress

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Paket generieren</h2>
        <p className="text-gray-400 text-sm mt-1">
          Wähle Treiberpaket, Modell, Druckername und IP. Du erhältst eine ZIP mit den
          fertig ausgefüllten Install-/Remove-Skripten und allen Treiberdateien — daraus baust
          du selbst mit <code className="text-gray-300">IntuneWinAppUtil.exe</code> das
          .intunewin.
        </p>
      </div>

      {packages.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Noch kein Treiberpaket hochgeladen. Lade zuerst eines im Tab „Treiber" hoch.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Treiberpaket</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
              value={driverPackageId}
              onChange={(e) => {
                setDriverPackageId(e.target.value)
                setModelId('')
              }}
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.models.length} Modelle)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Druckermodell</label>
            <input
              type="text"
              placeholder="Modell suchen…"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100 mb-2"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
            />
            <select
              size={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              {filteredModels.map((m) => (
                <option key={m.displayName} value={m.displayName}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Druckername</label>
              <input
                type="text"
                placeholder="z.B. DR-3OG-Empfang"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">IP / Hostname</label>
              <input
                type="text"
                placeholder="10.11.8.156"
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Portname <span className="text-gray-500">(optional, Default: IP_&lt;IP&gt;)</span>
            </label>
            <input
              type="text"
              placeholder={ipAddress ? `IP_${ipAddress}` : 'IP_10.11.8.156'}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-100"
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-md text-white text-sm font-medium transition-colors"
          >
            {submitting ? 'Generiere…' : 'Generieren'}
          </button>
        </form>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-100 font-medium">Paket bereit</h3>
            <a
              href={downloadGeneratedUrl(result.id)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-md text-white text-sm font-medium transition-colors"
            >
              ZIP herunterladen
            </a>
          </div>
          <p className="text-gray-500 text-xs">
            Dieses Paket bleibt im Tab „Verlauf" gespeichert und kann dort jederzeit erneut
            heruntergeladen werden.
          </p>
          <PackageInfo record={result} />
        </div>
      )}
    </div>
  )
}
