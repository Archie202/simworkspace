# TASKS.md

The build, broken into small ordered tasks. Give opencode **one task at a time**. A task is finished only when every box under "Done when" can be ticked. Do not start the next task until the current one is finished and committed.

How to use a task with opencode:

1. Open a fresh session. Tell it: "Read AGENTS.md and docs/PROJECT_SPEC.md, then do task T## from docs/TASKS.md."
2. Ask it to state its plan first. Review the plan before it writes code.
3. When it reports done, run the checks yourself (lint, type check, tests) and try the feature by hand.
4. Commit with the task number in the message, then tick the task here.

Timeline guide (to a February 2027 pilot): Phase 0 and 1 in weeks 1 to 3, Phase 2 in weeks 4 to 7, Phase 3 in weeks 8 to 11, Phase 4 in weeks 12 to 14, Phase 5 in weeks 15 to 17.

Every task also meets the global rules in `AGENTS.md` (security, under-18, low-data, conventions) and the definition of done in `PROJECT_SPEC.md`. They are not repeated below.

---

## Phase 0: Setup

### T01 Project skeleton and tooling
**Depends on:** nothing
**Do:** Create the Next.js (TypeScript, App Router) project with Tailwind and shadcn/ui. Add ESLint, Prettier, and a type-check script. Create the folder layout from `AGENTS.md`. Add `docs/` with the specification files.
**Done when:**
- [ ] `npm run dev` shows a blank home page
- [ ] `npm run lint` and `npm run typecheck` pass
- [ ] The folders `src/app`, `src/features`, `src/components`, `src/lib`, `src/types`, `supabase/migrations`, `supabase/functions`, `supabase/tests` exist
- [ ] `AGENTS.md` is at the repo root and the spec files are in `docs/`

### T02 Local Supabase and CI
**Depends on:** T01
**Do:** Set up the Supabase CLI with a local project. Add environment variable handling with a documented `.env.example` (no secrets committed). Add a GitHub Actions workflow that runs lint, type check, and database tests.
**Done when:**
- [ ] `supabase start` runs locally and the app connects to it
- [ ] `.env.example` lists every variable; `.env` is git-ignored
- [ ] The workflow runs on every push and fails when a check fails
- [ ] A bundle-size budget check exists in the workflow (limits from `AGENTS.md`)

### T03 App shell and design basics
**Depends on:** T01
**Do:** Build the layout from the wireframes: top bar, left navigation, content area. Use system fonts, plain tokens for colour and spacing, and one reusable button, input, card, and badge component. Navigation items depend on role, but use a placeholder role for now.
**Done when:**
- [ ] The shell renders at 1366 x 768 without horizontal scroll
- [ ] The layout still works on a narrow phone width
- [ ] No web fonts are loaded and no images are used
- [ ] All interactive elements are real buttons or links with visible focus states

---

## Phase 1: Foundation

### T04 Core schema migration
**Depends on:** T02
**Do:** Write a migration for the enums and core tables: `organizations`, `profiles`, `user_roles` (with `is_safeguarding_lead`), `guardian_links`, `cohorts`, `cohort_members`, `companies`, `company_members`. Follow `docs/SCHEMA.md` exactly. Add indexes on `organization_id`, `cohort_id`, `company_id`, and member ids.
**Done when:**
- [ ] `supabase db reset` applies the migration with no errors
- [ ] Generated types are committed in `src/types`
- [ ] Every table has `organization_id` where the schema says so
- [ ] `updated_at` is set automatically on update

### T05 Helper functions
**Depends on:** T04
**Do:** Create the `private` schema and the helper functions: `current_org_id`, `has_role`, `is_trainer_of`, `is_cohort_member`, `company_function_of`, `is_minor`, `is_guardian_of`, `is_safeguarding_lead`, `is_active`. All are `security definer`, stable, with a fixed `search_path`.
**Done when:**
- [ ] Functions exist in the `private` schema and are not callable through the API
- [ ] A test proves `is_minor` is true for a 17-year-old and false once the date passes the 18th birthday
- [ ] A test proves each function returns the right result for a seeded user of each role

