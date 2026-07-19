"use client";

import { useEffect, useMemo, useState } from "react";
import {
  correctionCategories,
  correctionPriorities,
  createEmptyCorrection,
  type CorrectionItem,
  type CustomerFormDefinition,
  type FormField,
} from "@/data/customerForms";
import { clearDraft, loadDraft, saveDraft } from "@/lib/formDraftStorage";
import {
  buildExportText,
} from "@/lib/formSubmission";
import {
  FieldShell,
  FormProgress,
  fieldControlClass,
} from "./FormFieldPrimitives";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown>;

function emptyValues(form: CustomerFormDefinition): Values {
  const values: Values = {};
  for (const step of form.steps) {
    for (const field of step.fields) {
      if (field.type === "checkbox") values[field.name] = false;
      else if (field.type === "checkbox-group" || field.type === "checklist")
        values[field.name] = [] as string[];
      else values[field.name] = "";
    }
  }
  if (form.id === "korrekturen") {
    values.corrections = [createEmptyCorrection()];
  }
  return values;
}

function validateField(
  field: FormField,
  value: unknown,
  unknown = false,
): string | null {
  if (unknown) return null;
  if (!field.required) return null;
  if (field.type === "checkbox") {
    return value === true ? null : "Bitte bestätigen.";
  }
  if (field.type === "checkbox-group" || field.type === "checklist") {
    return Array.isArray(value) && value.length > 0
      ? null
      : "Bitte mindestens eine Option wählen.";
  }
  if (typeof value === "string" && value.trim()) return null;
  return "Dieses Feld ist erforderlich.";
}

function formatValue(value: unknown, unknown = false): string {
  if (unknown) return "Weiß ich noch nicht / Empfehlung gewünscht";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "object") return JSON.stringify(value, null, 2);
    return value
      .map((entry) =>
        entry === "__unknown__"
          ? "Weiß ich noch nicht / Empfehlung gewünscht"
          : entry === "__separate__"
            ? "Wird separat übermittelt"
            : String(entry),
      )
      .join(", ");
  }
  if (value === "__unknown__") return "Weiß ich noch nicht / Empfehlung gewünscht";
  if (value === "__separate__") return "Wird separat übermittelt";
  if (value == null || value === "") return "—";
  return String(value);
}

