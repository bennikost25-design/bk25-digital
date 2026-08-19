# Cloudflare-Deployment für BK25 Digital

Diese Anleitung gilt für das Repository `bennikost25-design/bk25-digital`.
Sie ist in der Reihenfolge auszuführen. Es darf **keine** D1-Produktionsdatenbank ohne EU-Jurisdiktion entstehen.
Preview und Produktion bleiben strikt getrennt.

**Wichtige Warnungen vorab**

- Die D1-Jurisdiktion kann nach der Erstellung nicht geändert werden.
- Die normale Cloudflare-Autoprovisionierung darf nicht versehentlich eine unrestricted Produktions-D1 anlegen. Immer `--location=eu` verwenden.
- Preview darf niemals Produktionskundendaten verwenden.
- DNS-Änderungen dürfen das IONOS-Postfach nicht unterbrechen.
- SPF darf nicht in mehreren konkurrierenden SPF-TXT-Einträgen angelegt werden. Es gibt nur **einen** SPF-Record.
- Secrets gehören nicht ins Repository. `.dev.vars` ist gitignoriert.
- Vor Datenbankmigrationen ist ein Export bzw. Backup sinnvoll.
- `wrangler.jsonc` ist Source of Truth für Bindings. Die Produktions-D1-ID steht absichtlich auf `REPLACE_WITH_EU_D1_PRODUCTION_ID`.
- Lokal: `.dev.vars.example` nach `.dev.vars` kopieren. Diese Datei nicht committen.

## 1. Cloudflare-Konto öffnen

Bei Cloudflare anmelden (bestehendes oder neues Konto).

## 2. Workers-Paid-Tarif aktivieren

Workers Paid aktivieren. Queues und ausreichende Limits sind dafür erforderlich.

## 3. Produktions-D1 mit EU-Jurisdiktion erstellen

```bash
npx wrangler d1 create bk25-digital-production --location=eu
```

Nicht das Dashboard-Default „Create“ ohne Standort verwenden. Die Jurisdiktion ist danach unveränderbar.

## 4. Separate Preview-D1 mit EU-Jurisdiktion erstellen

```bash
npx wrangler d1 create bk25-digital-preview --location=eu
```

## 5. Datenbank-IDs in die Konfiguration einsetzen

In `wrangler.jsonc` ersetzen:

- `REPLACE_WITH_EU_D1_PRODUCTION_ID`
- `REPLACE_WITH_EU_D1_PREVIEW_ID`

Niemals die Produktions-ID im Preview-Environment eintragen.

## 6. Queue, Dead-Letter-Queue und KV anlegen

```bash
npx wrangler queues create bk25-email-production
npx wrangler queues create bk25-email-production-dlq
npx wrangler queues create bk25-email-preview
npx wrangler queues create bk25-email-preview-dlq
npx wrangler kv namespace create RATE_LIMIT
npx wrangler kv namespace create RATE_LIMIT --preview
```

IDs für `RATE_LIMIT` in `wrangler.jsonc` einsetzen (`REPLACE_WITH_PRODUCTION_KV_ID` / `REPLACE_WITH_PREVIEW_KV_ID`).

## 7. Bindings kontrollieren

In `wrangler.jsonc` prüfen:

- Workername Produktion: `bk25-digital`
- Workername Preview: `bk25-digital-preview`
- Bindings `DB`, `EMAIL_QUEUE`, `RATE_LIMIT`
- Production-Vars: `APP_ENV=production`, `MAIL_MODE=brevo`
- Preview-Vars: `APP_ENV=preview`, `MAIL_MODE=brevo`
- Custom Worker-Entrypoint: `workers/app.ts`

## 8. Migrationen zuerst lokal, dann Preview, danach Produktion

```bash
npm run db:migrate:local
npx wrangler d1 migrations apply DB --env preview
npx wrangler d1 migrations apply DB --env production
```

Vor der Produktionsmigration D1 exportieren bzw. sichern.

## 9. Better-Auth-Secret sicher erzeugen

Kryptografisch zufällig, mindestens 32 Zeichen, getrennt für Preview und Produktion. Nur in Cloudflare Secrets hinterlegen, nicht ins Git.

## 10. Turnstile-Widget erstellen

Widget für die Livedomain anlegen. Hostnamen eintragen. Dummy-Keys nur lokal verwenden (siehe `.dev.vars.example`).

## 11. Brevo-Konto und Absenderdomain verifizieren

Absenderadresse und Domain in Brevo verifizieren. SPF später mit IONOS in **einem** kombinierten TXT-Eintrag führen.

## 12. Erforderliche Secrets in Cloudflare hinterlegen

