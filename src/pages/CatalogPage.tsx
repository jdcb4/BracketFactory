import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAllTemplates } from '../registry/loadTemplates'

export function CatalogPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')

  const items = useMemo(() => loadAllTemplates(), [])
  const categories = useMemo(() => {
    const s = new Set<string>()
    for (const { template } of items) s.add(template.category)
    return ['all', ...Array.from(s).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return items.filter(({ template }) => {
      if (cat !== 'all' && template.category !== cat) return false
      if (!ql) return true
      const hay = `${template.name} ${template.description} ${template.id}`.toLowerCase()
      return hay.includes(ql)
    })
  }, [items, q, cat])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Template catalog
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Pick a bracket family, tune parameters, preview, and export STL — all offline in your browser.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Search</span>
          <input
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="Name, description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:w-48">
          <span className="font-medium text-slate-700 dark:text-slate-300">Category</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {filtered.map(({ template }) => (
          <li key={template.id}>
            <Link
              to={`/bracket/${template.id}`}
              className="block h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">{template.name}</h2>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {template.category}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
                {template.description}
              </p>
              {template.disabled ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  Disabled: {template.disabledReason ?? 'Unavailable'}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-500">No templates match your filters.</p>
      ) : null}
    </div>
  )
}
