import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { CatalogPage } from './pages/CatalogPage'
import { BracketConfigPage } from './pages/BracketConfigPage'

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-800 dark:text-white">
            BracketFactory
          </Link>
          <p className="hidden text-sm text-slate-500 sm:block">
            Parametric brackets — preview &amp; STL in your browser
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          {/* More specific paths first so `/` cannot swallow nested routes (React Router ranking). */}
          <Route path="/bracket/:templateId" element={<BracketConfigPage />} />
          <Route path="/" element={<CatalogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
