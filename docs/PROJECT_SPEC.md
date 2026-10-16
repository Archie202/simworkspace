# PROJECT_SPEC.md

Condensed specification for the Virtual Workplace Internship Platform. This is the source of truth for scope. Detailed designs are in the other files under `docs/`.

## 1. Summary

A simulated remote workplace where digital-skills trainees complete a 6-week, 4-hours-a-day internship inside fictional companies. Interns apply, are interviewed, are onboarded, do daily tasks, receive reviews, and leave with a certificate, a portfolio, and a verified record.

- First release: one school, one pilot cohort of at least 20 interns, target February 2027.
- Designed so other schools can be added later (multi-tenant data model), but only one school is built for now.
- Staff roles (HR, managers, colleagues) are played by interns and trainers. There are no AI colleagues.

## 2. Principles

1. **Realistic, not gamified.** Interns should feel the ambiguity, deadlines, and teamwork of a real job.
2. **Safe by design.** Under-18 interns are protected by database rules, not only by policy.
3. **Low data, desktop first.** It must work on modest connections and laptops.
4. **Verifiable outcomes.** Every shared record can be checked.
5. **Small and finishable.** Build the MVP list only.

## 3. Roles

| Role | Scope | Main purpose |
| --- | --- | --- |
| Platform admin | All organisations | Support and setup; the owner |
| School admin | One organisation | Manages trainers, cohorts, branding |
| Trainer | Assigned cohorts | Full control of cohorts: companies, tasks, scenarios, grading, overrides |
| Manager | One company | A trainer or senior intern who assigns and reviews work |
| HR intern | One company | Screens applications, runs interviews, handles attendance |
| Intern | One company in one cohort | Applies, works, submits, gets reviewed |
| Employer | Verified records only | Version 2 |
| Guardian | Linked under-18 interns | Consent and progress notices only |

Full permissions: `docs/ROLES_PERMISSIONS.md`.

## 4. MVP features

Everything here is required for the pilot.

### 4.1 Accounts and structure
- Sign-up by invitation only. Trainers create accounts.
- Organisations, cohorts, companies, and memberships (see schema).
- Guardian consent for under-18 interns. The account is inactive until consent is recorded and a trainer has verified the guardian.

### 4.2 Hiring
- Companies post job roles.
- Interns apply with a CV and short cover note. Maximum 2 attempts per cohort.
- HR interns screen with a rubric, schedule interviews (with an external call link), score interviews, and make offers or rejections.
- Rejections include written feedback. Staff scores and notes are private to staff.
- Under-18 applicants need a second adult at the interview.
- A trainer can override any decision. After a second failure a trainer places the intern directly.
- An accepted offer creates the company membership.

### 4.3 Onboarding
- Welcome message, onboarding checklist, first-week plan.
- A late checklist flags the intern to the manager and trainer.

### 4.4 Daily work
- Clock in and out. Late and absent flags. Daily hours total. A nightly job marks missed days.
- Kanban task board: To do, In progress, In review, Changes requested, Done.
- Task submission (link, file up to 10 MB, note). A resubmission is a new version.
- Manager review with a rubric: approve, request changes, or reject. Scores and comments. A score can be disputed and a trainer decides.

### 4.5 Communication
- Company and team channels, announcements, direct messages between peers.
- Trainers can read every channel and direct message in their cohorts. This is shown clearly to users.
- No direct messages between an adult and an under-18.
- Messages are never hard-deleted. Deleting sets `deleted_at` through a function.
- Meetings: calendar entries with an external audio/video link.

### 4.6 Scenario engine
- Trainers schedule scenario events (urgent request, changed requirement, difficult stakeholder) by time and target (cohort, company, or person), delivered as chat, email-style message, or task.
- A scheduled job delivers due events. A trainer or volunteer can play the character live.
- Responses are scored by a manager or trainer and added to the intern's record.
- Interns can pause a scenario and report it. Scenarios never target an intern's identity or background.

