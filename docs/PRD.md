# PRD: Virtual Workplace Internship Platform

Oct 14, 2026 · @Archibong

## 1. Overview

The platform is a simulated remote workplace where digital-skills trainees complete a 6-week, 4-hours-a-day internship inside fictional companies, working alongside other interns and trainers. It reproduces the full employment cycle: applying, being interviewed, onboarding, daily tasks, feedback, and a final verified record.

It is built for a digital-skills training programme that wants its trainees to leave with real work experience, not only course certificates. The first release targets the trainees of that programme, with at least 20 interns in a pilot in February 2027, and is designed so other schools can be added later.

**Product principles**

- **Realistic, not gamified.** Interns should feel the pressure, ambiguity, and teamwork of a real job.
- **People over AI.** Staff roles are played by interns and trainers. AI is limited to optional, low-cost helpers for trainers.
- **Low data, desktop-first.** It must work on modest connections and laptops, since a workplace is not run from a phone.
- **Safe by design.** Under-18 trainees are protected by the system itself, not only by policy.
- **Verifiable outcomes.** Every record an intern shares can be checked by an employer.

## 2. Problem and goals

Trainees finish digital-skills courses with theory but little proof of workplace experience, and employers will not trust a certificate alone. This platform gives trainees a structured, supervised work experience and gives employers verifiable evidence of it.

**Problems it solves**

- Trainees lack experience with hiring, teamwork, deadlines, feedback, and difficult colleagues.
- Employers cannot easily verify what a trainee can actually do.
- Real internships are scarce, and cannot be arranged for every trainee.

**Goals for the February 2027 pilot**

1. Run one complete 6-week cohort of at least 20 interns across software development, data analytics, program management, and HR.
2. Take every intern through the full cycle: apply, interview, onboard, work daily, be reviewed, and receive a verified record.
3. Give trainers full visibility and control of the cohort.
4. Collect outcome data (completion, placements, satisfaction) to support later sponsor and employer conversations.

## 3. Users and roles

Seven roles use the platform. The detailed permissions matrix is a separate document; this table defines who they are and what they need.

| Role | Who they are | What they do on the platform |
| --- | --- | --- |
| Intern | Trainee in software development, data analytics, or program management; beginner to advanced | Applies for roles, attends interviews, works daily tasks, chats with the team, submits work, receives reviews |
| HR intern | Trainee in the HR track | Screens CVs, schedules and runs interviews, runs onboarding, handles attendance and conduct issues |
| Manager | Trainer or senior intern leading a company team | Assigns tasks, reviews work, runs standups, gives feedback |
| Trainer | Programme staff | Full control of cohorts: creates companies, tasks, and scenarios, monitors all activity, grades, overrides, and flags concerns |
| School admin | Head of a school or training organisation | Manages their organisation's cohorts, trainers, and branding (multi-school, later) |
| Employer | Real company partner (version 2) | Views the verified talent directory, posts sample tasks, joins review panels, requests introductions |
| Guardian | Parent or guardian of an under-18 intern | Gives consent, and receives progress and safeguarding notices |

Trainers may also play difficult characters (a demanding manager, an unclear client) to create realistic pressure and diverse working situations.

## 4. Scope

The MVP covers the full intern journey for one cohort at one school. Anything not listed under MVP waits.

**MVP (needed for the February 2027 pilot)**

- Accounts, organisations, cohorts, roles, and guardian consent for under-18s
- Company pages and job postings
- Hiring flow: application with CV, HR screening, interview scheduling with a video link, offer or rejection with feedback
- Onboarding checklist and welcome message
- Daily workspace: clock-in and clock-out, Kanban task board, task submission, reviewer feedback
- Team chat and announcements, visible to trainers
- Scenario engine: trainers schedule events that arrive during the workday
- Trainer dashboard: progress, attendance, grades, flags, overrides
- Verified record: attendance, tasks, scores, a shareable link, and a certificate PDF
- Safeguarding controls for minors

**Version 2**

- Employer portal: directory, task posting, review panel, introduction requests
- Standups and meeting notes, role rotation, and promotions
- Reference letter generator, approved by a trainer
- Sponsor dashboards and branded simulated companies
- Multiple schools running their own cohorts
- AI helpers for trainers: draft tasks and first-pass feedback, with usage caps
- Native voice and video (the MVP links to an external meeting tool)

