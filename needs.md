# Production deployment checklist

Below is a focused list of **required/likely** changes before publishing this app publicly, including the **exact file paths** you should edit or reference.

## 1) Configure the database connection (required)
- **Why:** Prisma reads `DATABASE_URL` from the environment, so production must provide it.
- **Where to edit:**
  - Deployment environment variables (not in repo).
  - Prisma schema shows the dependency: `prisma/schema.prisma` (datasource `url = env("DATABASE_URL")`).

## 2) Replace hard-coded seed admin credentials (required for production safety)
- **Why:** The seed scripts currently create a hard-coded admin account meant for development only.
- **Where to edit:**
  - `scripts/seed.ts`
  - `f2l-fresh/scripts/seed.ts`
- **What to change:** Set a secure admin email/password or remove admin creation in production.

## 3) Update admin UI placeholders/logs (optional but recommended)
- **Why:** The admin login placeholder and some dashboard logs reference a specific email.
- **Where to edit:**
  - `src/app/admin-portal-secure-2025-x7k9m2/page.tsx`
  - `src/app/admin-portal-secure-2025-x7k9m2/dashboard/page.tsx`
  - `f2l-fresh/src/app/admin-portal-secure-2025-x7k9m2/page.tsx`
- **What to change:** Replace with your real admin email or a generic placeholder.

## 4) Provide your own stream/playlist data (if needed)
- **Why:** Seed data is demo content; production should load real streams.
- **Where to edit:**
  - `scripts/seed.ts`
  - `f2l-fresh/scripts/seed.ts`

## 5) (Optional) Review feature flags for production behavior
- **Why:** Feature flags are stored in `localStorage` and can toggle major UI features.
- **Where to edit:**
  - `src/app/admin-portal-secure-2025-x7k9m2/dashboard/page.tsx`
  - `src/app/page.tsx`
  - `src/app/stream/[id]/page.tsx`

## 6) (Optional) Harden security/authentication
- **Why:** Admin auth is currently a direct DB lookup in API routes; production should use hashed passwords and real sessions.
- **Where to edit:**
  - `src/app/api/admin/auth/route.ts`
  - `src/app/api/users/route.ts`

## 7) Set runtime environment values for Next.js
- **Why:** Next.js expects env vars for production; ensure `.env` or deployment config matches.
- **Where to edit:**
  - Deployment environment variables (not in repo)
  - `next.config.ts` if you add runtime config
