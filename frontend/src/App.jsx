import { useState } from 'react'
import DriversPage from './DriversPage'
import GeneratePage from './GeneratePage'
import HistoryPage from './HistoryPage'

const TABS = [
  { id: 'generate', label: 'Generieren', Component: GeneratePage },
  { id: 'history', label: 'Verlauf', Component: HistoryPage },
  { id: 'drivers', label: 'Treiber', Component: DriversPage },
]

export default function App() {
  const [tab, setTab] = useState('generate')
  const ActiveComponent = TABS.find((t) => t.id === tab).Component

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-100">prIntune</h1>
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main>
        <ActiveComponent />
      </main>
    </div>
  )
}
