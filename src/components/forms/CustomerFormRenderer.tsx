"use client";

import { useEffect, useRef, useState } from "react";
import {
  correctionCategories,
  correctionPriorities,
  createEmptyCorrection,
  type CorrectionItem,
  type CustomerFormDefinition,
  type FormField,
} from "@/data/customerForms";
import { emptyFormValues, validateFormValues } from "@/lib/form-validation";
import {
  FieldShell,
  FormProgress,
  fieldControlClass,
} from "./FormFieldPrimitives";
import { StatusBanner, primaryButtonClass, secondaryButtonClass } from "@/components/ui/FormStatus";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;
type SaveState = "idle" | "saving" | "saved" | "unsaved" | "offline" | "conflict";

type SubmissionView = {
  referenceNumber: string;
  submittedAt: string;
  version: number;
  schemaVersion: number;
  values: Values;
} | null;

export function CustomerFormRenderer({
  form,
  projectId,
  initialValues,
  initialStep,
  initialRevision,
  submission,
  correction,
}: {
  form: CustomerFormDefinition;
  projectId: string;
  initialValues: Values;
  initialStep: number;
  initialRevision: number;
  submission?: SubmissionView;
  correction?: {
    submittedCount: number;
    maxRounds: number;
    canStartNextRound: boolean;
    locked: boolean;
  };
}) {
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [values, setValues] = useState<Values>(() => ({
    ...emptyFormValues(form),
    ...initialValues,
  }));
  const [revision, setRevision] = useState(initialRevision);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<SubmissionView>(submission ?? null);
  const [startingRound, setStartingRound] = useState(false);
  const [correctionState, setCorrectionState] = useState(correction);
  const saveTimer = useRef<number | null>(null);
  const idempotency = useRef(crypto.randomUUID());

  const step = form.steps[stepIndex];
  const isSummary = step.kind === "summary";
  const isCorrections = step.kind === "corrections";
  const canStartNextRound = Boolean(correctionState?.canStartNextRound);
  const readOnly =
    Boolean(correctionState?.locked) ||
    (Boolean(done) && form.id !== "korrekturen") ||
    canStartNextRound;

  const persist = async (nextValues: Values, nextStep: number, nextRevision: number) => {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/forms/${form.slug}/draft`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          values: nextValues,
          stepIndex: nextStep,
          expectedRevision: nextRevision,
        }),
      });
      const data = (await response.json()) as { revision?: number; error?: string };
      if (response.status === 409) {
        setSaveState("conflict");
        setStatusMessage(data.error || "Speicherkonflikt. Bitte Seite neu laden.");
        return;
      }
      if (!response.ok) throw new Error("save");
      setRevision(data.revision ?? nextRevision + 1);
      setSaveState("saved");
    } catch {
      setSaveState("offline");
    }
  };

  useEffect(() => {
    if (readOnly) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist(values, stepIndex, revision);
    }, 1200);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, stepIndex]);

  const setValue = (name: string, value: unknown) => {
    setSaveState("unsaved");
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateStep = () => {
    const nextErrors = validateFormValues(form, values, "step", stepIndex);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStepIndex((i) => Math.min(i + 1, form.steps.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setStatusMessage(null);
    const allErrors = validateFormValues(form, values, "all");
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setSubmitting(false);
      setStatusMessage("Bitte prüfen Sie Ihre Angaben vor der Abgabe.");
      return;
    }
    try {
      const response = await fetch(`/api/forms/${form.slug}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          values,
          idempotencyKey: idempotency.current,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        referenceNumber?: string;
        submittedAt?: string;
        version?: number;
      };
      if (!response.ok) {
        setStatusMessage(data.error || "Abgabe nicht möglich.");
        setSubmitting(false);
        return;
      }
      setDone({
        referenceNumber: data.referenceNumber ?? "",
        submittedAt: data.submittedAt ?? new Date().toISOString(),
        version: data.version ?? 1,
        schemaVersion: form.schemaVersion,
        values,
      });
      if (form.id === "korrekturen") {
        const submittedCount = (correctionState?.submittedCount ?? 0) + 1;
        const maxRounds = correctionState?.maxRounds ?? 1;
        setCorrectionState({
          submittedCount,
          maxRounds,
          canStartNextRound: submittedCount < maxRounds,
          locked: submittedCount >= maxRounds,
        });
      }
      setSaveState("saved");
    } catch {
      setStatusMessage("Verbindung unterbrochen. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  };

  const startNextRound = async () => {
    setStartingRound(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/forms/${form.slug}/correction-round`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await response.json()) as { error?: string; revision?: number };
      if (!response.ok) {
        setStatusMessage(data.error || "Die Korrekturrunde konnte nicht gestartet werden.");
        return;
      }
      setDone(null);
      setValues(emptyFormValues(form));
      setStepIndex(0);
      setRevision(data.revision ?? 1);
      setErrors({});
      idempotency.current = crypto.randomUUID();
      setCorrectionState((prev) =>
        prev ? { ...prev, canStartNextRound: false, locked: false } : prev,
      );
      setSaveState("saved");
    } catch {
      setStatusMessage("Verbindung unterbrochen. Bitte erneut versuchen.");
    } finally {
      setStartingRound(false);
    }
  };

  const saveLabel =
    saveState === "saving"
      ? "Wird gespeichert"
      : saveState === "saved"
        ? "Gespeichert"
        : saveState === "offline"
          ? "Verbindung unterbrochen"
          : saveState === "conflict"
            ? "Speicherkonflikt"
            : "Nicht gespeichert";

  if (done && (readOnly || isSummary)) {
    return (
      <div>
        <StatusBanner tone="ok">
          Technisch abgegeben am{" "}
          {new Date(done.submittedAt).toLocaleString("de-DE")} · Referenz {done.referenceNumber}.
          Dies ist keine vertragliche Schlussfolgerung.
        </StatusBanner>
        <dl className="space-y-4 border border-black/10 bg-light p-5">
          {Object.entries(done.values).map(([key, value]) => (
            <div key={key}>
              <dt className="font-[family-name:var(--font-heading)] text-sm text-violet-dark">{key}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm">{String(Array.isArray(value) ? JSON.stringify(value) : value ?? "—")}</dd>
            </div>
          ))}
        </dl>
        {canStartNextRound ? (
          <button
            type="button"
            className={`${primaryButtonClass} mt-6`}
            onClick={() => void startNextRound()}
            disabled={startingRound}
          >
            {startingRound ? "Wird vorbereitet …" : "Zweite Korrekturrunde starten"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <FormProgress steps={form.steps} currentIndex={stepIndex} />
      <p className="mb-6 text-sm text-muted" aria-live="polite">
        {saveLabel}
      </p>
      {statusMessage ? <StatusBanner tone={saveState === "conflict" ? "warn" : "error"}>{statusMessage}</StatusBanner> : null}

      <div className="mb-6">
        <h2 className="text-[clamp(1.4rem,3vw,1.85rem)]">{step.title}</h2>
        {step.description ? <p className="mt-2 text-muted">{step.description}</p> : null}
      </div>

      {!isSummary && !isCorrections ? (
        <div className="space-y-6">
          {step.fields.map((field) => (
            <FormFieldControl
              key={field.id}
              field={field}
              value={values[field.name]}
              unknown={Boolean(values[`${field.name}__unknown`])}
              error={errors[field.name]}
              onChange={(value) => setValue(field.name, value)}
              onUnknownChange={(checked) => {
                setValue(`${field.name}__unknown`, checked);
                if (checked) setValue(field.name, "");
              }}
            />
          ))}
        </div>
      ) : null}

      {isCorrections ? (
        <CorrectionsEditor
          items={(values.corrections as CorrectionItem[]) || []}
          errors={errors}
          onChange={(items) => setValue("corrections", items)}
        />
      ) : null}

      {isSummary ? (
        <div className="space-y-6">
          <p className="text-sm text-muted">
            Mit der Abgabe werden Ihre Angaben unveränderbar gespeichert. Es handelt sich um eine technische Übergabe, nicht um einen Vertragsschluss.
          </p>
          <button type="button" className={primaryButtonClass} onClick={submit} disabled={submitting}>
            {submitting ? "Wird abgegeben …" : "Verbindlich technisch abgeben"}
          </button>
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-black/10 pt-6">
        <button type="button" className={secondaryButtonClass} onClick={() => setStepIndex((i) => Math.max(i - 1, 0))} disabled={stepIndex === 0}>
          Zurück
        </button>
        {!isSummary ? (
          <button type="button" className={primaryButtonClass} onClick={goNext}>
            Weiter
          </button>
        ) : null}
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => persist(values, stepIndex, revision)}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

function FormFieldControl({
  field,
  value,
  unknown = false,
  error,
  onChange,
  onUnknownChange,
}: {
  field: FormField;
  value: unknown;
  unknown?: boolean;
  error?: string;
  onChange: (value: unknown) => void;
  onUnknownChange?: (checked: boolean) => void;
}) {
  const describedBy = error ? `${field.id}-error` : undefined;
  const options = [...(field.options || [])];
  if (
    field.allowUnknown &&
    field.type === "select" &&
    !options.some((option) => option.value === "__unknown__")
  ) {
    options.push({
      value: "__unknown__",
      label: field.unknownLabel || "Weiß ich noch nicht",
    });
  }

  const unknownControl =
    field.allowUnknown &&
    (field.type === "text" ||
      field.type === "textarea" ||
      field.type === "email" ||
      field.type === "tel") ? (
      <label className="mt-2 flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 accent-[var(--color-violet-dark)]"
          checked={unknown}
          onChange={(e) => onUnknownChange?.(e.target.checked)}
        />
        <span>{field.unknownLabel || "Weiß ich noch nicht"}</span>
      </label>
    ) : null;

  if (field.type === "textarea") {
    return (
      <FieldShell
        id={field.id}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        error={error}
      >
        <textarea
          id={field.id}
          name={field.name}
          rows={5}
          className={fieldControlClass}
          value={unknown ? "" : String(value ?? "")}
          placeholder={field.placeholder}
          disabled={unknown}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        />
        {unknownControl}
      </FieldShell>
    );
  }

  if (field.type === "select") {
    return (
      <FieldShell
        id={field.id}
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        error={error}
      >
        <select
          id={field.id}
          name={field.name}
          className={fieldControlClass}
          value={String(value ?? "")}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Bitte wählen</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className="flex gap-3">
        <input
          id={field.id}
          name={field.name}
          type="checkbox"
          className="mt-1 h-5 w-5 accent-[var(--color-violet-dark)]"
          checked={Boolean(value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div>
          <label htmlFor={field.id} className="font-[family-name:var(--font-heading)] text-sm">
            {field.label}
            {field.required ? <span className="text-violet-dark"> *</span> : null}
          </label>
          {field.helpText ? (
            <p className="mt-1 text-sm text-muted">{field.helpText}</p>
          ) : null}
          {error ? (
            <p id={`${field.id}-error`} className="mt-1 text-sm text-[#9f1239]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox-group" || field.type === "checklist") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset>
        <legend className="font-[family-name:var(--font-heading)] text-sm">
          {field.label}
          {field.required ? <span className="text-violet-dark"> *</span> : null}
        </legend>
        {field.helpText ? (
          <p className="mt-1 text-sm text-muted">{field.helpText}</p>
        ) : null}
        <ul className="mt-3 space-y-3">
          {(field.options || []).map((option) => {
            const checked = selected.includes(option.value);
            return (
              <li key={option.value} className="flex gap-3">
                <input
                  id={`${field.id}-${option.value}`}
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-[var(--color-violet-dark)]"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, option.value]);
                    else onChange(selected.filter((v) => v !== option.value));
                  }}
                />
                <label htmlFor={`${field.id}-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p className="mt-2 text-sm text-[#9f1239]" role="alert">
            {error}
          </p>
        ) : null}
      </fieldset>
    );
  }

  return (
    <FieldShell
      id={field.id}
      label={field.label}
      required={field.required}
      helpText={field.helpText}
      error={error}
    >
      <input
        id={field.id}
        name={field.name}
        type={field.type === "email" || field.type === "tel" ? field.type : "text"}
        className={fieldControlClass}
        value={unknown ? "" : String(value ?? "")}
        placeholder={field.placeholder}
        disabled={unknown}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
      />
      {unknownControl}
    </FieldShell>
  );
}

