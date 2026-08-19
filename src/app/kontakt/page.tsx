import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ContactForm } from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Projekt mit BK25 Digital besprechen.",
};

export default function KontaktPage() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

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
              Erzählen Sie kurz von Ihrer Einrichtung und dem Vorhaben. Nach dem
              Senden liegt die Anfrage im geschützten Bereich von BK25 Digital.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="bg-[var(--color-light)] section-pad">
        <div className="container-site max-w-2xl">
          <Reveal>
            <ContactForm siteKey={siteKey} />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
