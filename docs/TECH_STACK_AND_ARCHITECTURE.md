# Tech Stack and Architecture

Oct 14, 2026 · @Archibong

## 1. Decisions summary

The stack is Next.js with TypeScript on the front, and Supabase for everything behind it. It suits a solo developer working with opencode, enforces the safeguarding rules in the database, and runs on free or low tiers during the pilot.

| Layer | Choice | Why | Alternative considered |
| --- | --- | --- | --- |
| Language | TypeScript throughout | One language for the app, server functions, and tests; strong types catch mistakes that AI-written code makes | Plain JavaScript |
| Front end | Next.js (React, App Router) | Server components send less JavaScript to the browser, which helps low-data users; large ecosystem and good AI-tool support | Vite and React single-page app; SvelteKit |
| Styling and UI | Tailwind CSS with shadcn/ui components | Small output, components are copied into the project so there is no heavy library to download | MUI, Chakra |
| Database | Supabase Postgres | Row-level security matches the permission design; relational data suits hiring, tasks, and records | Firebase; a custom Node API with Postgres |
| Auth | Supabase Auth (email and password; magic link later) | Built in and linked to the database policies | Auth0, Clerk |
| Realtime chat | Supabase Realtime | Same platform and same security rules as the tables | A separate chat service |
| Files | Supabase Storage (private buckets) | Policies live next to the data | Cloudinary, S3 |
| Scheduled jobs | Supabase `pg_cron` calling Edge Functions | Scenario delivery, absence flags, and reminders stay near the data | An external scheduler |
| Server logic | Postgres functions for rules; Edge Functions for PDFs, email, and signed links | Permission checks sit in the database; Edge Functions handle what SQL cannot | A separate Node server |
| Automations | Make.com webhooks for non-critical extras (trainer digests, email notices) | Already familiar to the developer; fast to change without redeploying | Doing everything in code |
| Audio and video | Jitsi Meet, opened by link in the MVP | Free to start and no media servers to run; optional for low data | Google Meet links; LiveKit later |
| Email | A transactional provider (Resend or Brevo) through Supabase Auth's SMTP settings | The built-in email service is rate-limited and for testing only | Supabase default email |
| PDFs | A PDF library on the server (certificates, records) | Consistent output, and nothing heavy sent to the browser | Browser print to PDF |
| Hosting | Vercel for the app (Netlify is a fair alternative) | Best fit for Next.js, with simple previews | Netlify, Cloudflare Pages |
| Code and CI | GitHub with GitHub Actions | Lint, type check, and database tests on every push | GitLab |
| Monitoring | Sentry for errors; Supabase logs; a free uptime check | Early warning during the pilot | Logging only |
| AI | None in the MVP; Claude API behind an Edge Function in version 2, with usage caps | Avoids ongoing cost and risk until it is needed | AI-played staff (rejected on cost) |

## 2. Architecture

&#91;embedded content: architecture · app, Supabase, external tools\]

The browser loads pages from the Next.js app on Vercel, which talks to Supabase on the user's behalf. Chat and file uploads go straight from the browser to Supabase, still under the same security rules. Edge Functions handle what SQL cannot (PDFs, signed links, public record links, email), and scheduled jobs run inside Supabase. Jitsi is opened by link and is not part of the app's own servers.

## 3. Low-data design

Interns pay for their own data, so every screen is built to stay light. Targets are starting points to confirm by testing on a throttled connection.