### T06 RLS for core tables, with tests
**Depends on:** T05
**Do:** Enable RLS and write policies for the core tables as in `docs/RLS_RULES.md` section 3. Add column-level limits for `profiles` and the `profile_directory()` function. Write policy tests.
**Done when:**
- [ ] Every core table has RLS enabled
- [ ] A user in organisation A cannot read any row of organisation B
- [ ] An intern cannot read another intern's `profiles` row, but `profile_directory()` returns teammates' display name and avatar only
- [ ] An intern cannot change their own `status`, `email`, or `date_of_birth`
- [ ] The `anon` role cannot read any table
- [ ] All tests run in CI

### T07 Seed data
**Depends on:** T06
**Do:** Create `supabase/seed.sql` with two organisations, one cohort, two companies, one user of every role in each organisation, an adult intern and an under-18 intern in the same company, and a verified guardian link for the under-18.
**Done when:**
- [ ] `supabase db reset` loads the seed
- [ ] Test users have known development-only logins documented in a README section
- [ ] No real personal data is used

### T08 Sign-in and sessions
**Depends on:** T07
**Do:** Implement email and password sign-in with Supabase Auth, sign-out, password reset, and session handling in server components. Public sign-up is available with role selection (intern, trainer, school admin). New accounts are created inactive until email verification and role assignment. Build the login and signup screens from the wireframe.
**Done when:**
- [ ] A seeded user can sign in and out
- [ ] A new user can sign up with role selection and is created inactive
- [ ] Unauthenticated users are redirected to login from every protected route
- [ ] The login screen shows the under-18 consent note
- [ ] A user whose status is not `active` sees a clear message and cannot enter

### T09 Role-aware navigation
**Depends on:** T08
**Do:** Load the user's roles, cohort, company, and function on the server and drive the navigation from them. Interns see Dashboard, Job board, Tasks, Chat, Meetings, My record. HR interns also see Hiring and Attendance. Managers see review items. Trainers get the trainer navigation.
**Done when:**
- [ ] Each seeded role sees only its own menu items
- [ ] Opening a URL the role may not use shows a not-allowed page and returns no data
- [ ] The role is read from the database each request, never from the browser

### T10 Trainer setup screens
**Depends on:** T09
**Do:** Let trainers and school admins create cohorts, companies, and invited users; assign cohort and company roles and functions. Invitations use Supabase Auth invites. Include date of birth for each intern.
**Done when:**
- [ ] A trainer can create a cohort with start date, end date, daily hours, and working start time
- [ ] A trainer can create a company with industry, description, and culture
- [ ] A trainer can invite an intern and add them to a cohort
- [ ] A trainer cannot touch another organisation's cohort
- [ ] Role changes write to `audit_log` (create the table now if it does not exist)

### T11 Guardian consent flow
**Depends on:** T10
**Do:** For an invited intern under 18, set status `pending_consent` and email the guardian a one-time link to read the safeguarding summary and confirm. A trainer then verifies the guardian and records consent, which activates the account. Add the restrictive "no activity before consent" policy.
**Done when:**
- [ ] An under-18 intern cannot sign in to the workspace until consent is recorded and verified
- [ ] The guardian can confirm without creating an account
- [ ] A `consent_records` row stores the text version, time, and who recorded it
- [ ] Consent evidence is stored in the `consent-evidence` bucket, readable only by trainers and school admin
- [ ] A policy test shows an inactive under-18 cannot insert any cohort data
- [ ] Turning 18 in a test lifts the restriction

---

## Phase 2: Hiring

### T12 Job postings
**Depends on:** T10
**Do:** Migration and policies for `job_postings` and `rubrics`. Build screens for HR interns, managers, and trainers to create, edit, open, and close postings.
**Done when:**
- [ ] Draft postings are visible only to HR or manager of that company and trainers
- [ ] Open postings are visible to everyone in the cohort
- [ ] Policy tests cover each role

### T13 Job board
**Depends on:** T12
**Do:** Build the job board from the wireframe with search, track filter, and company filter, paginated.
**Done when:**
- [ ] Interns see open roles in their own cohort only
- [ ] Filters work and the list loads 10 items per page
- [ ] The page meets the low-data budget

### T14 Apply for a role
**Depends on:** T13
**Do:** Migration and policies for `applications`. Add CV upload to the `cvs` bucket (PDF or DOCX, 2 MB) and a `submit_application()` function that checks the account is active, the posting is open, and attempts are 2 or fewer.
**Done when:**
- [ ] An intern can apply and sees their own applications with a status trail
- [ ] A third attempt in the same cohort is refused
- [ ] An intern cannot read another intern's application or CV