export function CustomerFormRenderer({
  form,
}: {
  form: CustomerFormDefinition;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>(() => emptyValues(form));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // Hydrate from localStorage after mount (client-only external store).
    const frame = window.requestAnimationFrame(() => {
      const draft = loadDraft(form.storageKey);
      if (draft) {
        setValues({ ...emptyValues(form), ...draft.values });
        setStepIndex(
          Math.min(Math.max(draft.stepIndex, 0), form.steps.length - 1),
        );
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [form]);

  useEffect(() => {
    if (!hydrated) return;
    saveDraft(form.storageKey, {
      values,
      stepIndex,
      updatedAt: new Date().toISOString(),
    });
  }, [values, stepIndex, hydrated, form.storageKey]);

  const step = form.steps[stepIndex];
  const isSummary = step.kind === "summary";
  const isCorrections = step.kind === "corrections";

  const corrections = useMemo(
    () => (values.corrections as CorrectionItem[]) || [],
    [values.corrections],
  );

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};
    if (isCorrections) {
      const items = (values.corrections as CorrectionItem[]) || [];
      if (items.length === 0) {
        nextErrors.corrections = "Bitte mindestens einen Korrekturpunkt hinzufügen.";
      } else {
        items.forEach((item, index) => {
          if (!item.page.trim() || !item.desiredChange.trim() || !item.category) {
            nextErrors[`correction-${index}`] =
              "Seite, Kategorie und gewünschte Änderung sind erforderlich.";
          }
        });
      }
    } else {
      for (const field of step.fields) {
        const unknown = Boolean(values[`${field.name}__unknown`]);
        const message = validateField(field, values[field.name], unknown);
        if (message) nextErrors[field.name] = message;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStepIndex((i) => Math.min(i + 1, form.steps.length - 1));
    setStatusMessage(null);
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setStatusMessage(null);
  };

  const clearAll = () => {
    if (
      !window.confirm(
        "Entwurf wirklich löschen? Alle lokal gespeicherten Angaben dieses Formulars gehen verloren.",
      )
    ) {
      return;
    }
    clearDraft(form.storageKey);
    setValues(emptyValues(form));
    setStepIndex(0);
    setErrors({});
    setStatusMessage("Entwurf wurde gelöscht.");
  };

  const exportLocal = async () => {
    const text = buildExportText(form, values);
    try {
      await navigator.clipboard.writeText(text);
      setStatusMessage(
        "Zusammenfassung in die Zwischenablage kopiert. Eine Übermittlung an BK25 ist damit nicht bestätigt.",
      );
    } catch {
      setStatusMessage("Kopieren nicht möglich. Bitte Textdatei herunterladen.");
    }
  };

  const downloadLocal = () => {
    const text = buildExportText(form, values);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bk25-${form.slug}-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage(
      "Textdatei heruntergeladen. Eine Übermittlung an BK25 ist damit nicht bestätigt.",
    );
  };

  const summaryEntries = useMemo(() => {
    const entries: { label: string; value: string }[] = [];
    for (const s of form.steps) {
      for (const field of s.fields) {
        entries.push({
          label: field.label,
          value: formatValue(
            values[field.name],
            Boolean(values[`${field.name}__unknown`]),
          ),
        });
      }
    }
    if (form.id === "korrekturen") {
      entries.push({
        label: "Korrekturpunkte",
        value: corrections
          .map(
            (item, i) =>
              `${i + 1}. ${item.page || "—"} / ${item.section || "—"} (${item.category || "—"}): ${item.desiredChange || "—"}`,
          )
          .join("\n"),
      });
    }
    return entries;
  }, [form, values, corrections]);

  return (
    <div>
      <FormProgress steps={form.steps} currentIndex={stepIndex} />

      <div className="mb-8 rounded-sm border border-violet-dark/25 bg-[#f5f3ff] px-4 py-3 text-sm text-black">
        <strong>Vorschau</strong> – die direkte Übermittlung an BK25 Digital ist
        noch nicht aktiviert. Ihre Angaben werden nur lokal in diesem Browser
        zwischengespeichert.
      </div>

      <div className="mb-6">
        <h2 className="text-[clamp(1.4rem,3vw,1.85rem)]">{step.title}</h2>
        {step.description ? (
          <p className="mt-2 text-muted">{step.description}</p>
        ) : null}
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
                if (checked && (field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "tel")) {
                  setValue(field.name, "");
                }
              }}
            />
          ))}
        </div>
      ) : null}

      {isCorrections ? (
        <CorrectionsEditor
          items={corrections}
          errors={errors}
          onChange={(items) => setValue("corrections", items)}
        />
      ) : null}

      {isSummary ? (
        <div className="space-y-6">
          <dl className="space-y-4 border border-black/10 bg-light p-5 sm:p-6">
            {summaryEntries.map((entry) => (
              <div key={entry.label}>
                <dt className="font-[family-name:var(--font-heading)] text-sm text-violet-dark">
                  {entry.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-black">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="min-h-12 rounded-sm bg-violet-dark px-5 text-sm font-[family-name:var(--font-heading)] text-white"
              onClick={exportLocal}
            >
              Zusammenfassung kopieren
            </button>
            <button
              type="button"
              className="min-h-12 rounded-sm border border-black/20 px-5 text-sm font-[family-name:var(--font-heading)] text-black"
              onClick={downloadLocal}
            >
              Als Textdatei herunterladen
            </button>
            <button
              type="button"
              className="min-h-12 cursor-not-allowed rounded-sm border border-black/15 px-5 text-sm font-[family-name:var(--font-heading)] text-muted"
              disabled
            >
              Direkte Übermittlung noch nicht verfügbar
            </button>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="mt-6 text-sm text-muted" role="status">
          {statusMessage}
        </p>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-black/10 pt-6">
        <button
          type="button"
          className="min-h-12 rounded-sm border border-black/20 px-5 text-sm font-[family-name:var(--font-heading)] disabled:opacity-40"
          onClick={goBack}
          disabled={stepIndex === 0}
        >
          Zurück
        </button>
        {!isSummary ? (
          <button
            type="button"
            className="min-h-12 rounded-sm bg-violet-dark px-5 text-sm font-[family-name:var(--font-heading)] text-white"
            onClick={goNext}
          >
            Weiter
          </button>
        ) : null}
        <button
          type="button"
          className="min-h-12 rounded-sm px-3 text-sm text-muted underline-offset-2 hover:underline"
          onClick={clearAll}
        >
          Entwurf löschen
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
