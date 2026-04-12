import { useMemo } from 'react'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PreviewViewport } from '../components/PreviewViewport'
import { generateFromStrategy, type ParamRecord } from '../generators/registry'
import { geom3ToStlBlob } from '../geometry/stlExport'
import { getTemplateById } from '../registry/loadTemplates'
import { defaultParamsFromTemplate } from '../utils/params'
import { runBracketChecks } from '../validation/bracketChecks'
import type { ProcessId } from '../data/processes'
import { PROCESS_PRESETS } from '../data/processes'
import type { BracketTemplate, ParameterGroup } from '../types/template'

const GROUP_ORDER: ParameterGroup[] = [
  'dimensions',
  'hardware',
  'reinforcement',
  'fit',
  'print',
  'advanced',
]

const GROUP_LABEL: Record<ParameterGroup, string> = {
  dimensions: 'Dimensions',
  hardware: 'Mounting & hardware',
  reinforcement: 'Reinforcement',
  fit: 'Fit & tolerances',
  print: 'Printer & material',
  advanced: 'Advanced',
}

/**
 * Route shell: resolve template first; all form/preview hooks live in BracketConfigurator only.
 */
export function BracketConfigPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const template = templateId ? getTemplateById(templateId) : undefined

  if (!template) {
    return (
      <div
        data-testid="template-not-found"
        className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <p>Template not found (id: {String(templateId)}).</p>
        <Link className="mt-2 inline-block text-slate-700 underline dark:text-slate-300" to="/">
          Back to catalog
        </Link>
      </div>
    )
  }

  if (template.disabled) {
    return (
      <div className="space-y-4">
        <Link className="text-sm text-slate-600 underline dark:text-slate-400" to="/">
          ← Catalog
        </Link>
        <p className="text-amber-800 dark:text-amber-300">
          This template is disabled: {template.disabledReason ?? 'See docs/todo.md'}
        </p>
      </div>
    )
  }

  return <BracketConfigurator key={template.id} template={template} />
}

function BracketConfigurator({ template }: { template: BracketTemplate }) {
  const defaults = useMemo(
    () => ({
      ...defaultParamsFromTemplate(template),
      processId: 'fdm_pla_abs' as ProcessId,
      showAdvanced: false,
    }),
    [template],
  )

  const form = useForm<Record<string, unknown>>({
    defaultValues: defaults,
  })

  /* eslint-disable-next-line react-hooks/incompatible-library -- RHF watch drives live preview */
  const watched = form.watch() as Record<string, unknown>

  // Pure memo: never call setState here (that caused React #301 in production).
  const { geometry, geomError } = useMemo((): { geometry: Geom3 | null; geomError: string | null } => {
    if (!template.generationStrategy || template.disabled) return { geometry: null, geomError: null }
    try {
      const params: ParamRecord = { ...watched } as ParamRecord
      delete (params as Record<string, unknown>).processId
      delete (params as Record<string, unknown>).showAdvanced
      return { geometry: generateFromStrategy(template.generationStrategy, params), geomError: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { geometry: null, geomError: msg }
    }
  }, [template, watched])

  const processId = (watched['processId'] ?? 'fdm_pla_abs') as ProcessId
  const thickness = Number(watched['thickness'] ?? 3)

  const findings = useMemo(() => {
    const hd = Number(watched['holeDiameter'] ?? 0)
    const eo = Number(watched['edgeOffset'] ?? 0)
    return runBracketChecks({
      processId,
      wallThicknessMm: thickness,
      bridgeSpanMm: undefined,
      holeDiameterMm: hd || undefined,
      holeEdgeDistanceMm: eo || undefined,
      flangeLengthMm:
        Number(watched['leftFlangeHeight'] ?? watched['leg1Length'] ?? 0) || undefined,
    })
  }, [watched, processId, thickness])

  function downloadStl() {
    if (!geometry) return
    const blob = geom3ToStlBlob(geometry)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.id}.stl`
    a.click()
    URL.revokeObjectURL(url)
  }

  const showAdvanced = Boolean(watched['showAdvanced'])
  const paramsByGroup = GROUP_ORDER.map((g) => ({
    group: g,
    params: template.parameters.filter((p) => p.group === g && (!p.advanced || showAdvanced)),
  })).filter((x) => x.params.length > 0)

  return (
    <div className="space-y-4" data-bracket-page={template.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link className="text-sm text-slate-600 underline dark:text-slate-400" to="/">
            ← Catalog
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{template.name}</h1>
          <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">{template.description}</p>
          <p className="mt-1 text-xs text-slate-500">
            v{template.version} · {template.units} · strategy{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{template.generationStrategy}</code>
          </p>
        </div>
        <button
          type="button"
          data-testid="download-stl"
          onClick={downloadStl}
          disabled={!geometry}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
        >
          Download STL
        </button>
      </div>

      {geomError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Geometry error: {geomError}
        </p>
      ) : null}

      {findings.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {findings.map((f) => (
            <li key={f.code}>
              [{f.severity}] {f.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PreviewViewport
          geometry={geometry}
          cameraPosition={template.preview.cameraPosition}
          target={template.preview.target}
          className="min-h-[420px] lg:min-h-[520px]"
        />

        <form key={template.id} className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Process preset</span>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              {...form.register('processId')}
            >
              {PROCESS_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('showAdvanced')} />
            <span>Show advanced parameters</span>
          </label>

          {paramsByGroup.map(({ group, params }) => (
            <fieldset key={group} className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <legend className="px-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                {GROUP_LABEL[group]}
              </legend>
              {params.map((p) => (
                <ParameterField key={p.key} param={p} register={form.register} errors={form.formState.errors} />
              ))}
            </fieldset>
          ))}
        </form>
      </div>
    </div>
  )
}

function ParameterField({
  param,
  register,
  errors,
}: {
  param: BracketTemplate['parameters'][number]
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register']
  errors: Record<string, { message?: string } | undefined>
}) {
  const err = errors[param.key]?.message
  if (param.type === 'select' && param.options) {
    return (
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-700 dark:text-slate-300">{param.label}</span>
        <select className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900" {...register(param.key)}>
          {param.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {param.unit ? <span className="text-xs text-slate-500">{param.unit}</span> : null}
        {err ? <span className="text-xs text-red-600">{String(err)}</span> : null}
      </label>
    )
  }

  const inputType = param.type === 'integer' ? 'number' : 'number'
  const step = param.step ?? (param.type === 'integer' ? 1 : 0.1)

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700 dark:text-slate-300">{param.label}</span>
      <input
        type={inputType}
        step={step}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
        {...register(param.key, {
          valueAsNumber: param.type === 'number' || param.type === 'integer',
        })}
      />
      <span className="text-xs text-slate-500">
        {param.unit ? `${param.unit}` : ''}
        {param.min !== undefined && param.max !== undefined
          ? ` · ${param.min}–${param.max}`
          : ''}
      </span>
      {err ? <span className="text-xs text-red-600">{String(err)}</span> : null}
    </label>
  )
}
