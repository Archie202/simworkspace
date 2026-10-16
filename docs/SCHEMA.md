# Database Schema

Oct 14, 2026 · @Archibong

## 1. Overview and conventions

The schema targets PostgreSQL through Supabase and covers the PRD's MVP. It has about 30 tables in six areas: core structure, hiring, work, communication and attendance, records, and safeguarding. Row-level security policies are written in a separate document and rely on the columns defined here.

**Conventions**

| Topic | Rule |
| --- | --- |
| Names | Tables are plural snake\_case (`job_postings`); columns are snake\_case; foreign keys are `<table_singular>_id` |
| Primary keys | `id uuid` with default `gen_random_uuid()` |
| Timestamps | Every table has `created_at timestamptz` (default now) and, where rows change, `updated_at timestamptz` |
| Organisation id | Every table that holds school data carries `organization_id`, so policies can wall schools off cheaply |
| Scoping ids | Tables also carry `cohort_id` and `company_id` where that scope applies |
| Soft delete | User-facing records use `deleted_at timestamptz` instead of hard deletes; safeguarding and audit rows are never deleted |
| Enums | Closed sets use Postgres enums (for example `app_role`, `task_status`) |
| Users | Auth users live in Supabase `auth.users`; `profiles.id` equals the auth user id |
| Files | Files live in Supabase Storage; tables store the path, never the file |
| Money | None in the MVP, so no money columns |

**Notation in the tables:** PK = primary key, FK = foreign key, `?` after a type = nullable.

## 2. Entity map

&#91;embedded content: entity map · 5 layers\]

Read the map top down. An organisation holds cohorts, a cohort holds companies, and each company holds the hiring, work, and communication tables. Work and attendance data roll up into the verified record. An accepted offer creates a company member, which links hiring back to the company layer.

## 3. Core tables

These tables define who exists and where they belong: the school, the cohort, the company, and the person's role in each.

**Enums:** `app_role` (platform\_admin, school\_admin, trainer, employer, guardian, intern), `track` (software\_development, data\_analytics, program\_management, hr), `account_status` (invited, pending\_consent, active, suspended, left), `cohort_status` (draft, hiring, active, completed), `company_function` (intern, hr, manager).

| Table | Columns | Notes |
| --- | --- | --- |
| `organizations` | `id` PK, `name`, `slug` unique, `logo_path?`, `created_at` | One row per school or training provider |
| `profiles` | `id` PK = auth user id, `organization_id` FK, `full_name`, `display_name`, `email`, `phone?`, `date_of_birth?`, `track?`, `bio?`, `avatar_path?`, `cv_path?`, `status` account\_status, `created_at`, `updated_at`, `deleted_at?` | Under-18 status is computed from `date_of_birth` by a function, never stored, so it flips on the 18th birthday |
| `user_roles` | `id` PK, `user_id` FK profiles, `organization_id` FK, `role` app\_role, `created_at` | Organisation-level roles; unique on user, organisation, and role |
| `guardian_links` | `id` PK, `intern_id` FK profiles, `guardian_profile_id?` FK profiles, `guardian_name`, `guardian_email`, `relationship`, `status`, `verified_by?` FK profiles, `verified_at?`, `created_at` | Links an under-18 intern to a guardian, who may not have an account yet |
| `cohorts` | `id` PK, `organization_id` FK, `name`, `start_date`, `end_date`, `daily_hours_target` default 4, `work_start_time`, `status` cohort\_status, `created_by` FK profiles, `created_at` | A 6-week run of the programme |
| `cohort_members` | `id` PK, `organization_id` FK, `cohort_id` FK, `profile_id` FK, `cohort_role` (intern, trainer, volunteer), `track?`, `status` (active, withdrawn, completed), `joined_at` | Unique on cohort and profile; trainers and volunteers join here too |
| `companies` | `id` PK, `organization_id` FK, `cohort_id` FK, `name`, `industry`, `description`, `culture?`, `logo_path?`, `created_by` FK profiles, `created_at` | A simulated company inside one cohort |
| `company_members` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `profile_id` FK, `function` company\_function, `title`, `is_standin` default false, `job_posting_id?` FK, `started_at`, `ended_at?` | The person's role inside a company; an HR intern has function `hr`, and a manager has function `manager` |