**Out of scope for now**

- AI-played staff or colleagues
- A mobile-first interface or mobile app
- Payments, billing, or sponsor invoicing
- A public showcase of interns
- Real client or production work by interns

## 5. Core user flows

The intern's journey runs in six stages over 6 weeks. Each stage gets a detailed flow document later; this is the product-level view.

1. **Apply.** The intern browses open roles across the simulated companies and submits a CV and short cover note.
2. **Hire.** An HR intern screens the CV and schedules an interview. The interview runs by video or audio, and the interviewer scores it against a rubric. The outcome is an offer, or a rejection with written feedback and one retry. A trainer can review and override any decision.
3. **Onboard.** The new hire gets a welcome message, a team introduction, a tools tour, and a first-week plan.
4. **Work daily.** Each day the intern clocks in, joins the team channel and standup, picks up tasks from the board, completes them over about 4 hours, and submits work. Scheduled scenario events interrupt the day: an urgent request, a changing requirement, a difficult stakeholder.
5. **Get reviewed.** A manager reviews each submission with a rubric and written feedback. Weekly check-ins and a mid-point and final performance review follow.
6. **Complete.** The intern receives a certificate, a portfolio of reviewed work, a trainer-approved reference letter, and a verified record with a shareable link.

**Edge cases the flows must handle**

- An intern is absent, late, or stops attending
- A role has no intern to fill it, so a trainer or volunteer steps in
- An intern disputes a review or a hiring decision
- A safeguarding concern is raised in chat

## 6. Functional requirements

Each module has a priority: MVP must exist for the pilot, V2 can follow.

| Module | Requirement | Priority |
| --- | --- | --- |
| Accounts | Sign up and log in; role assigned by a trainer; sessions expire safely | MVP |
| Organisations | Every record belongs to an organisation, so schools stay separated | MVP |
| Cohorts | Trainers create cohorts with dates, companies, and rosters | MVP |
| Consent | Under-18 accounts stay inactive until guardian consent is recorded | MVP |
| Companies | Profile, culture, org chart, open roles | MVP |
| Hiring | Apply with CV, screen, schedule interview, score, offer or reject with feedback, one retry, trainer override | MVP |
| Onboarding | Checklist, welcome message, first-week plan per role | MVP |
| Attendance | Clock in and out, late and absent flags, daily hours total | MVP |
| Tasks | Kanban board, task assignment, deadlines, submission with files or links | MVP |
| Reviews | Rubric-based feedback, scores, revision requests | MVP |
| Chat | Company and team channels, direct messages, announcements, all visible to trainers; no adult-to-minor private messages | MVP |
| Scenario engine | Trainers schedule events by time and target group; events arrive as emails, chat messages, or tasks | MVP |
| Meetings | Calendar entries with an external video or audio link | MVP |
| Trainer dashboard | Progress, attendance, grades, flags, overrides, activity log | MVP |
| Records | Verified record, portfolio, certificate PDF, shareable link controlled by the intern | MVP |
| Safeguarding | Report button, flagged-message review, named safeguarding lead, audit log | MVP |
| Employer portal | Gated directory, task posting, review panel | V2 |
| Reference letters | Draft from record data, trainer approval before release | V2 |
| AI helpers | Trainer-side task drafting and first-pass feedback with usage caps | V2 |
| Multi-school | Self-serve organisation setup and branding | V2 |

## 7. Non-functional requirements

The product must run well on modest connections and laptops, keep minors safe by design, and stay cheap to operate. Targets below are starting points to confirm in testing.

