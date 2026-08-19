# Lokale Prüfungen (ehrlich dokumentiert)

Ausgeführt am 19.08.2026 im lokalen Arbeitsstand. Kein Commit, kein Push, kein Deployment.

## Erfolgreich

- `npm run lint`
- `npm run typecheck`
- `npm test` — 15 Tests (Vitest), in-memory SQLite, ohne echte Cloudflare-/Brevo-Konten
- `npm run db:migrate:local` — `0001_init.sql` auf lokaler D1 angewendet
- `npm run build` — `next build --webpack` (Next.js 16.2.12)
- `npm run build:opennext` — Worker in `.open-next/worker.js`
- `npx opennextjs-cloudflare preview` — `workerd` Ready auf `http://127.0.0.1:8787`

## workerd-Smoke-Test

- `GET /` → 200
- `GET /anmelden` → 200
- `GET /konto` → 307 (nicht angemeldet)
- `GET /admin` → 307 (nicht angemeldet)
- `POST /api/auth/sign-up/email` → 403 Registrierung blockiert
- Kontakt-Honeypot → 200 ohne fachliche Speicherung
- Kontakt ohne gültiges Turnstile → 400

## Nicht live geprüft (fehlende echte Konten)

- Cloudflare-Konto, Workers Paid, Remote-D1 mit EU-Jurisdiktion
- Echte Turnstile-Widgets (lokal Dummy-Keys, Siteverify für Fantasie-Token ablehnt erwartungsgemäß)
- Brevo-Versand echter E-Mails (lokaler Mock-Modus)
- GitHub Workers Builds, Custom Domain, IONOS-Nameserverwechsel
- Erster Produktions-Admin gegen Remote-D1

## Hinweise

- OpenNext warnt unter Windows; empfohlen ist später WSL oder CI/Linux für Builds.
- Der Next.js-Default-Turbopack-Build scheitert an generiertem Tailwind-CSS (`Invalid dangling combinator`). Deshalb ist `npm run build` auf Webpack gestellt. OpenNext nutzt dieses Script.
- `.dev.vars` wurde lokal aus `.dev.vars.example` kopiert (gitignoriert, nur Dummy-Werte). Nicht committen.