## 4. Hiring tables

These tables follow the apply-and-hire flow: a posting, an application, an interview, and the decision.

**Enums:** `posting_status` (draft, open, filled, closed), `application_status` (submitted, screening, interview, offered, accepted, rejected, withdrawn), `interview_mode` (chat, audio, video), `interview_status` (scheduled, done, cancelled, no\_show).

| Table | Columns | Notes |
| --- | --- | --- |
| `job_postings` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `title`, `function` company\_function, `track`, `description`, `requirements?`, `openings` default 1, `status` posting\_status, `created_by` FK profiles, `created_at`, `updated_at` | One row per open role |
| `applications` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `job_posting_id` FK, `applicant_id` FK profiles, `cv_path`, `cover_note?`, `status` application\_status, `attempt_number` default 1, `screening_score?`, `screening_notes?`, `feedback_to_applicant?`, `decided_by?` FK profiles, `decided_at?`, `overridden_by?` FK profiles, `override_reason?`, `created_at`, `updated_at` | Unique on applicant and posting; `attempt_number` caps retries at 2; screening notes stay private to staff |
| `interviews` | `id` PK, `organization_id` FK, `cohort_id` FK, `application_id` FK, `interviewer_id` FK profiles, `second_adult_id?` FK profiles, `rubric_id?` FK, `mode` interview\_mode, `scheduled_at`, `duration_minutes`, `meeting_url?`, `status` interview\_status, `scores` jsonb, `total_score?`, `private_notes?`, `feedback_to_applicant?`, `created_at` | `second_adult_id` is required when the applicant is under 18 |
| `offers` | `id` PK, `organization_id` FK, `application_id` FK unique, `offered_by` FK profiles, `offered_at`, `response` (pending, accepted, declined), `responded_at?` | An accepted offer creates a `company_members` row |

## 5. Work tables

These tables hold the daily work: a library of reusable tasks, the live task board, submissions and reviews, and scenario events.

**Enums:** `task_status` (todo, in\_progress, in\_review, changes\_requested, done), `priority` (low, medium, high), `review_outcome` (approved, changes\_requested, rejected), `event_channel` (email, chat, task), `event_status` (scheduled, delivered, cancelled).

