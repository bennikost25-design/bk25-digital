import type { Metadata } from "next";
import Link from "next/link";
import { contactPackageOptions } from "@/data/packages";
import { contactFormFields } from "@/data/process";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Projekt mit BK25 Digital besprechen – Kontaktformular (Vorschau, Versand noch nicht aktiv).",
};

export default function KontaktPage() {
  return (
    <PageShell>
      <section className="bg-[var(--color-black)] text-[var(--color-white)] section-pad">
        <div className="container-site">
          <Reveal>
            <SectionLabel>Kontakt</SectionLabel>
            <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] max-w-[14ch]">
              Projekt besprechen.
            </h1>
            <p className="mt-6 max-w-xl text-white/70 leading-relaxed">
              Erzählen Sie kurz von Ihrer Einrichtung und dem Vorhaben. Die
              endgültige Kontaktadresse und der Formularversand werden vor dem
              Launch ergänzt.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-[var(--color-light)] section-pad">
        <div className="container-site max-w-2xl">
          <Reveal>
            <div
              className="mb-8 border-l-2 border-[var(--color-violet-dark)] bg-[var(--color-white)] px-5 py-4 text-sm text-[var(--color-muted)]"
              role="status"
            >
              <strong className="text-[var(--color-black)]">
                Entwicklungsvorschau:
              </strong>{" "}
              Dieses Formular versendet in der aktuellen Version noch keine
              Daten. Felder und Struktur sind für die spätere Anbindung
              vorbereitet.
            </div>

            <div
              className="space-y-6 bg-[var(--color-white)] p-6 sm:p-10"
              role="form"
              aria-label="Kontaktformular (Vorschau, nicht aktiv)"
            >
              {contactFormFields.map((field) => {
                if (field.type === "textarea") {
                  return (
                    <div key={field.id}>
                      <label
                        htmlFor={field.id}
                        className="block font-[family-name:var(--font-heading)] text-sm mb-2"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-[var(--color-violet-dark)]">
                            {" "}
                            *
                          </span>
                        )}
                      </label>
                      <textarea
                        id={field.id}
                        name={field.name}
                        rows={5}
                        disabled
                        className="w-full border border-[var(--color-black)]/15 bg-[var(--color-light)] px-4 py-3 text-[var(--color-black)] disabled:opacity-70"
                        placeholder="Kurze Beschreibung Ihres Vorhabens"
                      />
                    </div>
                  );
                }

                if (field.type === "select") {
                  return (
                    <div key={field.id}>
                      <label
                        htmlFor={field.id}
                        className="block font-[family-name:var(--font-heading)] text-sm mb-2"
                      >
                        {field.label}
                      </label>
                      <select
                        id={field.id}
                        name={field.name}
                        disabled
                        className="w-full border border-[var(--color-black)]/15 bg-[var(--color-light)] px-4 py-3 text-[var(--color-black)] disabled:opacity-70"
                        defaultValue=""
                      >
                        {contactPackageOptions.map((option) => (
                          <option
                            key={option.value || "empty"}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <div key={field.id} className="flex gap-3 items-start">
                      <input
                        id={field.id}
                        name={field.name}
                        type="checkbox"
                        disabled
                        className="mt-1 h-4 w-4 accent-[var(--color-violet-dark)]"
                      />
                      <label
                        htmlFor={field.id}
                        className="text-sm text-[var(--color-muted)]"
                      >
                        Ich habe die{" "}
                        <Link
                          href="/datenschutz"
                          className="text-[var(--color-violet-dark)]"
                        >
                          Datenschutzerklärung
                        </Link>{" "}
                        zur Kenntnis genommen. (Bestätigung wird mit dem
                        Formularversand aktiv.)
                        {field.required && (
                          <span className="text-[var(--color-violet-dark)]">
                            {" "}
                            *
                          </span>
                        )}
                      </label>
                    </div>
                  );
                }

                return (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block font-[family-name:var(--font-heading)] text-sm mb-2"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-[var(--color-violet-dark)]">
                          {" "}
                          *
                        </span>
                      )}
                    </label>
                    <input
                      id={field.id}
                      name={field.name}
                      type={field.type}
                      disabled
                      className="w-full border border-[var(--color-black)]/15 bg-[var(--color-light)] px-4 py-3 text-[var(--color-black)] disabled:opacity-70"
                    />
                  </div>
                );
              })}

              <button
                type="button"
                disabled
                className="min-h-12 w-full sm:w-auto px-8 font-[family-name:var(--font-heading)] bg-[var(--color-black)]/20 text-[var(--color-muted)] cursor-not-allowed"
              >
                Versand noch nicht aktiv
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
