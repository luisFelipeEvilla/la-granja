# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm postinstall  # Runs prisma generate (auto-runs after install)
```

After modifying the Prisma schema, run `pnpm prisma generate` manually.

## Architecture

**La Granja** is a dairy farm management system built with Next.js 14 App Router, MongoDB via Prisma, and a Spanish-language UI.

### Auth & Routing

- Middleware at `src/middleware.ts` protects all routes, redirects `/` → `/dashboard`
- `AuthContext` (`src/contexts/AuthContext.tsx`) stores user in state + cookie (`nookies`, 30-day)
- Two roles: `ADMIN` (full access) and `USER` (only `/dashboard/sheets`)
- Auth page: `/auth` — sign-in posts to `/api/auth/signin`

### Database

- MongoDB via Prisma. Connection string in `DATABASE_URL` env var.
- Key models: `User`, `Provider`, `MilkRouteLog` (milk collected per provider), `Product`, `ProductLog` (production output)
- Singleton client at `src/db/client.ts` with global caching for dev

### UI Stack

- **NextUI v2** (`@nextui-org/react`) — form controls, buttons, tables. Requires `nextui()` plugin in `tailwind.config.js` and `NextUIProvider` wrapper.
- **Tremor** — charts and dashboard metrics (bar, line, donut)
- **Tailwind CSS** with Tremor color theme extended in config
- `@react-pdf/renderer` for invoice PDF generation (dynamically imported to avoid SSR issues)

### Key Directories

| Path | Purpose |
|------|---------|
| `src/app/api/` | API routes (auth, providers, products, productLog, sheets) |
| `src/app/dashboard/` | Dashboard pages (providers, invoices, production, sheets) |
| `src/app/auth/` | Login page with its own layout (includes `NextUIProvider`) |
| `src/components/` | Shared UI (sidebar, inputs, buttons, PDF components) |
| `src/controllers/` | Business logic separated from route handlers |
| `src/contexts/` | React contexts (AuthContext) |
| `src/types/` | Shared TypeScript types |

### Path Alias

`@/*` maps to `src/*` (configured in `tsconfig.json`).