| Table | Columns | Notes |
| --- | --- | --- |
| `rubrics` | `id` PK, `organization_id` FK, `name`, `kind` (interview, task, review, scenario), `criteria` jsonb, `created_by` FK profiles, `created_at` | `criteria` holds each criterion with its weight and descriptors |
| `task_templates` | `id` PK, `organization_id` FK, `track`, `title`, `description`, `difficulty` (1 to 3), `estimated_minutes`, `rubric_id?` FK, `source` (trainer, ai\_draft), `created_by` FK profiles, `created_at` | The reusable task library per track |
| `tasks` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `template_id?` FK, `title`, `description`, `assignee_id?` FK profiles, `created_by` FK profiles, `status` task\_status, `priority`, `due_at?`, `position`, `rubric_id?` FK, `created_at`, `updated_at` | Live board items; `position` orders cards within a column |
| `submissions` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `task_id` FK, `author_id` FK profiles, `note?`, `links` text array, `file_paths` text array, `version` default 1, `submitted_at` | One row per submission; a resubmission adds a new version |
| `reviews` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id` FK, `submission_id` FK, `reviewer_id` FK profiles, `outcome` review\_outcome, `score?`, `rubric_scores` jsonb, `comments`, `disputed` default false, `dispute_note?`, `created_at` | Dispute fields support the trainer's final decision |
| `scenarios` | `id` PK, `organization_id` FK, `title`, `category`, `character_name?`, `character_persona?`, `message_body`, `expected_response?`, `rubric_id?` FK, `created_by` FK profiles, `created_at` | The scenario library |
| `scenario_events` | `id` PK, `organization_id` FK, `cohort_id` FK, `scenario_id` FK, `target_company_id?` FK, `target_profile_id?` FK, `channel` event\_channel, `deliver_at`, `status` event\_status, `delivered_at?`, `played_by?` FK profiles, `created_by` FK profiles | Targets the whole cohort when both target columns are empty; `played_by` is a trainer or volunteer playing the character live |
| `scenario_responses` | `id` PK, `organization_id` FK, `cohort_id` FK, `event_id` FK, `profile_id` FK, `response_text?`, `responded_at?`, `paused_at?`, `score?`, `feedback?`, `scored_by?` FK profiles | `paused_at` records an intern pausing the scenario and raising a concern |

## 6. Communication and attendance tables

Chat, meetings, notifications, and attendance. Messages are never hard-deleted, so safeguarding reviews can see what was said.

**Enums:** `channel_kind` (company, team, announcement, group, direct), `meeting_kind` (standup, interview, one\_to\_one, workshop), `attendance_status` (present, late, absent, excused).

| Table | Columns | Notes |
| --- | --- | --- |
| `channels` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id?` FK, `name`, `kind` channel\_kind, `created_by` FK profiles, `created_at`, `archived_at?` | Each company gets default channels at creation |
| `channel_members` | `id` PK, `organization_id` FK, `channel_id` FK, `profile_id` FK, `joined_at` | Unique on channel and profile; trainers are added to every channel in their cohort |
| `messages` | `id` PK, `organization_id` FK, `cohort_id` FK, `channel_id` FK, `sender_id` FK profiles, `body`, `attachment_paths` text array, `reply_to_id?` FK, `flagged` default false, `created_at`, `edited_at?`, `deleted_at?`, `deleted_by?` FK profiles | Soft delete only; the original body is kept for staff review |
| `meetings` | `id` PK, `organization_id` FK, `cohort_id` FK, `company_id?` FK, `title`, `kind` meeting\_kind, `starts_at`, `duration_minutes`, `meeting_url?`, `created_by` FK profiles, `created_at` | MVP links to an external call tool |
| `meeting_attendees` | `id` PK, `organization_id` FK, `meeting_id` FK, `profile_id` FK, `rsvp?` (yes, no, maybe), `attended?` | Unique on meeting and profile |
| `attendance` | `id` PK, `organization_id` FK, `cohort_id` FK, `profile_id` FK, `work_date`, `clock_in_at?`, `clock_out_at?`, `minutes_worked?`, `status` attendance\_status, `absence_reason?`, `confirmed_by?` FK profiles, `edited_by?` FK profiles, `edited_at?` | Unique on profile and date; only trainers edit rows after the fact |
| `notifications` | `id` PK, `organization_id` FK, `profile_id` FK, `kind`, `title`, `body?`, `link?`, `read_at?`, `created_at` | In-app first; email is sent from the same event |

## 7. Records, consent, safeguarding, and audit tables

These tables hold the outcomes interns keep and the protections the platform must prove. Employer and sponsor tables are left for version 2.

**Enums:** `record_status` (draft, released, revoked), `consent_kind` (guardian\_consent, code\_of\_conduct, privacy\_notice, record\_sharing), `report_status` (new, in\_review, actioned, closed).

