import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Hammer,
  Ruler,
  ShieldCheck,
  Triangle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../components/ui/button";
import { Surface, Stack } from "../../components/ui/surface";
import { Body, Caption, Heading, Subtle } from "../../components/ui/typography";
import {
  buildAngleBracketGeometry,
  defaultAngleBracketParams,
  deriveAngleBracketConstraints,
  normalizeAngleBracketParams,
  summarizeAngleBracket,
  type AngleBracketConstraints,
  type AngleGussetLayout,
  type AngleBracketParams,
} from "../../domain/brackets/angleBracket";
import {
  downloadGeometry,
  type ExportFormat,
} from "../../domain/brackets/exportGeometry";
import {
  buildFlatLBracketGeometry,
  defaultFlatLBracketParams,
  deriveFlatLBracketConstraints,
  getHardware,
  hardwareOptions,
  normalizeFlatLBracketParams,
  summarizeFlatLBracket,
  type FlatLBracketConstraints,
  type FlatLBracketParams,
  type HardwareId,
  type HoleStyle,
} from "../../domain/brackets/flatLBracket";
import { cn } from "../../lib/cn";
import { BracketPreview } from "./BracketPreview";

const steps = [
  { id: "type", label: "Type", icon: Hammer },
  { id: "size", label: "Size", icon: Ruler },
  { id: "hardware", label: "Hardware", icon: ShieldCheck },
  { id: "holes", label: "Holes", icon: CheckCircle2 },
  { id: "gussets", label: "Gussets", icon: Triangle },
  { id: "export", label: "Export", icon: Download },
] as const;

type StepId = (typeof steps)[number]["id"];
type BracketTypeId = "flatL" | "angle";
type SummaryMetric = { label: string; value: string };

