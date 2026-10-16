# AGENTS.md

Rules for working on the Virtual Workplace Internship Platform. Read this file and `docs/PROJECT_SPEC.md` at the start of every session. If a rule here conflicts with a request, say so and ask before acting.

## What this project is

A web platform that simulates a remote workplace for digital-skills trainees. Interns apply to simulated companies, are hired, work daily tasks for 6 weeks (4 hours a day), and receive a verified record. Staff roles are played by interns and trainers, not AI. Some users are under 18, so safety rules are part of the core design, not an extra.

## Stack

- TypeScript everywhere.
- Next.js (App Router), Tailwind CSS, shadcn/ui components.
- Supabase: Postgres with row-level security (RLS), Auth, Realtime, Storage, Edge Functions, `pg_cron`.
- Hosting: Vercel. CI: GitHub Actions.
- No AI features in the MVP. Do not add any AI API calls.

## Documents you must follow

Read the relevant one before changing the area it covers:

| Topic | File |
| --- | --- |
| Scope and features | `docs/PROJECT_SPEC.md` |
| Who can do what | `docs/ROLES_PERMISSIONS.md` |
| Tables and columns | `supabase/migrations/` and `docs/SCHEMA.md` |
| Security policies | `docs/RLS_RULES.md` |
| Screens | `docs/UI_GUIDELINES.md` |
| Current task | `docs/TASKS.md` |

If the code and a document disagree, stop and ask which is right. Do not silently pick one.

## How to work

1. Do one task from `docs/TASKS.md` at a time. Stop when its acceptance criteria pass.
2. Before writing code, state in a few lines what you will change and which files.
3. Make small, reviewable changes. Do not refactor unrelated code.
4. Ask before adding a dependency. Prefer what is already installed.
5. Ask before changing the schema or any security policy.
6. After a change, run lint, type check, and the tests, and fix what fails before reporting done.
7. Update the relevant document in the same change when behaviour or structure changes.

## Security rules (never break these)

- Every table has RLS enabled. A new table without RLS and policies is not finished.
- Write policies per action (select, insert, update, delete). Never use `for all`.
- Authorise from database tables (`user_roles`, `cohort_members`, `company_members`, `guardian_links`). Never trust user metadata, URL parameters, or values sent from the browser for roles or ownership.
- Use `(select auth.uid())` inside policies, not bare `auth.uid()`.
- Helper functions are `security definer`, set a fixed `search_path`, and live in the `private` schema, which the API does not expose.
- Permission-sensitive actions are database functions (for example `clock_in`, `accept_offer`, `release_record`). The front end calls them. Do not rebuild a permission rule in the front end only.
- The Supabase service key is used only in server code (Edge Functions, server actions that need it). It must never appear in code sent to the browser or in the repository.
- Views use `security_invoker = true`.
- Never hard-delete rows in `messages`, `safeguarding_reports`, `consent_records`, or `audit_log`. Never update or delete `audit_log` rows.
- Sensitive writes (role changes, overrides, record release, deletions) write to `audit_log`.
- Files go in private storage buckets and are opened with short-lived signed links.

## Under-18 rules (restrictive policies, always apply)

- An under-18 account stays inactive until guardian consent is recorded.
- No direct messages between an adult and an under-18. No employers in channels with an under-18.
- Interviews with an under-18 applicant need a second adult.
- No public record link for an under-18 without recorded sharing consent.
- Age is computed from `date_of_birth` on every request. Never store an `is_minor` flag.

## Code conventions

- Generate database types from the schema (`supabase gen types`). Never hand-write them.
- Organise code by feature in `src/features/<feature>/` (components, server actions, queries). Shared pieces go in `src/components/` and `src/lib/`.
- Tables are plural snake_case, columns snake_case, foreign keys `<singular>_id`. Every school table carries `organization_id`; scoped tables also carry `cohort_id` and `company_id`.
- Schema changes are new migration files in `supabase/migrations/`, never edits to old ones and never changes made by hand in production.
- Every migration that adds or changes a policy comes with a policy test in `supabase/tests/`.
- Use server components by default. Add `"use client"` only when a component needs interactivity.
- Validate all inputs on the server (use a schema validator) even if the form validates them.
- Handle errors visibly: show a clear message, never fail silently.
- No `any` types, no disabled lint rules, no commented-out code left behind.

## Low-data rules

Interns pay for their own data. Keep every screen light.

- First page load under 500 KB; under 150 KB of JavaScript per route (compressed). These are starting targets.
- System fonts only. No decorative images. Icons as inline SVG.
- Paginate every list. Chat loads the latest 50 messages, older ones on request.
- No background polling. Use Realtime only for the screen that is open.
- Autosave drafts (messages, submissions) on the device and sync when back online.
- Audio-first calls. Video is never required. Calls use an external link in the MVP.

## UI rules

- Desktop first. It must still work on a phone without breaking, but do not design for phone first.
- Follow `docs/UI_GUIDELINES.md` and the wireframes. Use real `<button>`, `<a>`, and `<label>` elements. Touch targets at least 44 px.
- Show a visible notice that trainers can read all channels.

## Do not build yet

Anything in the "Version 2" or "Out of scope" lists in `docs/PROJECT_SPEC.md`, including the employer portal, AI features, payments, multi-school setup screens, and a public showcase of interns. If a task seems to need one of these, stop and ask.

## When unsure

Ask a short question rather than guessing. For anything involving minors, permissions, or data deletion, always ask first.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