function CorrectionsEditor({
  items,
  errors,
  onChange,
}: {
  items: CorrectionItem[];
  errors: Record<string, string>;
  onChange: (items: CorrectionItem[]) => void;
}) {
  const update = (index: number, patch: Partial<CorrectionItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-6">
      {errors.corrections ? (
        <p className="text-sm text-[#9f1239]" role="alert">
          {errors.corrections}
        </p>
      ) : null}
      {items.map((item, index) => (
        <fieldset
          key={item.id}
          className="space-y-4 border border-black/10 p-4 sm:p-5"
        >
          <legend className="px-1 font-[family-name:var(--font-heading)] text-sm">
            Korrekturpunkt {index + 1}
          </legend>
          {errors[`correction-${index}`] ? (
            <p className="text-sm text-[#9f1239]" role="alert">
              {errors[`correction-${index}`]}
            </p>
          ) : null}
          <FieldShell id={`${item.id}-page`} label="Betroffene Seite" required>
            <input
              id={`${item.id}-page`}
              className={fieldControlClass}
              value={item.page}
              onChange={(e) => update(index, { page: e.target.value })}
            />
          </FieldShell>
          <FieldShell id={`${item.id}-section`} label="Betroffener Abschnitt">
            <input
              id={`${item.id}-section`}
              className={fieldControlClass}
              value={item.section}
              onChange={(e) => update(index, { section: e.target.value })}
            />
          </FieldShell>
          <FieldShell id={`${item.id}-category`} label="Kategorie" required>
            <select
              id={`${item.id}-category`}
              className={fieldControlClass}
              value={item.category}
              onChange={(e) => update(index, { category: e.target.value })}
            >
              <option value="">Bitte wählen</option>
              {correctionCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldShell>
          <FieldShell
            id={`${item.id}-current`}
            label="Beschreibung des aktuellen Zustands"
          >
            <textarea
              id={`${item.id}-current`}
              rows={3}
              className={fieldControlClass}
              value={item.currentState}
              onChange={(e) => update(index, { currentState: e.target.value })}
            />
          </FieldShell>
          <FieldShell
            id={`${item.id}-desired`}
            label="Konkret gewünschte Änderung"
            required
          >
            <textarea
              id={`${item.id}-desired`}
              rows={3}
              className={fieldControlClass}
              value={item.desiredChange}
              onChange={(e) => update(index, { desiredChange: e.target.value })}
            />
          </FieldShell>
          <FieldShell id={`${item.id}-priority`} label="Priorität">
            <select
              id={`${item.id}-priority`}
              className={fieldControlClass}
              value={item.priority}
              onChange={(e) => update(index, { priority: e.target.value })}
            >
              <option value="">Bitte wählen</option>
              {correctionPriorities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldShell>
          <FieldShell id={`${item.id}-notes`} label="Zusätzliche Hinweise">
            <textarea
              id={`${item.id}-notes`}
              rows={2}
              className={fieldControlClass}
              value={item.notes}
              onChange={(e) => update(index, { notes: e.target.value })}
            />
          </FieldShell>
          <button
            type="button"
            className={cn(
              "text-sm text-muted underline-offset-2 hover:underline",
              items.length === 1 && "opacity-40 pointer-events-none",
            )}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            disabled={items.length === 1}
          >
            Punkt entfernen
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="min-h-12 rounded-sm border border-violet-dark px-5 text-sm font-[family-name:var(--font-heading)] text-violet-dark"
        onClick={() => onChange([...items, createEmptyCorrection()])}
      >
        Korrekturpunkt hinzufügen
      </button>
    </div>
  );
}