export function BracketWizard() {
  const [activeStep, setActiveStep] = useState<StepId>("type");
  const [bracketType, setBracketType] = useState<BracketTypeId>("flatL");
  const [flatParams, setFlatParams] = useState<FlatLBracketParams>(
    defaultFlatLBracketParams,
  );
  const [angleParams, setAngleParams] = useState<AngleBracketParams>(
    defaultAngleBracketParams,
  );
  const safeFlatParams = useMemo(
    () => normalizeFlatLBracketParams(flatParams),
    [flatParams],
  );
  const safeAngleParams = useMemo(
    () => normalizeAngleBracketParams(angleParams),
    [angleParams],
  );
  const flatConstraints = useMemo(
    () => deriveFlatLBracketConstraints(safeFlatParams),
    [safeFlatParams],
  );
  const angleConstraints = useMemo(
    () => deriveAngleBracketConstraints(safeAngleParams),
    [safeAngleParams],
  );
  const flatSummary = useMemo(
    () => summarizeFlatLBracket(safeFlatParams),
    [safeFlatParams],
  );
  const angleSummary = useMemo(
    () => summarizeAngleBracket(safeAngleParams),
    [safeAngleParams],
  );
  const isAngle = bracketType === "angle";
  const geometry = useMemo(
    () =>
      isAngle
        ? buildAngleBracketGeometry(safeAngleParams)
        : buildFlatLBracketGeometry(safeFlatParams),
    [isAngle, safeAngleParams, safeFlatParams],
  );
  const activeStepIndex = steps.findIndex((step) => step.id === activeStep);
  const canGoBack = activeStepIndex > 0;
  const canGoNext = activeStepIndex < steps.length - 1;
  const nextStep = canGoNext ? steps[activeStepIndex + 1] : undefined;
  const bracketName = isAngle ? "Angle Bracket" : "Flat L Bracket";
  const summaryLines = isAngle
    ? angleSummaryLines(safeAngleParams, angleConstraints, angleSummary)
    : flatSummaryLines(safeFlatParams, flatConstraints, flatSummary);

  function updateFlatParam<Key extends keyof FlatLBracketParams>(
    key: Key,
    value: FlatLBracketParams[Key],
  ) {
    setFlatParams((current) =>
      normalizeFlatLBracketParams({ ...current, [key]: value }),
    );
  }

  function updateAngleParam<Key extends keyof AngleBracketParams>(
    key: Key,
    value: AngleBracketParams[Key],
  ) {
    setAngleParams((current) =>
      normalizeAngleBracketParams({ ...current, [key]: value }),
    );
  }

  function exportFile(format: ExportFormat) {
    const fileName = isAngle
      ? "bracketfactory-angle-bracket"
      : "bracketfactory-flat-l-bracket";

    downloadGeometry(geometry, format, fileName);
  }

  function goToStep(index: number) {
    const step = steps[index];

    if (step) {
      setActiveStep(step.id);
    }
  }

  return (
    <div className="min-h-dvh bg-surface-base text-text-primary">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <header className="max-w-4xl">
          <Caption className="uppercase">BracketFactory</Caption>
          <Heading level={1} className="mt-2">
            Parametric 3D-printable brackets
          </Heading>
          <Body className="mt-3 max-w-prose">
            Build constrained flat L and angle brackets. The wizard keeps hole
            spacing, edge clearance, countersinks, gussets, and export geometry
            aligned so the preview and downloads come from the same printable
            solid.
          </Body>
        </header>

        <Surface variant="raised" className="p-4">
          <Stack gap="default">
            <StepRibbon
              activeStep={activeStep}
              canGoBack={canGoBack}
              canGoNext={canGoNext}
              onBack={() => goToStep(activeStepIndex - 1)}
              onNext={() => goToStep(activeStepIndex + 1)}
              onSelect={setActiveStep}
            />

            <section className="grid gap-4 lg:h-wizard-workspace lg:grid-cols-2 lg:grid-rows-[11rem_minmax(0,1fr)_6rem]">
              <Surface
                variant="raised"
                className="overflow-hidden p-0 lg:row-span-3"
              >
                <div className="flex h-full flex-col">
                  <div className="border-b border-border-subtle p-5">
                    <Caption className="uppercase">Parameters</Caption>
                    <Heading level={2} className="mt-2">
                      {stepTitle(activeStep)}
                    </Heading>
                    <Subtle className="mt-2">
                      {stepDescription(activeStep, bracketType)}
                    </Subtle>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <StepPanel
                      activeStep={activeStep}
                      angleConstraints={angleConstraints}
                      angleParams={safeAngleParams}
                      angleSummary={angleSummary}
                      bracketType={bracketType}
                      flatConstraints={flatConstraints}
                      flatParams={safeFlatParams}
                      flatSummary={flatSummary}
                      onSelectBracketType={setBracketType}
                      updateAngleParam={updateAngleParam}
                      updateFlatParam={updateFlatParam}
                    />
                  </div>

                  <div className="border-t border-border-subtle p-4">
                    {nextStep ? (
                      <Button
                        className="w-full"
                        variant="primary"
                        onClick={() => goToStep(activeStepIndex + 1)}
                      >
                        Go to {nextStep.label}
                        <ChevronRight
                          data-icon="inline-end"
                          aria-hidden="true"
                        />
                      </Button>
                    ) : (
                      <Button className="w-full" disabled>
                        Use the export panel
                      </Button>
                    )}
                  </div>
                </div>
              </Surface>

              <SummaryPanel
                bracketName={bracketName}
                lines={summaryLines}
                valid={isAngle ? angleConstraints.valid : flatConstraints.valid}
              />

              <Surface
                variant="sunken"
                className="min-h-80 overflow-hidden p-3 lg:min-h-0"
              >
                <div className="flex h-full flex-col gap-2">
                  <div className="min-h-0 flex-1">
                    <BracketPreview geometry={geometry} />
                  </div>
                  <Subtle className="shrink-0 px-1">
                    Rotate with drag, zoom with scroll, pan with right-drag or
                    two-finger drag.
                  </Subtle>
                </div>
              </Surface>

              <ExportPanel exportFile={exportFile} />
            </section>
          </Stack>
        </Surface>
      </main>
    </div>
  );
}

