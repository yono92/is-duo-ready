# Database code and migration ownership

The application uses local PostgreSQL during development and Supabase PostgreSQL in Production. SQL migrations are product source: contributors need them to recreate the tables, constraints, permissions, row-level security (RLS), functions and triggers. They contain schema definitions, not production rows or credentials.

## What is standard and what is project-specific?

- Versioned SQL migrations are a normal PostgreSQL/Supabase practice. Supabase's CLI normally uses `supabase/migrations` and its own migration history. See [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations).
- This project currently uses `db/migrations`, a TypeScript runner (`scripts/lib/database.ts`) and the `duo_migrations.history` table. That is a project-specific choice to run the same SQL against standalone local PostgreSQL and hosted PostgreSQL. It is **not** the standard Supabase CLI layout or history. Do not run two independent migration systems against the same schema without reconciling their histories.
- PL/pgSQL is PostgreSQL's procedural language for database functions and triggers. Supabase supports it directly; it is not another web backend service. See [database functions](https://supabase.com/docs/guides/database/functions).

## Current responsibilities

| Layer | Responsibility |
| --- | --- |
| TypeScript | UI/server actions, verified authentication, external HTTP collection, image files, command-line tools and tests |
| SQL constraints and RLS | Valid stored values, uniqueness, and which actor may read or write rows |
| PL/pgSQL functions | Draft save/import, publication snapshots and review history, collection claims/completion, and submission intake |

The database functions make multi-table state changes atomic and keep permission checks at the write boundary. This is a valid architecture, but Supabase does not require all of this application workflow to live in SQL. It makes that logic harder for TypeScript-only contributors to navigate. Moving selected workflows into server-side TypeScript transactions is a separate design change; it must preserve authorization, locking, conflict detection, and complete rollback on failure.

## Maintaining the existing deployment

Five migration files have already been applied and checksummed locally and on the hosted project. Do not rewrite them, rename their history entries or replace the migration runner as part of a language-only refactor. New schema changes need new migration files and integration tests. A future switch to Supabase CLI migrations needs an explicit baseline/history transition first.

The TypeScript conversion changes the runner's implementation language only. It does not modify SQL, RLS, live data or the deployed migration history.