| Area | Requirement |
| --- | --- |
| Low data | Text-first interface; initial page load under 500 KB; no autoplay media; compressed and cached assets; images only where they carry meaning |
| Devices | Desktop and laptop first; usable at 1366 x 768; tablet acceptable; phone layouts functional but not designed for |
| Connectivity | Core actions (read tasks, submit work, chat) work on 3G-class speeds; chat and drafts tolerate brief disconnects |
| Audio and video | Optional, audio-first, and handled by an external tool in the MVP; never required to complete a task |
| Security | Permissions enforced in the database (row-level security), not only the interface; encrypted connections; least-privilege access; audit log of staff actions |
| Privacy | Minimal data collection; display names inside the workspace; nothing public by default |
| Reliability | Daily backups; target availability of 99% during working hours in the pilot |
| Scalability | 20 to 100 concurrent interns without redesign; every record carries an organisation id for later multi-school use |
| Cost | Run on free or low-cost tiers during the pilot; no per-message AI cost in the MVP |
| Accessibility | Keyboard navigation, readable contrast, plain language |

## 8. Safeguarding and compliance

Some trainees are under 18, so the platform must make safe behaviour the default. A separate safeguarding policy and guardian consent form are required before any minor uses it.

- **Guardian consent.** An under-18 account stays inactive until consent is recorded.
- **Visible communication.** Trainers can see all channels. Adult-to-minor private messaging is disabled, and all messages are logged.
- **Display names.** Interns use display names inside the workspace; full names appear only on records.
- **Reporting.** Every screen has a report button that reaches a named safeguarding lead.
- **Nothing public by default.** An intern's record is shared only through a link they control. Minors' records are not listed in any directory.
- **Minimal data.** Collect only what the programme needs, and delete accounts and data on request, subject to record-keeping rules.
- **Data protection.** Align with Nigeria's data protection law (the NDPA 2023). A lawyer reviews the privacy policy and consent form before launch.
- **Conduct.** A code of conduct covers harassment and bullying, including inside the difficult-scenario exercises, which must never target an intern personally.

## 9. Success metrics

The pilot succeeds if interns finish, employers value the records, and the programme can show numbers to future sponsors. Targets are proposals for you to set.

| Metric | How it is measured | Pilot target |
| --- | --- | --- |
| Interns enrolled | Accounts activated in the cohort | 20 or more |
| Completion rate | Interns who finish 6 weeks with a record | To be set (proposal: 80%) |
| Attendance | Clocked hours against the 4-hour daily plan | To be set (proposal: 85%) |
| Job placements | Interns hired or offered work within a set period after the cohort | To be set |
| Company satisfaction | Survey of employers who review records or tasks | To be set |
| Intern satisfaction | End-of-cohort survey on realism and usefulness | To be set |
| Task quality | Average rubric score across reviewed submissions | Baseline in the pilot |
| Safeguarding | Reports raised and time to resolution | All reports resolved and logged |

## 10. Timeline, assumptions, risks, and open decisions

The build must finish for a February 2027 pilot, about four months from now, with one developer using opencode.

**Build timeline**

1. **Weeks 1 to 3 (to early November):** Database schema, accounts, roles, row-level security, and the interface shell.
2. **Weeks 4 to 7:** Company pages and the hiring flow.
3. **Weeks 8 to 11:** Task board, chat, attendance, and the scenario engine.
4. **Weeks 12 to 14:** Trainer dashboard, verified records, and certificates.
5. **Weeks 15 to 17 (January):** Safeguarding checks, dry run with a small group, and fixes.
6. **February 2027:** Pilot cohort of at least 20 interns.

**Assumptions**

- About 4 simulated companies of about 5 interns each, with trainers as managers and difficult characters
- Hiring is mandatory, with one retry after a failed interview
- Stack: Next.js and Supabase, with an external tool such as Jitsi for calls
- Under-18s share cohorts with adults
- Trainers write most tasks and scenarios, with AI help for drafting only

**Risks**

- **Scope creep** from a long wish list; mitigated by the strict MVP list in section 4
- **Thin content:** realism depends on good tasks and scenarios, so they must be written in parallel with the build
- **Minor safety:** needs early design, a lawyer's review, and a trained safeguarding lead
- **One developer:** limited time and no backup; recruit a tester or designer if possible
- **Role gaps:** a company may lack an intern for a role, so trainers or volunteers need a plan

**Open decisions**

- Funding and sponsor strategy after the pilot
- Who the safeguarding lead is, and who reviews legal documents
- Age range of the under-18 trainees, and whether they share cohorts with adults
- Whether the training or internship carries a fee
- Final success-metric targets