### T15 HR screening
**Depends on:** T14
**Do:** Migration and policies for `application_staff_notes`. Build the screening screen: applicant list, CV preview, rubric score, private notes, feedback to applicant, advance or reject.
**Done when:**
- [ ] Only HR, manager, trainers see applications for their company
- [ ] The applicant cannot read `application_staff_notes` (test)
- [ ] Rejecting requires written feedback, which the applicant can read
- [ ] Status changes go through `advance_application()` and write `audit_log`

### T16 Interviews
**Depends on:** T15
**Do:** Migration and policies for `interviews` and `interview_staff_notes`. Add scheduling (date, time, mode, call link), a second adult for under-18 applicants, scoring with a rubric, and feedback to the applicant.
**Done when:**
- [ ] An interview with an under-18 applicant cannot be saved without a second adult (policy test)
- [ ] Interview scores and private notes are staff-only (test)
- [ ] The applicant sees the date, time, call link, and written feedback only
- [ ] A notification is created for the applicant when an interview is scheduled

### T17 Offers and acceptance
**Depends on:** T16
**Do:** Migration and policies for `offers`. Add `make_offer()` and `accept_offer()`. Accepting creates the `company_members` row and a welcome message in the company channel (placeholder if chat is not built yet).
**Done when:**
- [ ] An intern can accept or decline an offer once
- [ ] Accepting creates exactly one company membership
- [ ] An offer decision is visible to HR, manager, and trainers

### T18 Trainer override and direct placement
**Depends on:** T17
**Do:** Add `override_decision()` and `place_intern()` for trainers and school admins, with a required reason.
**Done when:**
- [ ] An override stores `overridden_by` and `override_reason` and writes `audit_log`
- [ ] A direct placement creates a membership and notes it on the record
- [ ] Non-trainers cannot call either function (test)

### T19 Onboarding checklist
**Depends on:** T17
**Do:** Add an onboarding checklist per role, a welcome message, and a first-week plan screen. HR interns or trainers confirm items. A late checklist (not done by end of day 2) flags the intern to the manager and trainer.
**Done when:**
- [ ] A new hire sees their checklist and can mark their own items
- [ ] Confirmation items can be marked only by HR or a trainer
- [ ] The late flag appears on the trainer dashboard list

---

## Phase 3: Daily work

### T20 Clock in and out
**Depends on:** T10
**Do:** Migration and policies for `attendance`. Add `clock_in()` and `clock_out()` functions and the dashboard clock control from the wireframe.
**Done when:**
- [ ] Clock-in is refused outside the working window, for inactive accounts, and a second time on the same day
- [ ] Clock-out sets `minutes_worked`
- [ ] An intern cannot edit attendance directly; only trainers can correct it
- [ ] HR and managers see their company's attendance only

### T21 Absence and lateness job
**Depends on:** T20
**Do:** Add a nightly `pg_cron` job that marks missed days as absent, flags lateness, and creates notifications for the manager and trainer. Absence after 3 days in a row alerts the trainer.
**Done when:**
- [ ] A test day with no clock-in becomes `absent` after the job runs
- [ ] An absence reason can be added and confirmed by a manager or trainer
- [ ] The job is idempotent: running it twice creates no duplicates

### T22 Task board
**Depends on:** T17
**Do:** Migration and policies for `tasks`. Build the Kanban board from the wireframe with My tasks and Whole team views, task creation by managers and trainers, and status moves by assignees within their allowed range.
**Done when:**
- [ ] An intern sees only their own company's tasks
- [ ] An assignee can move a task between To do, In progress, and In review only
- [ ] A task cannot be moved to Done by its assignee (test)
- [ ] Card order persists through `position`

### T23 Submissions and file upload
**Depends on:** T22
**Do:** Migration and policies for `submissions`. Add the submit form (link, file up to 10 MB, note) with client-side compression for images and local draft saving. Use the `submissions` bucket with signed links.
**Done when:**
- [ ] A submission moves the task to In review in one function call
- [ ] A resubmission adds a new version
- [ ] A draft survives a page reload and a dropped connection
- [ ] Another intern cannot read or open the file