| Technique | What it means in practice | Target |
| --- | --- | --- |
| Server-rendered pages | Use Next.js server components by default; add client JavaScript only where a screen needs interaction | First page load under 500 KB; under 150 KB of JavaScript per route (compressed) |
| No web fonts | System font stack only | 0 KB of fonts |
| Few images | No decorative images; icons as inline SVG; avatars resized on upload | Avatars 200 KB or less; none required |
| Compression and caching | Brotli on the host; long cache times for static files; a service worker caches the app shell | Repeat visits load mostly from cache |
| Small lists | Paginate everything; chat loads the latest 50 messages and older ones on request | Under 50 KB per list request |
| No polling | Realtime subscriptions only for the screen the user has open; none in the background | Idle screens use almost no data |
| Compress uploads | Resize and compress images in the browser before upload; cap file sizes | Submissions 10 MB or less; CVs 2 MB |
| Drafts survive drops | Autosave messages and submissions on the device and sync when the connection returns | No lost work on a dropped connection |
| Data saver mode | A setting that turns off avatars, auto-refresh, and live typing indicators | Switchable per user |
| Audio first | Calls default to audio only; video is opt-in | Video never required |

**How to check it:** run the app on a throttled Slow 3G profile in the browser tools, and add a bundle-size budget to the build so a heavy change fails the check before it ships.

## 4. How the key features work

The rule of thumb: permission-sensitive logic lives in the database as functions, and the app only calls them.

| Feature | How it works |
| --- | --- |
| Realtime chat | The app subscribes to new rows in `messages` for the open channel; Supabase Realtime applies the same row-level security, so a user only receives messages they may read. Sending is a plain insert; history loads 50 at a time |
| Clock-in and clock-out | The functions `clock_in()` and `clock_out()` check that the account is active, the time is inside the working window, and that no row exists for the day; clock-out computes `minutes_worked` |
| Absence and lateness | A nightly `pg_cron` job marks missed days, flags lateness, and notifies the manager and trainer after the set delay |
| Hiring steps | Functions such as `submit_application()`, `advance_application()`, `make_offer()`, and `accept_offer()` check the caller's role, move the status, and write the audit log; `accept_offer()` also creates the company member |
| Scenario events | A `pg_cron` job runs every minute and calls `deliver_due_events()`, which marks due events delivered and creates the email, chat message, or task for each target. A trainer playing a character posts in the normal chat |
| Task review loop | Submitting inserts a `submissions` row and moves the task to in review; a review inserts a `reviews` row and moves the task status, all in one function so the two never disagree |
| Guardian consent | The guardian gets an email with a one-time link to read the summary and confirm. A trainer then verifies the guardian's identity, which flips `guardian_links.status` and activates the intern's account |
| Notifications | Database triggers insert `notifications` rows; an Edge Function or a Make.com webhook sends the email copy |
| Record release | `compile_record()` gathers hours, scores, and reviews; `release_record()` marks it released and audits it; an Edge Function builds the certificate PDF and stores it |
| Public record link | An Edge Function `get-record` takes a token, checks that the link is active and the record is released, returns a fixed set of fields, and writes the view to the audit log. It is rate-limited, and the `anon` role has no table access |
| Signed file links | An Edge Function checks permission, then creates a short-lived signed link for a CV or submission |

## 5. Environments, deployment, and backups

Three environments keep experiments away from real interns' data.

| Environment | Purpose | Backend | Data |
| --- | --- | --- | --- |
| Local | Day-to-day building with opencode | Supabase CLI running locally in containers | Seed data only |
| Staging | Testing releases and trainer walkthroughs | A separate Supabase project | Fake interns and companies |
| Production | The pilot cohort | A separate Supabase project | Real data |

**Deployment**

- All schema changes are migration files in the repository, reviewed and applied in order: local, then staging, then production. Never edit the production schema by hand.
- Each pull request gets a preview of the app. The main branch deploys to staging automatically, and production is deployed by a manual approval.
- GitHub Actions runs lint, type check, the database policy tests, and the bundle-size budget on every push.
- Secrets live in the host's environment settings and never in the repository. The Supabase service key exists only in server code.

**Backups and recovery**

- Turn on daily database backups and confirm the retention that the chosen plan provides. If point-in-time recovery is not included, export a nightly dump to separate storage.
- Practise one restore on staging before the pilot starts.
- Keep the migrations and seed scripts in the repository so an environment can be rebuilt from scratch.

**Monitoring**

