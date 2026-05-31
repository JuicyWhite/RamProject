# Ascend — Construction Project Management & Cost Estimating

Production-grade web app for Philippine contractors and estimators. Multi-tenant SaaS with quantity takeoff, WBS cost estimating, and a reusable rate library.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Prisma** ORM + **PostgreSQL** (via Neon)
- **Auth.js v5** — email magic link + optional Google OAuth
- **shadcn/ui** component primitives
- Amber accent design system, WCAG AA accessible

---

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (free tier) for PostgreSQL
- An email provider (SMTP) for magic-link auth — [Resend](https://resend.com) free tier works great

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Random secret — run `openssl rand -base64 32` |
| `AUTH_URL` | Your app URL (`http://localhost:3000` for dev) |
| `EMAIL_SERVER` | SMTP URL e.g. `smtp://user:pass@smtp.resend.com:587` |
| `EMAIL_FROM` | Sender address e.g. `Ascend <noreply@yourdomain.com>` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional — Google OAuth |

### 3. Push schema + seed

```bash
npm run db:push        # push schema to Neon
npm run db:seed        # seed demo data
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with `demo@ascend.app`.

> **Note:** In dev, Auth.js logs the magic link to the console even without SMTP configured. Look for `[auth][debug]` output.

---

## Deployment on SiteGround (Shared Hosting / Node.js App)

SiteGround shared hosting supports Node.js apps via **cPanel → Setup Node.js App**.

### Build

```bash
npm run build
```

This produces `.next/standalone` (enabled via `output: 'standalone'` in `next.config.ts`).

### Upload to SiteGround

1. Upload the project folder to your hosting root (e.g. via Git or FTP).
2. In cPanel → **Setup Node.js App**:
   - Node.js version: **20.x**
   - Application mode: **Production**
   - Application root: `/home/username/project-folder`
   - Application startup file: `server.js`
3. Set environment variables in cPanel (same as your `.env`).
4. Run `npm install --production` in the cPanel terminal.
5. Copy `.next/standalone` contents to the app root. Restart the app.

> **Database:** SiteGround shared hosting does not include PostgreSQL. Use **Neon** (free serverless Postgres at neon.tech) and set `DATABASE_URL` to your Neon connection string.

---

## Database Migrations

```bash
npm run db:migrate    # create + run a named migration
npm run db:push       # push schema without migration history (dev only)
npm run db:studio     # open Prisma Studio GUI
```

---

## Key Features (MVP)

| Feature | Status |
|---|---|
| Multi-tenant org + user auth | ✅ |
| Projects CRUD (with PH fields) | ✅ |
| WBS tree (groups + items) | ✅ |
| Cost estimating (rate line items) | ✅ |
| Global rate library | ✅ |
| Live grand total recalculation | ✅ |
| Dashboard overview | ✅ |
| Light + dark mode | ✅ |
| Quantity formula evaluator | ✅ (plumbed; UI in next iteration) |
| PDF / XLSX export | 🔜 |
| Drag-to-reorder WBS | 🔜 |
| Invite team members | 🔜 |

---

## Seed Data

The seed creates:
- Demo org: **Ascend Demo Org**
- Demo user: `demo@ascend.app` (OWNER)
- **26 rate items** (Labor, Material, Equipment) based on DPWH/Philippine market rates
- 1 demo project: *DPWH Road Widening — Marikina Access Road* with a full 5-section WBS

---

## Project Structure

```
src/
  app/
    (auth)/       ← login page
    (app)/        ← authenticated shell (sidebar + topbar)
      page.tsx                          ← dashboard
      projects/                         ← project list + new
      projects/[projectId]/             ← project detail
      projects/[projectId]/estimate/    ← WBS + cost grid
      projects/[projectId]/settings/    ← edit project
      rates/                            ← rate library
      settings/                         ← org settings
  components/
    ui/           ← shadcn primitives
    layout/       ← sidebar, topbar
    estimate/     ← estimate grid, WBS tree, totals bar
    projects/     ← project form
    rates/        ← rate library shell
  actions/        ← server actions (projects, wbs, rates)
  lib/            ← db, auth, formula evaluator, utils
  validations/    ← Zod schemas
  types/          ← shared types + estimate compute helpers
prisma/
  schema.prisma
  seed.ts
```