### T24 Review loop
**Depends on:** T23
**Do:** Migration and policies for `reviews`. Build the manager review screen: rubric scores, comments, approve, request changes, or reject. Add the dispute flag for the author and the trainer decision.
**Done when:**
- [ ] Approve moves the task to Done with a score; request changes returns it with feedback and a new deadline
- [ ] A task can be revised twice before escalation to a trainer
- [ ] The author can read their review; teammates cannot
- [ ] A dispute is visible to the trainer and the trainer's decision is final

### T25 Rubrics and task library
**Depends on:** T24
**Do:** Screens for trainers to manage rubrics and the task library per track, and to create live tasks from a template.
**Done when:**
- [ ] Interns can read rubrics but not the library
- [ ] A task created from a template copies its title, description, difficulty, and rubric
- [ ] Policy tests cover the library

### T26 Channels and realtime chat
**Depends on:** T22
**Do:** Migration and policies for `channels`, `channel_members`, and `messages`. Create default channels when a company is created. Build the chat screen from the wireframe with realtime updates for the open channel only, loading 50 messages at a time.
**Done when:**
- [ ] A user receives realtime messages only for channels they belong to
- [ ] Trainers can read every channel in their cohorts
- [ ] Edits copy the old body to `audit_log`; deletes are soft deletes through a function
- [ ] The trainer-visibility notice is shown
- [ ] No background polling while the chat is closed

### T27 Direct messages with the under-18 rule
**Depends on:** T26
**Do:** Add `create_direct_channel()` and the restrictive policies using `channel_allows_member()`. Trainers read direct channels through their cohort policy without being members.
**Done when:**
- [ ] An adult intern cannot open a direct channel with an under-18 intern (test)
- [ ] An employer account cannot be added to a channel with an under-18 (test)
- [ ] Two adults, or two under-18s, can message each other and trainers can read it

### T28 Announcements and notifications
**Depends on:** T26
**Do:** Migration and policies for `notifications`. Add an announcements channel type, an in-app notification list, and email notices through the email provider.
**Done when:**
- [ ] Triggers create notifications for new offers, interviews, reviews, and announcements
- [ ] A user can read and mark only their own notifications
- [ ] Emails are queued through one Edge Function and respect provider limits

### T29 Meetings
**Depends on:** T26
**Do:** Migration and policies for `meetings` and `meeting_attendees`. Add a meeting list, a "Join" button that opens the external call link, and RSVP.
**Done when:**
- [ ] Only attendees and trainers see a meeting
- [ ] Calls default to audio and never require video
- [ ] The standup appears on the dashboard

### T30 Scenario library and event delivery
**Depends on:** T26
**Do:** Migration and policies for `scenarios`, `scenario_answer_keys`, and `scenario_events`. Build trainer screens to write scenarios and schedule events. Add `deliver_due_events()` and a `pg_cron` job that runs every minute.
**Done when:**
- [ ] A scheduled event is delivered once, at the right time, as a chat message, message, or task
- [ ] Interns cannot read `scenario_answer_keys` (test)
- [ ] A trainer can play the character live in chat
- [ ] Running the job twice does not duplicate an event

### T31 Scenario responses and scoring
**Depends on:** T30
**Do:** Migration and policies for `scenario_responses`. Interns respond in the normal channel; managers or trainers score. Add the pause-and-report option.
**Done when:**
- [ ] A response is linked to its event and shown to the manager and trainer
- [ ] Scores appear on the intern's record under Workplace skills
- [ ] Pausing a scenario creates a safeguarding report draft for the lead

---

## Phase 4: Trainer view and records

### T32 Trainer dashboard
**Depends on:** T31
**Do:** Build the trainer dashboard from the wireframe: summary cards, intern table, at-risk list, upcoming scenarios, open reports count.
**Done when:**
- [ ] Trainers see only their assigned cohorts
- [ ] Numbers match the underlying data (verify with seeded data)
- [ ] Filters for All, At risk, and Under 18 work
- [ ] The page meets the low-data budget

### T33 Performance reviews
**Depends on:** T24
**Do:** Migration and policies for `performance_reviews` with week 3 and week 6 periods and a ratings form.
**Done when:**
- [ ] A manager can review interns in their company only
- [ ] The intern and trainer can read the review; teammates cannot
- [ ] A review is locked once its period closes

### T34 Record compile and release
**Depends on:** T33
**Do:** Migration and policies for `records`. Add `compile_record()` and `release_record()` for trainers. A record is invisible to the intern before release.
**Done when:**
- [ ] The compiled hours, attendance rate, tasks approved, and scores match test data
- [ ] An intern cannot read a draft record (test)
- [ ] Release writes `audit_log` and notifies the intern

