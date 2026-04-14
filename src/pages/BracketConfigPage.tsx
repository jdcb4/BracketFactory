import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PreviewViewport } from '../components/PreviewViewport'
import { generateFromStrategy, type ParamRecord } from '../generators/registry'
import { geom3ToStlBlob } from '../geometry/stlExport'
import { getTemplateById } from '../registry/loadTemplates'
import { defaultParamsFromTemplate } from '../utils/params'
import {
  computeCustomHoleRangeFinding,
  computeParamRangeFindings,
  runBracketChecks,
} from '../validation/bracketChecks'
import type { ProcessId } from '../data/processes'
import { PROCESS_PRESETS } from '../data/processes'
import { MOUNTING_BOLT_SELECT_OPTIONS, resolveClearanceHoleDiameterMm } from '../data/mountingHardware'
import type { BracketTemplate, ParameterGroup } from '../types/template'
import { maxHoleRowsAlongWidth } from '../geometry/holeLayout'

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

/** UI-only fields merged with template defaults (not in every JSON file). */
function mergeFormDefaults(template: BracketTemplate): Record<string, unknown> {
  return {
    ...defaultParamsFromTemplate(template),
    processId: 'fdm_pla_abs' as ProcessId,
    mountingBolt: 'M5',
  }
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

/** One accordion section: only one should be open at a time (parent controls `open`). */
function AccordionPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-slate-800 dark:text-slate-200"
      >
        {title}
        <span
          className={`text-xs font-normal text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-2 dark:border-slate-800">{children}</div>
      ) : null}
    </div>
  )
}

function BracketConfigurator({ template }: { template: BracketTemplate }) {
  const location = useLocation()
  const defaults = useMemo(() => mergeFormDefaults(template), [template])

  const form = useForm<Record<string, unknown>>({
    defaultValues: defaults,
    mode: 'onChange',
  })

  const watched = form.watch() as Record<string, unknown>

  const { geometry, geomError } = useMemo((): { geometry: Geom3 | null; geomError: string | null } => {
    if (!template.generationStrategy || template.disabled) return { geometry: null, geomError: null }
    try {
      const params: ParamRecord = { ...watched } as ParamRecord
      delete (params as Record<string, unknown>).processId
      return { geometry: generateFromStrategy(template.generationStrategy, params), geomError: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { geometry: null, geomError: msg }
    }
  }, [template, watched])

  const processId = (watched['processId'] ?? 'fdm_pla_abs') as ProcessId
  const thickness = Number(
    watched['thickness'] ??
      watched['legThickness'] ??
      watched['strapThickness'] ??
      watched['boardThickness'] ??
      3,
  )
  const mountingBolt = String(watched['mountingBolt'] ?? 'M5')
  const customHoleDiameterMm = Number(watched['holeDiameter'] ?? watched['mountHoleDiameter'] ?? 4.5)
  const effectiveHoleD = resolveClearanceHoleDiameterMm(mountingBolt, customHoleDiameterMm)

  const visibleParams = useMemo(() => {
    let list = template.parameters
    const gusseted = watched['gusseted'] === true
    const slotted = watched['slottedHoles'] === true || watched['slottedWallHoles'] === true
    if (template.id === 'l-bracket' && !gusseted) {
      list = list.filter((p) => !['gussetHeight', 'gussetThickness', 'gussetCount'].includes(p.key))
    }
    if (!slotted) {
      list = list.filter((p) => p.key !== 'slotOversizeMm')
    }
    return list
  }, [template, watched])

  const hasHoles = visibleParams.some((p) => p.key === 'holeDiameter' || p.key === 'mountHoleDiameter')

  const paramsSansHole = visibleParams.filter((p) => p.key !== 'holeDiameter' && p.key !== 'mountHoleDiameter')

  const customHoleParam = useMemo(
    () => template.parameters.find((p) => p.key === 'holeDiameter' || p.key === 'mountHoleDiameter'),
    [template],
  )

  const paramsByGroup = GROUP_ORDER.map((g) => ({
    group: g,
    params: paramsSansHole.filter((p) => p.group === g && !p.advanced),
  })).filter((x) => x.params.length > 0)

  const advancedParams = paramsSansHole.filter((p) => p.advanced)

  const [toast, setToast] = useState<string | null>(null)

  /** Exclusive accordion: opening one section closes another; click again to collapse. */
  const [openSection, setOpenSection] = useState<string | null>('process')
  function toggleSection(id: string) {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  /** Re-entering the same bracket route (new `location.key`) restores factory defaults — matches bookmark/share expectations. */
  useEffect(() => {
    form.reset(mergeFormDefaults(template))
    const firstGroup = GROUP_ORDER.find((g) =>
      template.parameters.some(
        (p) => p.group === g && !p.advanced && p.key !== 'holeDiameter' && p.key !== 'mountHoleDiameter',
      ),
    )
    setOpenSection(firstGroup ? `group-${firstGroup}` : hasHoles ? 'bolt' : 'process')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: remount defaults + same-route navigation via location.key
  }, [location.key, template])

  const findings = useMemo(() => {
    const eo = Number(watched['edgeOffset'] ?? 0)
    const base = runBracketChecks({
      processId,
      templateId: template.id,
      wallThicknessMm: thickness,
      bridgeSpanMm: undefined,
      holeDiameterMm: effectiveHoleD || undefined,
      holeEdgeDistanceMm: eo || undefined,
      flangeLengthMm:
        Number(watched['leftFlangeHeight'] ?? watched['leg1Length'] ?? 0) || undefined,
      innerBendRadiusMm:
        template.id === 'l-bracket' ? Number(watched['innerBendRadius'] ?? 0) : undefined,
      leg1LengthMm: template.id === 'l-bracket' ? Number(watched['leg1Length'] ?? 0) : undefined,
      leg2LengthMm: template.id === 'l-bracket' ? Number(watched['leg2Length'] ?? 0) : undefined,
      leftFlangeHeightMm:
        template.id === 'u-channel' ? Number(watched['leftFlangeHeight'] ?? 0) : undefined,
      rightFlangeHeightMm:
        template.id === 'u-channel' ? Number(watched['rightFlangeHeight'] ?? 0) : undefined,
    })
    const rangeFromTemplate = computeParamRangeFindings(visibleParams, watched)
    const customHoleRange = computeCustomHoleRangeFinding(mountingBolt, customHoleDiameterMm)
    return [...base, ...rangeFromTemplate, ...customHoleRange]
  }, [watched, processId, thickness, effectiveHoleD, template.id, visibleParams, mountingBolt, customHoleDiameterMm])

  const errorFindings = useMemo(() => findings.filter((f) => f.severity === 'error'), [findings])
  const warningFindings = useMemo(() => findings.filter((f) => f.severity !== 'error'), [findings])
  const hasBlockingIssues = Boolean(geomError) || errorFindings.length > 0
  const hasWarningsOnly = warningFindings.length > 0 && !hasBlockingIssues

  function downloadStl(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!geometry || hasBlockingIssues) return
    if (hasWarningsOnly) {
      const ok = window.confirm(
        'This configuration has printability warnings. Download STL anyway?',
      )
      if (!ok) return
    }
    const blob = geom3ToStlBlob(geometry)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${template.id}.stl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function resetToDefaults() {
    form.reset(mergeFormDefaults(template))
  }

  const processHelp = PROCESS_PRESETS.find((p) => p.id === processId)

  /** Angle bracket: generator caps rows across width — show what actually gets meshed. */
  const lBracketHoleRowInfo = useMemo(() => {
    if (template.id !== 'l-bracket') return null
    const requested = Math.max(1, Math.round(Number(watched.holeRows ?? 1)))
    const w = Number(watched.width ?? 20)
    const eo = Number(watched.edgeOffset ?? 6)
    const minClr = Number(watched.minHoleEdgeClearance ?? 2)
    const maxR = maxHoleRowsAlongWidth(w, effectiveHoleD, eo, minClr)
    const effective = Math.max(1, Math.min(requested, maxR))
    return { requested, effective, maxR }
  }, [template.id, watched, effectiveHoleD])

  return (
    <div className="space-y-4" data-bracket-page={template.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <Link className="text-sm text-slate-600 underline dark:text-slate-400" to="/">
            ← Catalog
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{template.name}</h1>
          <p className="mt-1 max-w-3xl text-slate-600 dark:text-slate-400">{template.description}</p>
          {template.alternativeNames ? (
            <p className="mt-1 text-xs text-slate-500">Also known as: {template.alternativeNames}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            v{template.version} · {template.units}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Reset defaults
          </button>
          <button
            type="button"
            data-testid="download-stl"
            onClick={downloadStl}
            disabled={!geometry || hasBlockingIssues}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            Download STL
          </button>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 max-h-[min(70vh,520px)] max-w-md overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {toast}
          <button type="button" className="ml-2 text-slate-500 underline" onClick={() => setToast(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {geomError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Geometry error: {geomError}
        </p>
      ) : null}

      {errorFindings.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {errorFindings.map((f) => (
            <li key={f.code}>
              [{f.severity}] {f.message}
            </li>
          ))}
        </ul>
      ) : null}

      {warningFindings.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {warningFindings.map((f) => (
            <li key={f.code}>
              [{f.severity}] {f.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
        <div className="min-h-0 min-w-0 w-full">
          <PreviewViewport
            geometry={geometry}
            cameraPosition={template.preview.cameraPosition}
            target={template.preview.target}
            className="h-[min(72vh,560px)] min-h-[280px] w-full max-lg:min-h-[240px] max-lg:max-h-[min(50vh,420px)] lg:min-h-[420px]"
          />
          <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
            Drag on the preview to rotate. Scroll wheel does not zoom (by design).
          </p>
        </div>

        <aside className="flex min-h-0 min-w-0 w-full max-w-full flex-col lg:sticky lg:top-4 lg:max-h-[min(85vh,720px)]">
          <form
            key={template.id}
            className="max-h-[min(85vh,720px)] space-y-2 overflow-y-auto overscroll-contain pr-1"
            onSubmit={(e) => e.preventDefault()}
          >
          {hasHoles ? (
            <AccordionPanel
              title="Bolt & clearance hole"
              open={openSection === 'bolt'}
              onToggle={() => toggleSection('bolt')}
            >
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Bolt / screw size</span>
                <span className="text-xs text-slate-500">
                  Picks a typical clearance hole diameter. Choose Custom to type an exact mm value.
                </span>
                <select
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
                  {...form.register('mountingBolt')}
                >
                  {MOUNTING_BOLT_SELECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              {mountingBolt === 'custom' && customHoleParam ? (
                <ParameterField
                  param={customHoleParam}
                  register={form.register}
                  errors={form.formState.errors}
                />
              ) : mountingBolt === 'custom' ? (
                <ParameterField
                  param={{
                    key: 'holeDiameter',
                    label: 'Custom hole diameter',
                    description: 'Through-hole diameter in mm when not using a preset.',
                    type: 'number',
                    default: 4.5,
                    min: 2,
                    max: 20,
                    step: 0.1,
                    group: 'hardware',
                    unit: 'mm',
                  }}
                  register={form.register}
                  errors={form.formState.errors}
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Effective hole diameter: <strong>{effectiveHoleD.toFixed(2)} mm</strong> (clearance for {mountingBolt})
                </p>
              )}
            </AccordionPanel>
          ) : null}

          {paramsByGroup.map(({ group, params }) => (
            <AccordionPanel
              key={group}
              title={GROUP_LABEL[group]}
              open={openSection === `group-${group}`}
              onToggle={() => toggleSection(`group-${group}`)}
            >
              {params.map((p) => (
                <div key={p.key} className="space-y-1">
                  <ParameterField param={p} register={form.register} errors={form.formState.errors} />
                  {template.id === 'l-bracket' && p.key === 'holeRows' && lBracketHoleRowInfo ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Effective hole rows used: <strong>{lBracketHoleRowInfo.effective}</strong>
                      {lBracketHoleRowInfo.requested > lBracketHoleRowInfo.effective
                        ? ` (you asked for ${lBracketHoleRowInfo.requested}; this width fits at most ${lBracketHoleRowInfo.maxR}).`
                        : ` (at most ${lBracketHoleRowInfo.maxR} fit across this width).`}
                    </p>
                  ) : null}
                </div>
              ))}
            </AccordionPanel>
          ))}

          {advancedParams.length > 0 ? (
            <AccordionPanel
              title="Advanced & fine tuning"
              open={openSection === 'advanced'}
              onToggle={() => toggleSection('advanced')}
            >
              {advancedParams.map((p) => (
                <ParameterField key={p.key} param={p} register={form.register} errors={form.formState.errors} />
              ))}
            </AccordionPanel>
          ) : null}

          <AccordionPanel
            title="Process preset (validation only)"
            open={openSection === 'process'}
            onToggle={() => toggleSection('process')}
          >
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This does <strong>not</strong> change the STL mesh. It tunes warnings (wall thickness, etc.) for
              your manufacturing process.
            </p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Preset</span>
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
            {processHelp ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">{processHelp.help}</p>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">About all presets:</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Show process preset reference (all presets)"
                title="Process preset reference"
                onClick={() =>
                  setToast(
                    PROCESS_PRESETS.map((pr) => `${pr.label}\n${pr.help}\nNotes: ${pr.notes}`).join(
                      '\n\n────────\n\n',
                    ),
                  )
                }
              >
                <span className="text-sm font-semibold leading-none" aria-hidden>
                  ⓘ
                </span>
              </button>
            </div>
          </AccordionPanel>
        </form>
        </aside>
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
        {param.description ? <span className="text-xs text-slate-500">{param.description}</span> : null}
        <select
          className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          {...register(param.key)}
        >
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

  if (param.type === 'boolean') {
    return (
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...register(param.key)} />
        <span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{param.label}</span>
          {param.description ? (
            <span className="mt-0.5 block text-xs text-slate-500">{param.description}</span>
          ) : null}
        </span>
      </label>
    )
  }

  const inputType = param.type === 'integer' ? 'number' : 'number'
  const step = param.step ?? (param.type === 'integer' ? 1 : 0.1)
  const reservedOuterFillet = param.key === 'outerFilletRadius'

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-700 dark:text-slate-300">{param.label}</span>
      {param.description ? <span className="text-xs text-slate-500">{param.description}</span> : null}
      <input
        type={inputType}
        step={step}
        min={param.min}
        max={param.max}
        disabled={reservedOuterFillet}
        title={
          reservedOuterFillet
            ? 'Reserved for a future release; the mesh still uses sharp outer corners.'
            : undefined
        }
        className={`rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900 ${reservedOuterFillet ? 'cursor-not-allowed opacity-60' : ''}`}
        {...register(param.key, {
          valueAsNumber: param.type === 'number' || param.type === 'integer',
        })}
      />
      <span className="text-xs text-slate-500">
        {param.unit ? `${param.unit}` : ''}
        {param.min !== undefined && param.max !== undefined ? ` · ${param.min}–${param.max}` : ''}
      </span>
      {err ? <span className="text-xs text-red-600">{String(err)}</span> : null}
    </label>
  )
}
