# Produktions-Checkliste BK25 Digital

Rechtliche und geschäftliche Angaben dürfen nicht erfunden werden. `isProductionReady` bleibt aus, bis Benni die Platzhalter geprüft hat.

## Cloudflare und Daten

- [ ] Workers Paid aktiv
- [ ] Produktions-D1 mit `--location=eu` erstellt
- [ ] Preview-D1 mit `--location=eu` erstellt
- [ ] IDs in `wrangler.jsonc` eingesetzt, Platzhalter entfernt
- [ ] Preview zeigt niemals auf die Produktions-D1
- [ ] Queues, DLQ und KV angelegt
- [ ] Bindings in `wrangler.jsonc` kontrolliert
- [ ] Migrationen lokal, Preview, dann Produktion
- [ ] D1-Backup vor der ersten Produktionsmigration

## Secrets und Mail

- [ ] Better-Auth-Secret erzeugt und nur in Cloudflare hinterlegt
- [ ] Turnstile-Widget für die Livedomain
- [ ] Brevo-Absender verifiziert
- [ ] Alle Secrets in Preview und Produktion getrennt gesetzt
- [ ] `MAIL_MODE=brevo` in Produktion (kein stiller Mock-Fallback)
- [ ] Erster Admin sicher angelegt (Bootstrap-Script, kein öffentlicher Endpunkt)

## GitHub und Domain

- [ ] GitHub mit Workers Builds verbunden
- [ ] Workername = `bk25-digital` wie in `wrangler.jsonc`
- [ ] Build-Befehl: `npx opennextjs-cloudflare build`
- [ ] Zuerst nur Preview, dann Smoke-Test
- [ ] IONOS MX/SPF/DKIM/DMARC vor Nameserverwechsel übernommen
- [ ] Nur ein SPF-TXT-Eintrag
- [ ] Custom Domain und HTTPS geprüft

## Recht und Launch

- [ ] Impressum: echte, geprüfte Angaben statt Platzhalter
- [ ] Datenschutz: Cloudflare Workers, D1, Turnstile, Queues, Better Auth, Brevo, IONOS, Cookies, Aufbewahrung geprüft
- [ ] Keine erfundenen Steuernummern, Handelsregister- oder Firmendaten
- [ ] Formulare fordern keine Gesundheits-/Bewohner-/Patientendaten
- [ ] `isProductionReady` erst danach aktiviert
- [ ] Kontaktformular, Login, Einladung, Entwurf, Abgabe, E-Mail live geprüft
- [ ] Keine Secrets im Git-Repository
- [ ] Backup- und Rollback-Weg bekannt
