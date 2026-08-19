# BK25 Digital

Öffentliche Website und geschützter Kundenbereich für BK25. Das **einzige Deployment-Ziel** ist Cloudflare Workers (Paid) mit OpenNext, D1 (EU-Jurisdiktion), Queues, Turnstile und Brevo.

## Lokal starten

```bash
copy .dev.vars.example .dev.vars
npm install
npm run db:migrate:local
npm run bootstrap:admin
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000). `.dev.vars` nicht committen.

## Qualitätssicherung

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:opennext
npx drizzle-kit check
```

## Deployment

Es gibt keine Vercel-Zielarchitektur. Produktion und Preview laufen ausschließlich auf Cloudflare Workers.

Workers Builds (exakt):

- Build command: `npx @opennextjs/cloudflare build`
- Deploy command: `npx @opennextjs/cloudflare deploy`

Vor dem ersten Livegang die Schritte in `docs/CLOUDFLARE_DEPLOYMENT.md` und `docs/PRODUCTION_CHECKLIST.md` ausführen. D1-Datenbanken müssen **manuell** mit `--jurisdiction=eu` erstellt werden. Platzhalter-IDs in `wrangler.jsonc` bleiben Platzhalter, bis sie bewusst ersetzt werden.
