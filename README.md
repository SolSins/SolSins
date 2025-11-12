# SolSins — starter

Starter monorepo for the SolSins project (Next.js + Solana Pay + Prisma).

Quick start (Codespaces):

1. Open this repo in GitHub Codespaces.
2. In Codespaces terminal:
   - `pnpm i`
   - `pnpm -C apps/web prisma generate`
   - `pnpm -C apps/web prisma migrate dev --name init` (ensure DATABASE_URL is set)
   - `pnpm dev`

Environment: see `apps/web/.env.example`. For initial dev you can run Postgres via devcontainer + docker-compose (included).

This starter includes:
- `apps/web` Next.js app (App Router) with API routes `/api/checkout` and `/api/confirm`
- `apps/web/data/solana-wallets.json` — add your pool of addresses here
- `apps/web/providers/solana-wallets.ts` — selects a random empty wallet
- Prisma schema (basic Order / EphemeralWallet)

Security note: this is an early dev skeleton. Do not store private keys in plain text. Consider KMS for production secrets.
