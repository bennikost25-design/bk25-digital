# Produktions-Checkliste BK25 Digital

Rechtliche und geschäftliche Angaben dürfen nicht erfunden werden. `isProductionReady` bleibt aus, bis Benni die Platzhalter geprüft hat.

## Cloudflare und Daten

- [ ] Workers Paid aktiv
- [ ] Produktions-D1 manuell mit `--jurisdiction=eu` erstellt (`--location` reicht nicht)
- [ ] Preview-D1 getrennt und manuell mit `--jurisdiction=eu` erstellt
- [ ] IDs in `wrangler.jsonc` eingesetzt, Placeholder bis dahin belassen
- [ ] Preview zeigt niemals auf die Produktions-D1
- [ ] Queues und DLQ angelegt (kein RATE_LIMIT-KV)
- [ ] Bindings in `wrangler.jsonc` kontrolliert (`DB`, `EMAIL_QUEUE`)
- [ ] `compatibility_date` = `2026-08-19`
- [ ] Migrationen lokal, Preview, dann Produktion
- [ ] D1-Backup vor der ersten Produktionsmigration

## Secrets und Mail

- [ ] Better-Auth-Secret erzeugt und nur in Cloudflare hinterlegt
- [ ] Turnstile-Widget für die Livedomain, alle Werte explizit in Preview und Produktion
- [ ] Brevo-Absender verifiziert
- [ ] Alle Secrets in Preview und Produktion getrennt gesetzt
- [ ] `MAIL_MODE=brevo` in Produktion (kein stiller Mock-Fallback, unbekannte Werte brechen den Start ab)
- [ ] `BETTER_AUTH_URL` und `NEXT_PUBLIC_SITE_URL` sind HTTPS und derselbe Ursprung
- [ ] Lokaler Admin-Bootstrap über `npm run bootstrap:admin` (`getPlatformProxy` ist nicht der Produktionsweg)
- [ ] Produktions-Admin nur mit `--production --remote --confirm-production`

## GitHub und Domain

- [ ] GitHub mit Workers Builds verbunden
- [ ] Workername = `bk25-digital` wie in `wrangler.jsonc`
- [ ] Build command: `npx @opennextjs/cloudflare build`
- [ ] Deploy command: `npx @opennextjs/cloudflare deploy`
- [ ] Zuerst nur Preview, dann Smoke-Test
- [ ] IONOS MX/SPF/DKIM/DMARC vor Nameserverwechsel übernommen
- [ ] Nur ein SPF-TXT-Eintrag
- [ ] Custom Domain und HTTPS geprüft
- [ ] HSTS erst nach DNS-/HTTPS-/Subdomain-Prüfung über `max-age=300` hinaus erhöhen (kein voreiliges `preload`)

## Recht und Launch

- [ ] Impressum: echte, geprüfte Angaben statt Platzhalter
- [ ] Datenschutz: Cloudflare Workers, D1, Turnstile, Queues, Better Auth, Brevo, IONOS, Cookies, Aufbewahrung geprüft
- [ ] Keine erfundenen Steuernummern, Handelsregister- oder Firmendaten
- [ ] Formulare fordern keine Gesundheits-/Bewohner-/Patientendaten
- [ ] `isProductionReady` erst danach aktiviert
- [ ] Kontaktformular, Login, Einladung, Entwurf, Abgabe, zweite Korrekturrunde, E-Mail live geprüft
- [ ] Keine Secrets im Git-Repository
- [ ] Backup- und Rollback-Weg bekannt
