import { useMemo, useState } from 'react'
import { deleteDriverPackage, updateDriverPackage } from './api'

const PREVIEW_COUNT = 3

export default function DriverPackageCard({ pkg, onSaved, onDeleted, onError }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(pkg.name)
  const [comment, setComment] = useState(pkg.comment)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showModels, setShowModels] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase()
    if (!q) return pkg.models
    return pkg.models.filter((m) => m.displayName.toLowerCase().includes(q))
  }, [pkg.models, modelSearch])

  const previewNames = pkg.models.slice(0, PREVIEW_COUNT).map((m) => m.displayName)
  const remainingCount = pkg.models.length - previewNames.length

  const save = async () => {
    setSaving(true)
    try {
      const updated = await updateDriverPackage(pkg.id, { name, comment })
      onSaved(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setName(pkg.name)
    setComment(pkg.comment)
    setEditing(false)
  }

  const remove = async () => {
    if (!window.confirm(`Treiberpaket „${pkg.name}" wirklich löschen?`)) return
    setDeleting(true)
    onError?.(null)
    try {
      await deleteDriverPackage(pkg.id)
      onDeleted?.(pkg.id)
    } catch (err) {
      onError?.(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-gray-100 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-gray-100 text-sm"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Kommentar (optional)"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || !name.trim()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-md text-white text-xs font-medium transition-colors"
                >
                  {saving ? 'Speichere…' : 'Speichern'}
                </button>
                <button
                  onClick={cancel}
                  disabled={saving}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 text-xs font-medium transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="text-gray-100 font-medium">{pkg.name}</p>
                <button
                  onClick={() => setEditing(true)}
                  className="text-gray-500 hover:text-gray-300 text-xs"
                >
                  bearbeiten
                </button>
                <button
                  onClick={remove}
                  disabled={deleting}
                  className="text-gray-500 hover:text-red-400 disabled:text-gray-600 text-xs"
                >
                  {deleting ? 'lösche…' : 'löschen'}
                </button>
              </div>
              {pkg.comment && <p className="text-gray-400 text-sm mt-1">{pkg.comment}</p>}
              <p className="text-gray-500 text-xs mt-1">
                Original: {pkg.originalName} · Hochgeladen:{' '}
                {new Date(pkg.uploadedAt).toLocaleString('de-DE')} · INF: {pkg.infFileName}
              </p>
              {!showModels && previewNames.length > 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  {previewNames.join(', ')}
                  {remainingCount > 0 && ` und ${remainingCount} weitere`}
                </p>
              )}
              {pkg.models.length > 0 && (
                <button
                  onClick={() => setShowModels(!showModels)}
                  className="text-gray-500 hover:text-gray-300 text-xs mt-2"
                >
                  {showModels ? 'Drucker ausblenden' : 'Alle Drucker anzeigen'}
                </button>
              )}
              {showModels && (
                <div className="mt-2">
                  {pkg.models.length > 10 && (
                    <input
                      type="text"
                      placeholder="Modell suchen…"
                      className="w-full bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-gray-100 text-sm mb-2"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                    />
                  )}
                  <ul className="max-h-48 overflow-y-auto bg-gray-900 border border-gray-700 rounded-md divide-y divide-gray-800">
                    {filteredModels.map((m) => (
                      <li key={m.displayName} className="px-2 py-1 text-gray-300 text-sm">
                        {m.displayName}
                      </li>
                    ))}
                    {filteredModels.length === 0 && (
                      <li className="px-2 py-1 text-gray-500 text-sm">Keine Treffer</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        <span className="text-xs bg-gray-700 text-gray-300 rounded-full px-3 py-1 whitespace-nowrap">
          {pkg.models.length} Modelle
        </span>
      </div>
    </div>
  )
}