- Sentry for front-end and Edge Function errors.
- Supabase logs and usage dashboards, checked weekly during the pilot.
- An uptime check on the main page, and an alert to the developer's email or phone.

## 6. Project structure and conventions for opencode

Opencode works best with a predictable layout and a rules file it reads every session.

```text
/
  AGENTS.md                  rules for opencode
  docs/                      PROJECT_SPEC, ARCHITECTURE, ROLES_PERMISSIONS,
                             UI_GUIDELINES, TASKS
  supabase/
    migrations/              ordered SQL files
    functions/               Edge Functions: get-record, signed-url,
                             make-certificate, send-email
    tests/                   policy tests, one file per table group
    seed.sql                 demo school, cohort, companies, users
  src/
    app/                     routes: auth, dashboard, hiring, tasks, chat,
                             attendance, trainer, records
    features/                one folder per feature, with its components,
                             actions, and queries
    components/              shared UI pieces
    lib/                     Supabase clients, permission helpers
    types/                   generated database types
  .github/workflows/         CI checks
```

**Conventions to put in `AGENTS.md`**

1. Generate database types from the schema and never hand-write them.
2. Call database functions for anything permission-sensitive; never reproduce a permission rule in the front end only.
3. Use the service key only in server code, never in anything sent to the browser.
4. Every migration comes with a policy test, and a failing test blocks the change.
5. Ask before adding a dependency, and prefer what is already in the project.
6. Keep the page and JavaScript budgets from the low-data section.
7. Ask before changing the schema or a policy, and update the docs in the same change.
8. Build one task from `TASKS.md` at a time and stop at its acceptance criteria.

## 7. Cost drivers for the pilot

The pilot (about 20 interns, 6 weeks) should fit within free or low tiers, but this is not verified. Plans and prices change often, so check each provider's current pricing page before committing. No figures are given here on purpose.

| Item | What drives the cost | What to confirm |
| --- | --- | --- |
| Supabase | Database size, file storage, data transfer, realtime connections, backups | Whether the free tier pauses idle projects or lacks backups, which would force a paid plan for production |
| Hosting (Vercel or Netlify) | Bandwidth, serverless usage, team seats | Whether the free tier allows this kind of project and its limits |
| Email provider | Number of emails per month | The daily and monthly free limits against about 20 interns plus guardians |
| Domain name | Yearly registration | A single domain with subdomains for staging |
| Error monitoring | Event volume | The free allowance |
| Audio and video | None if using Jitsi's hosted service; hosting cost if self-hosted | Terms for the hosted option, and call quality at low bandwidth |
| Make.com | Operations per month | Whether the existing plan covers the notices |
| Legal review | Hours of a lawyer's time | A quote for the privacy policy, consent form, and terms |
| Developer time | Four months of solo work | Realistic weekly hours available |

AI usage is zero in the MVP, which is the main cost control in the whole design.

## 8. Risks and open decisions

**Risks**

- **Latency from Nigeria.** Choose the Supabase region nearest to Nigeria that is offered, and measure real response times from a local connection before the pilot.
- **Free-tier limits.** Idle pausing, backup limits, or connection caps could hurt a live cohort; budget for a paid production plan.
- **Jitsi quality.** Calls may stutter on weak connections. Keep audio-first, and plan a fallback such as a meeting link from another tool.
- **Policy mistakes.** Row-level security errors are silent until tested; the policy test suite is the safeguard and must be written with the policies.
- **AI-written code drift.** Opencode may add dependencies or bypass the permission functions; the `AGENTS.md` rules and CI checks guard against it.
- **Single point of failure.** One developer and one backend project; keep backups and write the runbook for restoring.

**Open decisions**

- Vercel or Netlify for hosting.
- Resend or Brevo for email, once free limits are checked.
- Which Jitsi option: the public instance, a hosted plan, or self-hosting later.
- Whether to use Make.com for notification emails in the MVP or keep everything in code.
- Whether trainers need a mobile-friendly view even though interns are desktop-first.
- Domain name for the platform.
