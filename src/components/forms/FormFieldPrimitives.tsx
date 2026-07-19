import { cn } from "@/lib/utils";

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
};

export function FieldShell({
  id,
  label,
  required,
  helpText,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block font-[family-name:var(--font-heading)] text-sm text-black"
      >
        {label}
        {required ? <span className="text-violet-dark"> *</span> : null}
      </label>
      {helpText ? <p className="text-sm text-muted">{helpText}</p> : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[#9f1239]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlClass = cn(
  "w-full min-h-12 rounded-sm border border-black/15 bg-white px-4 py-3 text-base text-black",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-dark",
);

export function FormProgress({
  steps,
  currentIndex,
}: {
  steps: { id: string; title: string }[];
  currentIndex: number;
}) {
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between gap-4 text-sm text-muted">
        <span>
          Schritt {currentIndex + 1} von {steps.length}
        </span>
        <span>{percent} %</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Formularfortschritt"
      >
        <div
          className="h-full bg-violet-dark transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="mt-4 hidden gap-2 sm:flex sm:flex-wrap">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "rounded-sm px-2 py-1 text-xs",
              index === currentIndex
                ? "bg-violet-dark text-white"
                : index < currentIndex
                  ? "bg-black/5 text-black"
                  : "text-muted",
            )}
          >
            {step.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
