# ArminIR

A personal-use trading journal web app inspired by modern trading analytics workflows, but intentionally simplified for a single local user.

## MVP scope

Included:
- local single-user password gate
- dashboard with KPI cards and charts
- trade journal with filters, sorting, pagination
- add and edit trade flows
- screenshot uploads to local storage
- CSV import with manual column mapping and saved import templates
- reports for setup, symbol, weekday, time of day, mistakes, emotions, plan adherence, screenshot-backed trades, and monthly performance
- playbooks / setups with rule tracking
- daily and weekly reviews
- settings for accounts, tags, and default risk
- Prisma + SQLite seed data

Intentionally excluded from MVP:
- broker integrations
- realtime market data
- mobile app
- multi-user accounts
- billing / SaaS plumbing
- community / mentor features
- replay / backtesting engine

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- React Hook Form + Zod
- Recharts
- TanStack Table

## Folder structure

```text
app/
  api/
    import-csv/
    login/
    logout/
    playbooks/
    reviews/
    settings/
    trades/
    upload/
  dashboard/
  imports/
  login/
  playbooks/
  reports/
  reviews/
  settings/
  trades/
components/
  charts/
  forms/
  layout/
  trades/
  ui/
lib/
prisma/
public/
  uploads/
README.md
middleware.ts
next.config.ts
package.json
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy env file

```bash
cp .env.example .env
```

3. Create the database and generate Prisma client

```bash
npx prisma db push
```

4. Seed demo data

```bash
npm run seed
```

5. Start the app

```bash
npm run dev
```

6. Open `http://localhost:3000`

Register your own account at `/register`. Demo credentials are only available if you run `npm run seed`.

## Notes

- Uploaded screenshots are stored in `public/uploads`.
- CSV imports create trades first; you can enrich imported trades later from the edit flow.
- The futures P&L multiplier is currently a simple default of `20` in `lib/trade-math.ts`. Adjust it if you want more instrument-specific contract math.
- This app is designed to favor behavior review and journaling depth over automation complexity.


## Multi-user authentication update

This build adds secure multi-user authentication with registration, login, logout, protected routes, and user-scoped data.

### New auth flow
- Register at `/register`
- Log in at `/login`
- Sessions persist in an httpOnly cookie and server-side `Session` table
- Every account, trade, playbook, tag, review, import template, and setting is scoped to the authenticated user

### Database changes
Run a new migration after pulling this version:

```bash
npx prisma db push
```


If you are upgrading from the older single-user build, this version keeps existing rows by adding nullable ownership fields first. On the first successful login, legacy rows without a user owner are automatically claimed by that account so your old trades remain visible.

If you want demo data too:

```bash
npm run seed
```

Demo login after seeding:
- email: `demo@arminir.local`
- password: `tradejournal123`

### End-to-end auth test
1. Visit `/register`
2. Create user A
3. Add a trade, a tag, and a playbook
4. Log out
5. Register user B or log in as another user
6. Confirm user B cannot see user A data
7. Log back in as user A and confirm the original data is still there
8. Try opening `/dashboard` while logged out and confirm redirect to `/login`
9. Try deleting or editing a trade from another account and confirm it is blocked server-side

### Main files changed for auth
- `prisma/schema.prisma` — added `User`, `Session`, and `userId` ownership fields
- `lib/auth.ts` — password hashing, session creation, current-user lookup, auth guards
- `middleware.ts` — protected route handling
- `app/login/page.tsx` — login UI
- `app/register/page.tsx` — registration UI
- `app/api/login/route.ts` — login backend
- `app/api/register/route.ts` — registration backend
- `app/api/logout/route.ts` — logout backend
- `lib/data.ts` — user-scoped data access
- `lib/accounts.ts` — per-user default accounts
- `app/api/trades/*` — ownership checks for create/update/delete
- `app/api/import-csv/route.ts` — user-scoped imports and templates
- `app/api/settings/*` — user-scoped settings routes
- `app/imports/page.tsx`, `app/playbooks/page.tsx`, `app/reviews/page.tsx`, `app/settings/page.tsx` — authenticated user filtering
- `prisma/seed.ts` — demo user and demo data that work with auth

## Windows / VS Code quick start

The `.env` file included in this archive contains only local, non-secret SQLite settings. If it is missing, copy `.env.example` to `.env` in the project root (PowerShell: `Copy-Item .env.example .env`).

```powershell
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000/register to create an account.

`prisma db push` initializes a fresh SQLite database without requiring committed migrations. **For an existing database, back up `prisma/dev.db` before schema changes.** `npm run seed` is optional; it creates demo data and deletes existing data, so it is blocked if accounts already exist unless `ALLOW_DESTRUCTIVE_SEED=true` is set deliberately.

To check TypeScript: `npm run lint`. For a production build: `npm run build`.

## Tailwind / PostCSS version mismatch

This project uses Tailwind CSS **3.4.17**, with the v3 PostCSS plugin (`tailwindcss`) and `@tailwind` directives. If you previously installed Tailwind v4, stop the dev server, remove `node_modules`, `package-lock.json` and `.next`, then run `npm install` and `npm run dev` again. On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, .next -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

Do not run `npm install tailwindcss@latest` with this v3 configuration.