Je Environment (Preview und Produktion getrennt):

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_EXPECTED_HOSTNAME`
- `RATE_LIMIT_SECRET`
- `ORIGIN_SECRET`
- `MAIL_FROM_EMAIL`
- `MAIL_FROM_NAME`
- `ADMIN_NOTIFICATION_EMAIL`
- `BREVO_API_KEY`

Produktion: `MAIL_MODE=brevo`. Mock-Mail ist dort absichtlich verboten und führt zu einem sicheren Fehlschlag.

## 13. Ersten Admin sicher anlegen

Kein öffentlicher Bootstrap-Endpunkt. Keine fest eingebauten Passwörter.

Lokal nach Migration:

```bash
BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... npm run bootstrap:admin
```

Für Produktion denselben Vorgang gegen die Produktions-D1 nur bewusst und einmalig ausführen, sobald Bindings stehen. Idempotent: vorhandener Admin wird nicht überschrieben.

## 14. GitHub-Repository mit Workers Builds verbinden

Repository `bennikost25-design/bk25-digital` in Cloudflare Workers Builds anbinden. Branch: `master`.

## 15. Workername mit wrangler.jsonc abgleichen

Produktion: `bk25-digital`. Preview: `bk25-digital-preview`.

## 16. Build- und Deploy-Befehle konfigurieren

- Build: `npx opennextjs-cloudflare build`
- Deploy nur über Cloudflare Workers Builds, nicht lokal `wrangler deploy` / `npm run deploy`

## 17. Zunächst nur eine Preview-Version erstellen

Noch keine Custom Domain und keine Produktionsdaten.

## 18. Smoke-Tests in Preview durchführen

- Startseite
- Kontaktformular (Turnstile, Speichern in Preview-D1)
- Kundenlogin
- Einladung
- Entwurf speichern
- Technische Abgabe
- Adminbereich: Kontakt, Einreichungen, E-Mail-Status

## 19. Domain zu Cloudflare hinzufügen

Domain nur hinzufügen, Nameserver noch nicht umstellen.

## 20. Vor dem Nameserverwechsel alle IONOS-MX-, SPF-, DKIM- und DMARC-Einträge übernehmen

Alle bestehenden Mail-DNS-Einträge notieren und in Cloudflare identisch anlegen. Sonst bricht das IONOS-Postfach.

SPF: vorhandene Mechanismen in **einen** TXT-Record zusammenführen. Kein zweiter SPF-TXT.

## 21. Nameserver bei IONOS umstellen

Erst nach erfolgreicher Mail-DNS-Kopie.

## 22. Custom Domain mit dem Worker verbinden

Apex und www nach Bedarf. HTTPS von Cloudflare.

## 23. HTTPS und Weiterleitungen prüfen

Zertifikat, www/apex, keine offenen HTTP-Inhalte.

## 24. Rechtliche Platzhalter ausfüllen

Impressum und Datenschutz in `src/data/legal.ts` bzw. den Seiten mit echten, geprüften Angaben füllen. Keine erfundenen Firmendaten. `isProductionReady` bleibt `false`, bis das erfolgt ist.

Vor Veröffentlichung rechtlich prüfen:

- Verantwortliche Stelle
- Hosting (Cloudflare Workers, D1, Queues, Turnstile)
- Better Auth als selbst gehostete Bibliothek
- Brevo Transaktions-E-Mails
- IONOS Domain und Postfach
- Session-Cookies
- Kontaktformular, Kundenbereich
- Aufbewahrung und Löschung
- Keine Gesundheits- oder Bewohnerdaten in Formularen anfordern

## 25. Produktionsbereitschaft aktivieren

Erst nach rechtlicher Prüfung `isProductionReady` auf `true` setzen.

## 26. Finalen Produktionsdeploy durchführen

Über Workers Builds, nicht lokal.

## 27. Kontaktformular, Login, Einladung, Entwurf, Abgabe und E-Mail-Versand live testen

Mit Testdaten, nicht mit echten Klientendaten.

## 28. Backup-, Export- und Rollback-Vorgehen

- Worker auf die vorherige Version zurücksetzen (Cloudflare Versions).
- D1 nicht ungeprüft rückwärts migrieren; Restore aus Export verwenden.
- Vor jeder Produktionsmigration `wrangler d1 export` bzw. Dashboard-Export.
- Preview-Rollback betrifft nur Preview-D1.

## Lokale Vorbereitung ohne Cloudflare-Konto

```bash
copy .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm test
npm run lint
npm run typecheck
npm run build
npm run build:opennext
npm run preview
```

`npm run preview` startet die `workerd`-Runtime. `npm run deploy` ist vorbereitet, aber darf erst nach den Schritten oben bewusst in Cloudflare ausgeführt werden.
