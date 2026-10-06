# Contributing to Trackr

Thanks for contributing. This repo is a pnpm monorepo: `apps/web` (React 19 + Vite), `apps/api` (Express 5), `packages/shared` (Zod contracts).

## Prerequisites

- Node.js 20+
- pnpm 10 (`corepack enable` if needed)
- Postgres locally (required for API integration tests and local dev)

## Setup

```bash
pnpm install

cp apps/api/.env.example apps/api/.env   # DATABASE_URL, JWT_SECRET
cp apps/web/.env.example apps/web/.env   # VITE_API_URL, VITE_SITE_NAME

pnpm --filter api db:migrate:local
pnpm dev   # shared build + web + api
```

Open http://localhost:5173 and sign up.

Partial dev servers:

```bash
pnpm dev:web
pnpm dev:api
```

## Architecture rules

These keep the codebase coherent. Follow them for any PR:

1. **One request per board.** No per-card fetch. Columns and cards must never be out of step.
2. **One owner of ordering.** Only `apps/api/src/application.repository.ts` may produce a position. Everything else consumes an id list.
3. **One contract.** Every request/response is a Zod schema in `packages/shared` with types via `z.infer`. Do not duplicate schemas in `web` or `api`.
4. **Auth:** JWTs in `httpOnly` cookies only, never in JS. Refresh tokens stored as SHA-256 hashes; refresh cookie scoped to `/auth`.

If your change needs to break one of these, open an issue first.

## Workflow

1. Fork and create a branch from `main`: `feat/<short-name>` or `fix/<short-name>`.
2. Keep PRs small and focused. One change per PR.
3. Update or add tests for behavior changes.
4. Ensure `pnpm test` and `pnpm build` pass before opening a PR.
5. Link any related issue in the PR description and describe behavior change + how you tested it.

## Commits

Use clear, imperative messages: `Add silence badge to stale cards`, not `stuff` or `wip`. Keep history tidy — squash noisy commits before review.

## Tests

```bash
pnpm test        # all three Vitest projects: api, web, shared
pnpm test:api    # api only
pnpm --filter web test
```

- `shared`: schema accept/reject cases.
- `api`: service/controller units use the hand-written fake repository; integration tests use a real Postgres and refuse to run unless the DB name ends in `_test` (use `.env.test`).
- `web`: CSV writer, note ordering, board order, filenames; stats in `lib/analytics.ts` are pure functions — cover new derivations there.

## Code style

- TypeScript strict. No `any` without justification; prefer `unknown` + narrowing.
- `web` has ESLint (`pnpm --filter web lint`). Fix lint errors, don't suppress them without a comment explaining why.
- Match existing naming and file layout (`apps/web`, `apps/api`, `packages/shared`). Don't restructure folders in a feature PR.
- No secrets in code or fixtures. `.env` files are gitignored; only `.env.example` is committed.

## Reporting bugs / requesting features

Open an issue with: steps to reproduce (or use case), expected vs. actual behavior, and environment (OS, Node version, browser if UI-related). Logs and minimal repros get fixed fastest.

## License

By contributing, you agree your contributions are under the MIT License (see `LICENSE`).