### 4.7 Trainer dashboard
- Cohort overview, intern table, at-risk flags, applications to decide, tasks awaiting review, upcoming scenarios, open safeguarding reports.
- Task library, rubric library, scenario library.

### 4.8 Records
- Performance reviews at week 3 and week 6.
- A record compiled from attendance, task scores, scenario scores, and reviews. Trainer releases it. Nothing is visible to others before release.
- Certificate PDF for interns who meet the completion rule.
- A shareable link the intern creates and can revoke. A public function returns a fixed set of fields. Under-18 sharing needs recorded consent.
- Portfolio of approved work.

### 4.9 Safeguarding
- Report button on every screen. Reports go only to the safeguarding lead.
- Consent records, audit log, named safeguarding lead.

## 5. Version 2 (do not build now)

- Employer portal: gated directory, task posting, review panel, introduction requests.
- Standups and meeting notes as features, role rotation and promotions.
- Reference letter drafting.
- Sponsor dashboards and branded simulated companies.
- Self-serve setup for multiple schools.
- AI helpers for trainers (draft tasks, first-pass feedback), with usage caps.
- Native audio and video.

## 6. Out of scope

- AI-played staff or colleagues.
- Mobile-first design or a mobile app.
- Payments, billing, sponsor invoicing.
- A public showcase or listing of interns.
- Real client or production work by interns.

## 7. Core flows

1. Account setup and consent
2. Apply and hire (screen, interview, offer or feedback, one retry)
3. Onboarding
4. Daily workday (clock in, standup, tasks, scenario events, clock out)
5. Task submission and review (including revisions and disputes)
6. Scenario events
7. Completion and verified record
8. Safeguarding report

## 8. Data and security

- PostgreSQL on Supabase. RLS on every table. Rules in `docs/RLS_RULES.md`.
- Every school table carries `organization_id`. Scoped tables also carry `cohort_id` and `company_id`.
- Permission-sensitive actions are database functions the app calls.
- Private storage buckets: `cvs`, `submissions`, `avatars`, `certificates`, `consent-evidence`.
- Edge Functions: signed file links, certificate PDFs, public record lookup, email sending.
- `pg_cron` jobs: scenario delivery (every minute), absence and lateness flags (nightly).

## 9. Non-functional requirements

- Desktop first, usable at 1366 x 768. Phone layouts work but are not the design target.
- Page load under 500 KB; under 150 KB JavaScript per route (targets to confirm).
- Core actions work on slow connections. Drafts survive dropped connections.
- 20 to 100 concurrent interns without redesign.
- No per-message AI cost. Run on free or low tiers during the pilot.
- Keyboard accessible, readable contrast, plain language.

## 10. Definition of done (for any task)

- Acceptance criteria in `docs/TASKS.md` pass.
- Lint and type check pass; tests pass, including policy tests for any new or changed table.
- No new dependency without approval.
- RLS and policies exist for any new table.
- Documents updated if behaviour or structure changed.
- Page and JavaScript budgets respected.

## 11. Glossary

- **Organisation:** a school or training provider.
- **Cohort:** one 6-week run of the programme.
- **Company:** a simulated employer inside one cohort.
- **Function:** a person's role in a company: intern, HR, or manager.
- **Scenario event:** a scheduled workplace situation delivered during the day.
- **Verified record:** the released summary of an intern's attendance, tasks, scores, and reviews, with a verification code.
- **Safeguarding lead:** the named person who receives and resolves reports.

## 12. Open decisions

- Whether every intern must go through hiring, or trainers can place some directly from the start.
- Exact attendance rate required for a completion certificate.
- Interview length, and whether audio is enough.
- Age range of under-18 interns and whether they share cohorts with adults.
- Data retention period and the process for deletion requests.
- Vercel or Netlify for hosting; Resend or Brevo for email.