function StepRibbon({
  activeStep,
  canGoBack,
  canGoNext,
  onBack,
  onNext,
  onSelect,
}: {
  activeStep: StepId;
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onSelect: (step: StepId) => void;
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <nav
      aria-label="Bracket configuration steps"
      className="flex items-center gap-3"
    >
      <Button className="shrink-0" disabled={!canGoBack} onClick={onBack}>
        <ChevronLeft data-icon="inline-start" aria-hidden="true" />
        Back
      </Button>

      <div className="min-w-0 flex-1">
        <div className="mx-auto flex w-full min-w-0 items-center justify-center gap-1">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep;
            const isComplete = index < activeIndex;

            return (
              <div
                key={step.id}
                className="flex min-w-0 flex-1 items-center gap-1"
              >
                <button
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-2 py-2 text-body-sm transition",
                    isActive
                      ? "border-accent-primary bg-surface-overlay text-text-primary"
                      : "border-border-subtle bg-surface-sunken text-text-secondary",
                    isComplete && "border-accent-success text-text-primary",
                  )}
                  type="button"
                  onClick={() => onSelect(step.id)}
                >
                  <Icon data-icon aria-hidden="true" />
                  {step.label}
                </button>
                {index < steps.length - 1 ? (
                  <span
                    className="h-px w-3 shrink-0 bg-border-default"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        className="shrink-0"
        disabled={!canGoNext}
        variant="primary"
        onClick={onNext}
      >
        Next
        <ChevronRight data-icon="inline-end" aria-hidden="true" />
      </Button>
    </nav>
  );
}

type StepPanelProps = {
  activeStep: StepId;
  angleConstraints: AngleBracketConstraints;
  angleParams: AngleBracketParams;
  angleSummary: ReturnType<typeof summarizeAngleBracket>;
  bracketType: BracketTypeId;
  flatConstraints: FlatLBracketConstraints;
  flatParams: FlatLBracketParams;
  flatSummary: ReturnType<typeof summarizeFlatLBracket>;
  onSelectBracketType: (type: BracketTypeId) => void;
  updateAngleParam: <Key extends keyof AngleBracketParams>(
    key: Key,
    value: AngleBracketParams[Key],
  ) => void;
  updateFlatParam: <Key extends keyof FlatLBracketParams>(
    key: Key,
    value: FlatLBracketParams[Key],
  ) => void;
};

function StepPanel({
  activeStep,
  angleConstraints,
  angleParams,
  angleSummary,
  bracketType,
  flatConstraints,
  flatParams,
  flatSummary,
  onSelectBracketType,
  updateAngleParam,
  updateFlatParam,
}: StepPanelProps) {
  if (activeStep === "type") {
    return (
      <Stack>
        <OptionButton
          active={bracketType === "flatL"}
          title="Flat L Bracket"
          description="Flat plate with perpendicular legs and through-face mounting holes."
          onClick={() => onSelectBracketType("flatL")}
        />
        <OptionButton
          active={bracketType === "angle"}
          title="Angle Bracket"
          description="Right-angle bracket with base and upright flanges, safe holes, and gussets."
          onClick={() => onSelectBracketType("angle")}
        />
      </Stack>
    );
  }

  if (bracketType === "angle") {
    return (
      <AngleStepPanel
        activeStep={activeStep}
        constraints={angleConstraints}
        params={angleParams}
        summary={angleSummary}
        updateParam={updateAngleParam}
      />
    );
  }

  return (
    <FlatStepPanel
      activeStep={activeStep}
      constraints={flatConstraints}
      params={flatParams}
      summary={flatSummary}
      updateParam={updateFlatParam}
    />
  );
}

function FlatStepPanel({
  activeStep,
  constraints,
  params,
  summary,
  updateParam,
}: {
  activeStep: StepId;
  constraints: FlatLBracketConstraints;
  params: FlatLBracketParams;
  summary: ReturnType<typeof summarizeFlatLBracket>;
  updateParam: <Key extends keyof FlatLBracketParams>(
    key: Key,
    value: FlatLBracketParams[Key],
  ) => void;
}) {
  if (activeStep === "size") {
    return (
      <Stack>
        <NumberField
          label="Horizontal leg"
          value={params.xLength}
          min={50}
          max={180}
          suffix="mm"
          onChange={(value) => updateParam("xLength", value)}
        />
        <NumberField
          label="Vertical leg"
          value={params.yLength}
          min={50}
          max={180}
          suffix="mm"
          onChange={(value) => updateParam("yLength", value)}
        />
        <NumberField
          label="Leg width"
          value={params.legWidth}
          min={22}
          max={60}
          suffix="mm"
          onChange={(value) => updateParam("legWidth", value)}
        />
        <NumberField
          label="Plate thickness"
          value={params.thickness}
          min={3}
          max={12}
          suffix="mm"
          onChange={(value) => updateParam("thickness", value)}
        />
      </Stack>
    );
  }

  if (activeStep === "hardware") {
    return (
      <HardwarePanel
        constraints={constraints}
        hardware={params.hardware}
        holeStyle={params.holeStyle}
        updateHardware={(value) => updateParam("hardware", value)}
        updateHoleStyle={(value) => updateParam("holeStyle", value)}
      />
    );
  }

  if (activeStep === "holes") {
    return (
      <Stack>
        <NumberField
          label="Horizontal leg holes"
          value={params.xHoles}
          min={1}
          max={constraints.maxXHoles}
          suffix={`max ${constraints.maxXHoles}`}
          onChange={(value) => updateParam("xHoles", value)}
        />
        <NumberField
          label="Vertical leg holes"
          value={params.yHoles}
          min={1}
          max={constraints.maxYHoles}
          suffix={`max ${constraints.maxYHoles}`}
          onChange={(value) => updateParam("yHoles", value)}
        />
        <NumberField
          label="Rows per leg"
          value={params.rows}
          min={1}
          max={constraints.maxRows}
          suffix={`max ${constraints.maxRows}`}
          onChange={(value) => updateParam("rows", value)}
        />
      </Stack>
    );
  }

  if (activeStep === "gussets") {
    return (
      <Stack>
        <Body>
          Flat L brackets are a single flat plate, so gusset ribs are not part
          of this bracket type.
        </Body>
        <Subtle>
          Choose Angle Bracket in the Type step to configure support ribs after
          hole placement.
        </Subtle>
      </Stack>
    );
  }

  return (
    <ExportReview
      body={`This flat L bracket is normalized to ${Math.round(summary.dimensions[0])} by ${Math.round(
        summary.dimensions[1],
      )} by ${Math.round(summary.dimensions[2])} mm with ${constraints.holeCenters.length} safe ${
        params.holeStyle === "countersunk" ? "countersunk" : "clearance"
      } holes for ${getHardware(params.hardware).label}.`}
    />
  );
}

function AngleStepPanel({
  activeStep,
  constraints,
  params,
  summary,
  updateParam,
}: {
  activeStep: StepId;
  constraints: AngleBracketConstraints;
  params: AngleBracketParams;
  summary: ReturnType<typeof summarizeAngleBracket>;
  updateParam: <Key extends keyof AngleBracketParams>(
    key: Key,
    value: AngleBracketParams[Key],
  ) => void;
}) {
  if (activeStep === "size") {
    return (
      <Stack>
        <NumberField
          label="Base flange"
          value={params.baseLength}
          min={50}
          max={180}
          suffix="mm"
          onChange={(value) => updateParam("baseLength", value)}
        />
        <NumberField
          label="Upright flange"
          value={params.uprightHeight}
          min={50}
          max={160}
          suffix="mm"
          onChange={(value) => updateParam("uprightHeight", value)}
        />
        <NumberField
          label="Bracket width"
          value={params.legWidth}
          min={26}
          max={300}
          suffix="mm"
          onChange={(value) => updateParam("legWidth", value)}
        />
        <NumberField
          label="Plate thickness"
          value={params.thickness}
          min={4}
          max={12}
          suffix="mm"
          onChange={(value) => updateParam("thickness", value)}
        />
      </Stack>
    );
  }

  if (activeStep === "hardware") {
    return (
      <HardwarePanel
        constraints={constraints}
        hardware={params.hardware}
        holeStyle={params.holeStyle}
        updateHardware={(value) => updateParam("hardware", value)}
        updateHoleStyle={(value) => updateParam("holeStyle", value)}
      />
    );
  }

  if (activeStep === "holes") {
    return (
      <Stack>
        <NumberField
          label="Base flange holes"
          value={params.baseHoles}
          min={1}
          max={constraints.maxBaseHoles}
          suffix={`max ${constraints.maxBaseHoles}`}
          onChange={(value) => updateParam("baseHoles", value)}
        />
        <NumberField
          label="Upright flange holes"
          value={params.uprightHoles}
          min={1}
          max={constraints.maxUprightHoles}
          suffix={`max ${constraints.maxUprightHoles}`}
          onChange={(value) => updateParam("uprightHoles", value)}
        />
        <NumberField
          label="Rows per face"
          value={params.rows}
          min={1}
          max={constraints.maxRows}
          suffix={`max ${constraints.maxRows}`}
          onChange={(value) => updateParam("rows", value)}
        />
      </Stack>
    );
  }

  if (activeStep === "gussets") {
    return (
      <AngleGussetPanel
        constraints={constraints}
        params={params}
        updateGussetLayout={(value) => updateParam("gussetLayout", value)}
        updateGussetSize={(value) => updateParam("gussetSizePercent", value)}
      />
    );
  }

  return (
    <ExportReview
      body={`This angle bracket is normalized to ${Math.round(summary.dimensions[0])} by ${Math.round(
        summary.dimensions[1],
      )} by ${Math.round(summary.dimensions[2])} mm with ${constraints.holeCenters.length} safe ${
        params.holeStyle === "countersunk" ? "countersunk" : "clearance"
      } holes, ${constraints.selectedGussetOption.label.toLowerCase()}, and ${
        getHardware(params.hardware).label
      } hardware. Gusset ribs extend ${params.gussetSizePercent}% along each face when enabled.`}
    />
  );
}

function AngleGussetPanel({
  constraints,
  params,
  updateGussetLayout,
  updateGussetSize,
}: {
  constraints: AngleBracketConstraints;
  params: AngleBracketParams;
  updateGussetLayout: (value: AngleGussetLayout) => void;
  updateGussetSize: (value: number) => void;
}) {
  return (
    <Stack gap="loose">
      <Body>
        Gussets are chosen after hole layout so blocked rib paths are already
        known. Available layouts keep ribs out of the protected hole bands.
      </Body>
      <div className="grid gap-3 sm:grid-cols-2">
        {constraints.gussetOptions.map((option) => (
          <OptionButton
            key={option.id}
            active={params.gussetLayout === option.id}
            disabled={!option.available}
            title={option.label}
            description={
              option.available
                ? option.description
                : (option.blockedReason ?? "Blocked by the current hole rows.")
            }
            onClick={() => updateGussetLayout(option.id)}
          />
        ))}
      </div>
      <NumberField
        label="Gusset face coverage"
        value={params.gussetSizePercent}
        min={25}
        max={100}
        suffix="% of face length"
        onChange={updateGussetSize}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryLine
          label="Available layouts"
          value={`${constraints.gussetOptions.filter((option) => option.available).length} of ${
            constraints.gussetOptions.length
          }`}
        />
        <SummaryLine
          label="Chosen layout"
          value={
            constraints.selectedGussetOption.ribCount === 0
              ? "No ribs"
              : `${constraints.selectedGussetOption.label}, ${params.gussetSizePercent}%`
          }
        />
      </div>
    </Stack>
  );
}

type HardwareConstraints = {
  countersinkAvailable: boolean;
  countersinkDepth: number;
};

function HardwarePanel({
  constraints,
  hardware,
  holeStyle,
  updateHardware,
  updateHoleStyle,
}: {
  constraints: HardwareConstraints;
  hardware: HardwareId;
  holeStyle: HoleStyle;
  updateHardware: (value: HardwareId) => void;
  updateHoleStyle: (value: HoleStyle) => void;
}) {
  const selectedHardware = getHardware(hardware);

  return (
    <Stack gap="loose">
      <SelectField
        label="Mounting hardware"
        value={hardware}
        onChange={(value) => updateHardware(value as HardwareId)}
        options={hardwareOptions.map((option) => ({
          label: option.label,
          value: option.id,
        }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryLine
          label="Clearance"
          value={`${selectedHardware.holeDiameter} mm`}
        />
        <SummaryLine
          label="Head diameter"
          value={`${selectedHardware.headDiameter} mm`}
        />
      </div>
      <Stack>
        <Caption>Hole finish</Caption>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionButton
            active={holeStyle === "through"}
            title="Through"
            description="Straight clearance holes."
            onClick={() => updateHoleStyle("through")}
          />
          <OptionButton
            active={holeStyle === "countersunk"}
            disabled={!constraints.countersinkAvailable}
            title="Countersunk"
            description={
              constraints.countersinkAvailable
                ? `${constraints.countersinkDepth} mm seat for flat-head fasteners.`
                : "Increase plate thickness."
            }
            onClick={() => updateHoleStyle("countersunk")}
          />
        </div>
      </Stack>
    </Stack>
  );
}

function ExportReview({ body }: { body: string }) {
  return (
    <Stack>
      <Body>{body}</Body>
      <Subtle>
        STL is broadly compatible. 3MF preserves print units and is usually the
        better slicer handoff.
      </Subtle>
    </Stack>
  );
}

function SummaryPanel({
  bracketName,
  lines,
  valid,
}: {
  bracketName: string;
  lines: SummaryMetric[];
  valid: boolean;
}) {
  return (
    <Surface variant="raised" className="h-full overflow-hidden p-4">
      <Stack gap="tight" className="h-full justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Heading level={3}>Current bracket</Heading>
            <Subtle className="mt-1">{bracketName}</Subtle>
          </div>
          <CheckCircle2
            className={valid ? "text-accent-success" : "text-accent-warning"}
            data-icon
            aria-label={
              valid
                ? "All constraints satisfied"
                : "Some constraints were normalized"
            }
          />
        </div>

        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {lines.map((line) => (
            <DenseSummaryLine
              key={line.label}
              label={line.label}
              value={line.value}
            />
          ))}
        </dl>
      </Stack>
    </Surface>
  );
}

function ExportPanel({
  exportFile,
}: {
  exportFile: (format: ExportFormat) => void;
}) {
  return (
    <Surface variant="raised" className="h-full p-4">
      <div className="flex h-full items-center justify-between gap-4">
        <div>
          <Heading level={3}>Export</Heading>
          <Subtle className="mt-1">
            Download the generated solid for slicing.
          </Subtle>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button
            aria-label="Download STL"
            variant="primary"
            onClick={() => exportFile("stl")}
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            STL
          </Button>
          <Button aria-label="Download 3MF" onClick={() => exportFile("3mf")}>
            <Download data-icon="inline-start" aria-hidden="true" />
            3MF
          </Button>
        </div>
      </div>
    </Surface>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-3">
        <Caption>{label}</Caption>
        <Caption>{suffix}</Caption>
      </span>
      <input
        className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary"
        max={max}
        min={min}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        aria-label={`${label} slider`}
        max={max}
        min={min}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <Caption>{label}</Caption>
      <select
        className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function OptionButton({
  active = false,
  description,
  disabled = false,
  onClick,
  title,
}: {
  active?: boolean;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
  title: string;
}) {
  return (
    <button
      className={cn(
        "rounded-md border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-accent-primary bg-surface-overlay"
          : "border-border-subtle bg-surface-sunken",
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="block text-body text-text-primary">{title}</span>
      <span className="block text-body-sm text-text-secondary">
        {description}
      </span>
    </button>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-sunken px-3 py-2">
      <Caption>{label}</Caption>
      <div className="mt-1 text-body-sm text-text-primary">{value}</div>
    </div>
  );
}

function DenseSummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border-subtle py-1">
      <dt className="text-caption text-text-subtle">{label}</dt>
      <dd className="text-body-sm text-text-primary">{value}</dd>
    </div>
  );
}

function flatSummaryLines(
  params: FlatLBracketParams,
  constraints: FlatLBracketConstraints,
  summary: ReturnType<typeof summarizeFlatLBracket>,
): SummaryMetric[] {
  return [
    {
      label: "Size",
      value: `${params.xLength} x ${params.yLength} x ${params.thickness} mm`,
    },
    { label: "Hardware", value: getHardware(params.hardware).label },
    {
      label: "Holes",
      value: `${constraints.holeCenters.length} ${
        params.holeStyle === "countersunk" ? "countersunk" : "through"
      }`,
    },
    { label: "Clearance", value: `${constraints.edgeClearance} mm edge` },
    { label: "Pitch", value: `${constraints.minPitch} mm min` },
    { label: "Volume", value: `${Math.round(summary.volume / 1000)} cm3` },
  ];
}

function angleSummaryLines(
  params: AngleBracketParams,
  constraints: AngleBracketConstraints,
  summary: ReturnType<typeof summarizeAngleBracket>,
): SummaryMetric[] {
  return [
    {
      label: "Size",
      value: `${params.baseLength} x ${params.legWidth} x ${params.uprightHeight} mm`,
    },
    { label: "Hardware", value: getHardware(params.hardware).label },
    {
      label: "Holes",
      value: `${constraints.holeCenters.length} ${
        params.holeStyle === "countersunk" ? "countersunk" : "through"
      }`,
    },
    {
      label: "Gussets",
      value:
        constraints.selectedGussetOption.ribCount === 0
          ? "No ribs"
          : `${constraints.selectedGussetOption.label}, ${params.gussetSizePercent}%`,
    },
    { label: "Clearance", value: `${constraints.edgeClearance} mm edge` },
    { label: "Volume", value: `${Math.round(summary.volume / 1000)} cm3` },
  ];
}

function stepTitle(step: StepId) {
  const titles: Record<StepId, string> = {
    type: "Choose the bracket",
    size: "Set the envelope",
    hardware: "Select hardware",
    holes: "Place safe holes",
    gussets: "Configure gussets",
    export: "Review and download",
  };

  return titles[step];
}

function stepDescription(step: StepId, bracketType: BracketTypeId) {
  if (step === "type") {
    return "Choose the bracket family before setting the dimensions and mounting rules.";
  }

  const bracketLabel =
    bracketType === "angle" ? "angle bracket" : "flat L bracket";
  const descriptions: Record<Exclude<StepId, "type">, string> = {
    size: `Overall dimensions drive every later safety limit for this ${bracketLabel}.`,
    hardware:
      "Pick the fastener size and whether the hole is straight or countersunk.",
    holes:
      bracketType === "angle"
        ? "Hole counts and row layout are capped by the chosen size and hardware."
        : "Counts are capped by the chosen size, hardware, and countersink footprint.",
    gussets:
      bracketType === "angle"
        ? "Gusset layouts are filtered after hole rows are known."
        : "Flat L brackets do not use gusset ribs.",
    export:
      "The generated solid is built locally from the same parameters shown here.",
  };

  return descriptions[step];
}
