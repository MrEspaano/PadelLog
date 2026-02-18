# PadelLog (Next.js + Neon + Vercel)

Modern tränings- och padelanalys som fullstack-webbapp.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- Neon Postgres
- NextAuth (Credentials: email/lösenord)
- SheetJS (`xlsx`) för Excel-export
- Hosting: Vercel

## Funktioner

- Viktlogg (söndagsdefault, "Logga vikt idag", veckodelta, trend)
- Padel wizard (en fråga i taget, skippbara steg, sammanfattningskort)
- Veckorutnät (ISO-vecka, mån–sön, vila, klick/tap för dagspass)
- Passlogg (filter, sortering, sök, desktop-datagrid, mobile-cards)
- Excel-export (`Passlogg` + `Veckorutnät`, datumintervall i filnamn)
- Kritisk coach (3–10 senaste padelpass, KPI, mönster, alternativa tolkningar)

## Projektstruktur

```
/app
/components/core
/components/layout
/components/mobile
/components/desktop
/lib/analysis
/lib/auth.ts
/lib/data
/lib/db.ts
/neon/schema.sql
```

## 1) Skapa Neon-databas

1. Skapa projekt i Neon.
2. Kopiera `DATABASE_URL`.
3. Kör SQL från `/neon/schema.sql` i Neon SQL editor.

## 2) Environment variables

Skapa `.env.local`:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="<valfri-lång-hemlig-sträng>"
AUTH_TRUST_HOST="true"
```

Generera `AUTH_SECRET` exempel:

```bash
openssl rand -base64 32
```

## 3) Kör lokalt

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000).

## 4) Push till GitHub

```bash
git init
git add .
git commit -m "feat: migrate to neon + nextauth"
git branch -M main
git remote add origin <din-repo-url>
git push -u origin main
```

## 5) Deploy till Vercel

1. Importera GitHub-repot i Vercel.
2. Sätt env vars i Vercel Project Settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true`
3. Deploy.

Vercel kör CI/CD vid push till main.

## Neon på Vercel (tips)

- Välj gärna pooled connection string för serverless.
- Om du använder Neon-integrationen i Vercel, kontrollera att `DATABASE_URL` pekar på rätt branch/databas.
