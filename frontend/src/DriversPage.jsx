import { useEffect, useState } from 'react'
import { listDriverPackages, uploadDriverPackage } from './api'
import DriverPackageCard from './DriverPackageCard'

export default function DriversPage() {
  const [packages, setPackages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = () => {
    listDriverPackages().then(setPackages).catch((err) => setError(err.message))
  }

  useEffect(refresh, [])

  const onFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadDriverPackage(file)
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-100">Treiberpakete</h2>
        <p className="text-gray-400 text-sm mt-1">
          Lade ein Treiberpaket als ZIP hoch (kombinierte INF + CAT + weitere Treiberdateien,
          z.B. der Kyocera-Universaltreiber). Die INF wird automatisch geparst und dauerhaft
          gespeichert.
        </p>
      </div>

      <label className="inline-flex items-center gap-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md cursor-pointer text-white text-sm font-medium transition-colors">
        {uploading ? 'Lade hoch…' : 'Treiberpaket (ZIP) hochladen'}
        <input type="file" accept=".zip" className="hidden" onChange={onFileChange} disabled={uploading} />
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-3">
        {packages.length === 0 && (
          <p className="text-gray-500 text-sm">Noch keine Treiberpakete hochgeladen.</p>
        )}
        {packages.map((pkg) => (
          <DriverPackageCard
            key={pkg.id}
            pkg={pkg}
            onSaved={(updated) =>
              setPackages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
          />
        ))}
      </div>
    </div>
  )
}