### T35 Certificate PDF
**Depends on:** T34
**Do:** Add an Edge Function that builds a certificate PDF and stores it in the `certificates` bucket for interns who meet the completion rule.
**Done when:**
- [ ] The PDF shows name, track, dates, hours, school, and verification code
- [ ] An intern below the completion rule gets no certificate but still gets the record
- [ ] The PDF is under 300 KB

### T36 Record links and public lookup
**Depends on:** T34
**Do:** Migration and policies for `record_links`. Add the Edge Function `get-record` that takes a token and returns a fixed set of fields. Build the verified record page from the wireframe and the owner bar to create and revoke a link.
**Done when:**
- [ ] A valid token returns the record; a revoked or unknown token returns nothing
- [ ] The `anon` role has no table access and uses only the function
- [ ] Link creation for an under-18 requires recorded sharing consent (test)
- [ ] The function is rate-limited and each view is logged

### T37 Portfolio
**Depends on:** T34
**Do:** Migration and policies for `portfolio_items`. Let interns choose which approved work shows on their record.
**Done when:**
- [ ] Only approved submissions can be added
- [ ] Hidden items do not appear on the public record

---

## Phase 5: Safeguarding and launch

### T38 Safeguarding reports
**Depends on:** T26
**Do:** Migration and policies for `safeguarding_reports`. Add the "Report a concern" button on every screen and a console for the safeguarding lead to review, act, and close.
**Done when:**
- [ ] Any signed-in user can file a report; only the lead and the reporter can read it
- [ ] Reports cannot be deleted by anyone
- [ ] The reporter gets a status update that does not reveal confidential details

### T39 Audit log coverage
**Depends on:** T38
**Do:** Make sure every sensitive action writes to `audit_log`: role changes, overrides, placements, record release, link creation, deletions, school-admin message access.
**Done when:**
- [ ] A test lists each sensitive action and finds its audit row
- [ ] No role can update or delete an audit row, including the platform admin

### T40 School admin message access
**Depends on:** T39
**Do:** Add a logged function that lets a school admin read a conversation only with a written reason.
**Done when:**
- [ ] There is no direct read policy on `messages` for school admins
- [ ] Each access creates an audit row with the reason

### T41 Low-data pass
**Depends on:** T36
**Do:** Measure every main screen on a throttled Slow 3G profile. Fix anything over budget. Add the service worker for the app shell and the Data saver setting.
**Done when:**
- [ ] First load is under 500 KB and each route under 150 KB of JavaScript, or the exception is documented
- [ ] Repeat visits load mostly from cache
- [ ] Data saver turns off avatars, auto-refresh, and typing indicators

### T42 Accessibility and UI pass
**Depends on:** T41
**Do:** Check keyboard use, labels, focus order, contrast, and plain-language messages across all screens.
**Done when:**
- [ ] Every screen can be used by keyboard alone
- [ ] Every input has a label and every error is described in text
- [ ] No screen relies on colour alone

### T43 Full policy test suite
**Depends on:** T40
**Do:** Complete the policy test suite from `docs/RLS_RULES.md` section 9, including the under-18 cases and the age-change case.
**Done when:**
- [ ] Every test in that list exists and passes in CI
- [ ] Every table has at least one test per role that should be blocked
- [ ] A new table without RLS fails a CI check

### T44 Staging, backups, and monitoring
**Depends on:** T43
**Do:** Create the staging and production Supabase projects, deployment from `main` to staging, manual approval to production, error monitoring, an uptime check, and backups. Practise a restore on staging.
**Done when:**
- [ ] A change flows from local to staging to production through migrations only
- [ ] A restore from backup was tested and the steps are written in `docs/RUNBOOK.md`
- [ ] Errors reach the developer's email or phone

### T45 Dry run and fixes
**Depends on:** T44
**Do:** Run a full dry run with a small group of testers in all roles, including a mock under-18 account. Record issues and fix the serious ones.
**Done when:**
- [ ] A tester completes apply, interview, onboarding, a week of work, and a record release
- [ ] No cross-organisation or cross-company data leak is found
- [ ] The trainer can run the cohort without the developer's help
- [ ] A list of known issues is written for the pilot