| Table | Columns | Notes |
| --- | --- | --- |
| `performance_reviews` | `id` PK, `organization_id` FK, `cohort_id` FK, `profile_id` FK, `reviewer_id` FK profiles, `period` (week\_3, week\_6), `ratings` jsonb, `comments?`, `created_at` | Feeds the final record |
| `records` | `id` PK, `organization_id` FK, `cohort_id` FK, `profile_id` FK, `hours_completed`, `attendance_rate`, `tasks_approved`, `average_score?`, `scenario_average?`, `summary` jsonb, `trainer_comment?`, `status` record\_status, `verification_code` unique, `released_by?` FK profiles, `released_at?`, `created_at` | Unique on profile and cohort; invisible to others until released |
| `certificates` | `id` PK, `organization_id` FK, `record_id` FK unique, `file_path`, `issued_by` FK profiles, `issued_at` | Only for interns who meet the completion rule |
| `record_links` | `id` PK, `organization_id` FK, `record_id` FK, `token` unique, `created_by` FK profiles, `expires_at?`, `revoked_at?`, `created_at` | The intern's own shareable link; revoking sets `revoked_at` |
| `portfolio_items` | `id` PK, `organization_id` FK, `profile_id` FK, `submission_id` FK, `title`, `summary?`, `visible` default true, `created_at` | Approved work the intern chooses to show |
| `reference_letters` | `id` PK, `organization_id` FK, `profile_id` FK, `requested_at`, `draft_text?`, `approved_by?` FK profiles, `approved_at?`, `file_path?` | The MVP stores the request and the trainer-written letter; automatic drafts come in version 2 |
| `consent_records` | `id` PK, `organization_id` FK, `intern_id` FK profiles, `guardian_link_id?` FK, `kind` consent\_kind, `text_version`, `granted` boolean, `granted_at`, `recorded_by?` FK profiles, `evidence_path?`, `revoked_at?` | Every consent keeps the version of the text that was agreed to |
| `safeguarding_reports` | `id` PK, `organization_id` FK, `cohort_id?` FK, `reporter_id` FK profiles, `hide_from_peers` default true, `category`, `description`, `related_message_id?` FK, `attachment_paths` text array, `status` report\_status, `assigned_to?` FK profiles, `action_taken?`, `created_at`, `closed_at?` | Visible only to the safeguarding lead and the reporter; never deleted |
| `audit_log` | `id` bigint identity PK, `organization_id?`, `actor_id?` FK profiles, `action`, `table_name`, `record_id?`, `details` jsonb, `created_at` | Append-only; no update or delete allowed for any role |

## 8. Indexes, helper functions, and storage

**Helper functions** (SQL functions the security policies call, so each rule is written once):

| Function | Returns | Used for |
| --- | --- | --- |
| `current_org_id()` | The caller's organisation id | Organisation walls on every table |
| `has_role(role)` | Whether the caller holds an organisation-level role | Trainer, school admin, platform admin checks |
| `is_trainer_of(cohort_id)` | Whether the caller is a trainer in that cohort | Cohort-wide access |
| `company_function_of(company_id)` | The caller's function in that company, if any | Manager and HR permissions |
| `is_minor(profile_id)` | True when the profile is under 18 today | Every under-18 rule |
| `is_guardian_of(profile_id)` | Whether the caller is the verified guardian | Guardian view |
| `is_safeguarding_lead()` | Whether the caller is the safeguarding lead | Safeguarding reports |
| `can_direct_message(a, b)` | False when one is an adult and the other is under 18 | Direct-message creation |

The safeguarding lead needs a flag, so `user_roles` also carries `is_safeguarding_lead` (boolean, default false).

**Indexes:** `(organization_id, cohort_id)` on every scoped table; `messages (channel_id, created_at desc)`; `attendance (profile_id, work_date)`; `tasks (company_id, status, position)`; `applications (applicant_id)` and `(job_posting_id, status)`; `notifications (profile_id, read_at)`; unique on `records.verification_code` and `record_links.token`.

**Triggers and automation:**

- Set `updated_at` on every update.
- Create default channels when a company is created.
- Create a `company_members` row when an offer is accepted.
- Block a third application attempt for the same intern in a cohort.
- Compute `minutes_worked` when an intern clocks out.
- Write sensitive changes (overrides, deletions, record releases, role changes) to `audit_log`.
- Reject hard deletes on `messages`, `safeguarding_reports`, and `audit_log`.

**Storage buckets** (all private, accessed through signed links): `cvs`, `submissions`, `avatars`, `certificates`, `consent-evidence`.

## 9. Open questions

Confirm these before the SQL is written, because each changes tables or policies.

- **Date of birth storage.** Is storing the full date of birth acceptable, or should the platform store only an age band plus an over-18 check?
- **Retries.** Is the cap of 2 application attempts per intern per cohort right, and does it count across companies?
- **Direct messages.** Should peer direct messages exist at all in the MVP, given the extra risk for minors?
- **Employer accounts.** Should employers get their own organisation type now, or live in a separate organisation per employer in version 2?
- **Data retention.** How long are messages, submissions, and records kept after a cohort ends, and who can request deletion?
- **Multiple cohorts.** Can an intern join a second cohort later, and does a record belong to the cohort or the person?
- **Tracks.** Is `track` a fixed list of four, or should trainers be able to add tracks?
