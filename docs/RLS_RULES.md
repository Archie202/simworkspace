# Row-Level Security Rules

Oct 14, 2026 · @Archibong

## 1. Approach and ground rules

Every permission in the roles and permissions matrix becomes a PostgreSQL row-level security (RLS) policy, so the database refuses a forbidden request even if the interface or an API call is wrong. This document specifies the policies; the SQL is written from it.

**Ground rules**

1. **RLS on every table, no exceptions.** A table without RLS enabled is open to anyone with the API key. With RLS on and no policy, access is denied.
2. **Deny by default.** Add only the policies listed here, written per action (select, insert, update, delete), never `for all`.
3. **Authorise from tables, never from user metadata.** A user can edit their own auth metadata, so roles and consent are read from `user_roles`, `company_members`, `cohort_members`, and `guardian_links`.
4. **Helper functions carry the logic.** The helpers from the schema document are `security definer`, stable, set a fixed `search_path`, and live in a private schema that the API does not expose, so policies stay short and every rule is written once.
5. **Wrap auth calls.** Write `(select auth.uid())` instead of `auth.uid()` inside policies, so Postgres evaluates it once per query rather than once per row.
6. **Restrictive policies for under-18 rules.** These are layered over the role policies and must always win.
7. **Sensitive writes go through functions.** Releasing a record, recording consent, overriding a hiring decision, and resolving a report are done by database functions that check permission and write the audit log, not by direct table updates.
8. **The service key stays on the server.** It bypasses RLS, so it is never shipped to the browser and is used only in trusted server code such as scheduled jobs.
9. **Views respect RLS.** Any view is created with `security_invoker = true`.
10. **Index policy columns.** `organization_id`, `cohort_id`, `company_id`, and the member ids used in policies are indexed, since policies run on every query.

## 2. Policy patterns

Most policies are one of seven patterns. The table sections below refer to them by letter.

| Pattern | Rule | Typical use |
| --- | --- | --- |
| A. Organisation wall | `organization_id` equals the caller's organisation | Combined with every other pattern |
| B. Own rows | The row's owner column equals `auth.uid()` | Applications, submissions, notifications |
| C. Company member | Caller has any function in the row's company | Tasks, channels, company pages |
| D. Company function | Caller holds a specific function (manager or hr) in the company | Reviews, screening, task creation |
| E. Cohort trainer | Caller is a trainer of the row's cohort | Almost every table, as the staff override |
| F. School admin | Caller is a school admin of the organisation | Read access to oversight data |
| G. Guardian | Caller is the verified guardian of the row's intern | Attendance and progress summaries |

Patterns combine with `or` across roles (a manager or a trainer may read) and with `and` against pattern A, so a policy can never reach across organisations.

**Example 1: read companies in your own cohort (patterns A and E)**

```sql
create policy "companies_select" on public.companies
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_cohort_member(cohort_id)
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);
```

**Example 2: an intern reads only their own applications (patterns A, B, D, E)**

```sql
create policy "applications_select" on public.applications
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    applicant_id = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);
```

**Example 3: a restrictive rule that always applies (under-18 direct messages)**

```sql
create policy "channel_members_no_adult_minor_dm" on public.channel_members
as restrictive
for insert to authenticated
with check (
  private.channel_allows_member(channel_id, profile_id)
);
```

The examples show the shape only. The real SQL is generated from the table sections below and reviewed against the tests in section 9.

## 3. Core tables

Every policy also includes pattern A, the organisation wall. Where a cell says none, no role may do it through the API; the action happens through a function or the server.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `organizations` | Members of that organisation | Platform admin only | School admin (own organisation) | None |
| `profiles` | Self; trainers of the person's cohort (E); school admin (F); guardian of an under-18 (G) | Created by the sign-up function, never directly | Self for bio, avatar, phone, and CV only; status changes through a function | None; soft delete through a function |
| `user_roles` | Self; school admin (F) | School admin (F) | School admin (F) | School admin (F), with an audit entry |
| `guardian_links` | The intern; the guardian; trainers of the cohort (E); school admin (F) | Trainer through a function | Verification through a function only | None |
| `cohorts` | Members of the cohort (via `cohort_members`); school admin (F) | Trainer or school admin | Trainer of the cohort (E); school admin (F) | None; close with status |
| `cohort_members` | Self; trainers of the cohort (E); school admin (F) | Trainer (E) or school admin (F) | Trainer (E) or school admin (F) | None; use status |
| `companies` | Every member of the same cohort, so interns can browse and apply | Trainer (E) or school admin (F) | Trainer (E) | None; archive |
| `company_members` | Members of the same company (C); trainers (E); school admin (F) | Offer-acceptance function or trainer (E) | Trainer (E) | None; set `ended_at` |

**Column limits.** RLS controls rows, not columns. Two measures cover the rest:

- A function `profile_directory()` (security definer, fixed search path) returns only `id`, `display_name`, `avatar_path`, and `track` for people in the caller's own cohort. Interns call it to see teammates and never read the `profiles` table for other people. This is the one deliberate exception to the rule that views and functions respect RLS, so it exposes nothing else.
- Column-level grants on `profiles` allow updates only to the self-editable columns, and `date_of_birth`, `email`, and `status` are readable only under the first row's rule.

## 4. Hiring and work tables

All policies include pattern A. In the tables, **staff** means the company's HR or manager function (D) and trainers (E).

**Schema change needed.** Row policies cannot hide single columns from one reader of a row. The applicant and the screener both read `applications` and `interviews`, so the private fields (`screening_score`, `screening_notes`, interview `scores`, `total_score`, `private_notes`) move to two staff-only tables, `application_staff_notes` and `interview_staff_notes`. The same rule applies to `scenarios.expected_response`, which moves to `scenario_answer_keys`.

**Hiring**

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `job_postings` | Open postings: every cohort member; drafts: company HR or manager (D), trainers (E), school admin (F) | HR or manager (D); trainer (E) | HR or manager (D); trainer (E) | None; close with status |
| `applications` | The applicant (B); staff; school admin (F) | The applicant (B), only if the account is active, the posting is open, and attempts are 2 or fewer | Applicant may only withdraw; staff move status through functions; overrides only through the override function | None |
| `application_staff_notes` | Staff only | HR or manager (D); trainer (E) | The author; trainer (E) | None |
| `interviews` | The applicant, the interviewer, the second adult, staff, school admin (F) | HR or manager (D); trainer (E); a second adult must be set for under-18 applicants | Interviewer or trainer: schedule and status | None |
| `interview_staff_notes` | Staff only | Interviewer; trainer (E) | The author; trainer (E) | None |
| `offers` | The applicant, staff, school admin (F) | HR or manager (D); trainer (E) | The applicant may only answer through a function | None |

**Work**

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `rubrics` | Everyone in the organisation, so interns see how they are marked | Trainer (E) | Trainer (E) | None |
| `task_templates` | Trainers (E) and managers (D) | Trainer (E) | Trainer (E) | None |
| `tasks` | Company members (C); trainers (E); school admin (F) | Manager (D); trainer (E) | Manager and trainer: any field; the assignee: `status` only, among todo, in progress, and in review | None |
| `submissions` | The author (B); managers of the company (D); trainers (E) | The task's assignee, for their own tasks | None; a resubmission is a new row | None |
| `reviews` | The submission's author; managers (D); trainers (E) | Manager (D) for that company; trainer (E) | The author may only flag a dispute through a function; trainer (E) | None |
| `scenarios` | Trainers (E) | Trainer (E) | Trainer (E) | None |
| `scenario_answer_keys` | Trainers (E) only | Trainer (E) | Trainer (E) | None |
| `scenario_events` | Targeted interns, once `status` is delivered; trainers (E) see all | Trainer (E) | Trainer (E); delivery by the scheduled server job | None |
| `scenario_responses` | The respondent; their manager (D); trainers (E) | The targeted intern, once, for a delivered event | The respondent before scoring; scoring only by manager (D) or trainer (E) | None |

## 5. Communication and attendance tables

All policies include pattern A. Messages are the highest-risk data for under-18 interns, so trainers always have read access and nothing is ever hard-deleted.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `channels` | Channel members (via `channel_members`); trainers (E) see every channel in their cohorts | Trainer (E); manager (D) for company channels; direct channels only through a function | Creator or trainer (E): name and archive | None; archive |
| `channel_members` | Members of the same channel; trainers (E) | Trainer (E); manager (D); direct channels through the function | None | None; leaving is a status change |
| `messages` | Channel members; trainers (E) | A channel member, with `sender_id` equal to the caller and the channel not archived | The sender, for `body` only; the original goes to the audit log | None; soft delete through a function by the sender, a manager (D) of the company, or a trainer (E) |
| `meetings` | Attendees; company members for company meetings (C); trainers (E) | Manager (D); HR for interviews; trainer (E) | Creator; trainer (E) | None |
| `meeting_attendees` | Attendees of that meeting; trainers (E) | The meeting's creator; trainer (E) | Self for `rsvp`; creator or trainer for `attended` | None |
| `attendance` | Self (B); HR or manager of the person's company (D); trainers (E); school admin (F); guardian of an under-18 (G) | Self, only through the clock-in function (one row per day, inside the working window) | Self, only through the clock-out function; trainers (E) for corrections | None |
| `notifications` | Self (B) | The server only | Self: `read_at` only | Self |

**Notes**

- **Direct messages.** The function `create_direct_channel(a, b)` is the only way to create one. It refuses any pair that includes one adult and one person under 18, and trainers read every direct channel in their cohort through pattern E without being members of it.
- **Edits.** A trigger copies the old `body` to `audit_log` before an edit is saved.
- **School admin and chat.** A school admin has no direct read policy on `messages`. Access goes through a logged function that requires a reason.

## 6. Records, consent, safeguarding, and audit tables

All policies include pattern A. These tables hold what employers see and what regulators may ask for, so almost every write goes through a function.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `performance_reviews` | The intern (B); their manager (D); trainers (E); school admin (F); guardian of an under-18 (G) | Manager (D) of the person's company; trainer (E) | The author until the period is closed; trainer (E) | None |
| `records` | The intern, only once `status` is released (B); trainers (E) see drafts; school admin (F); guardian of an under-18 (G) | Compile function (trainer) | Release and revoke functions (trainer) | None |
| `certificates` | The intern for their released record; trainers (E); school admin (F) | Issue function (trainer) | None | None |
| `record_links` | The creator; trainers (E) | The intern, for their own released record; for an under-18, only with a granted `record_sharing` consent | The creator: `revoked_at` only | None |
| `portfolio_items` | The owner; trainers (E); school admin (F) | The owner, for their own approved submissions | The owner: `title`, `summary`, `visible` | None |
| `reference_letters` | The owner; trainers (E); school admin (F) | The owner, to request | Trainer (E): draft and approval | None |
| `consent_records` | The intern; the guardian; trainers (E); school admin (F) | Record-consent functions only | Revocation function only | None |
| `safeguarding_reports` | The reporter (own rows); the safeguarding lead | Any signed-in user, with `reporter_id` equal to the caller | The safeguarding lead only | None, ever |
| `audit_log` | School admin (F); platform admin | Triggers and functions only | None, ever | None, ever |

**Public record links.** The shared link is not a table read. The `anon` role has no table access. A server function `get_record_by_token(token)` checks that the link is active and the record is released, then returns a fixed set of fields (name, track, hours, tasks, scores, trainer comment, and the verification code), and logs the view.

**Hard blocks.** Triggers refuse any delete on `messages`, `safeguarding_reports`, `consent_records`, and `audit_log`, and any update or delete on `audit_log`, even for the platform admin.

## 7. Under-18 rules

These rules are written as `restrictive` policies, so they apply on top of every permissive policy above and cannot be switched off by a trainer or a bug in a role policy. Age comes from `is_minor(profile_id)`, which reads `date_of_birth` on every request, so the rules lift automatically on the 18th birthday.

| Rule | Enforced on | How |
| --- | --- | --- |
| No activity before guardian consent | All cohort-scoped tables | A restrictive policy requires the caller's `status` to be `active`; an under-18 stays `pending_consent` until consent is recorded |
| No adult-to-minor direct messages | `channels`, `channel_members`, `messages` | Restrictive insert policies call `channel_allows_member`, which refuses a direct channel containing one adult and one person under 18 |
| Peer messages stay visible to staff | `messages` | Trainers keep pattern E read access to every channel; there is no private channel type |
| Second adult in interviews | `interviews` | A restrictive insert and update policy requires `second_adult_id` when the applicant is under 18 |
| Sharing needs consent | `record_links` | A restrictive insert policy requires a granted `record_sharing` consent for an under-18 |
| Hidden from employers | Employer directory and `get_record_by_token` (version 2) | Records of under-18s are excluded unless the guardian consented in writing and a trainer approved |
| Limited guardian view | `attendance`, `performance_reviews`, `records`, `consent_records` | Pattern G grants read access only to these tables, and only after `guardian_links.status` is verified; guardians have no policy on `messages` or other interns' data |
| Direct contact blocked for employers | `channel_members` | Employers cannot be added to any channel that includes an under-18 |

Two helpers beyond the schema document are needed: `channel_allows_member(channel_id, profile_id)` and `is_active()` (true when the caller's `status` is `active`). Add them to the helper list when the SQL is written.

## 8. Storage bucket policies

Files live in private Supabase Storage buckets. Storage access is also governed by RLS, on the `storage.objects` table. Every object path starts with the organisation id so policies can check it, and files are opened through short-lived signed links.

| Bucket | Path pattern | Who can upload | Who can read | Limits |
| --- | --- | --- | --- | --- |
| `cvs` | `<org>/<profile>/<file>` | The owner | The owner; trainers (E); HR or manager (D) of a company the person applied to, through a function that checks the application | PDF or DOCX, 2 MB |
| `submissions` | `<org>/<company>/<task>/<author>/<file>` | The task's assignee | The author; managers of that company (D); trainers (E) | 10 MB; common document, image, and archive types |
| `avatars` | `<org>/<profile>/<file>` | The owner | The owner, and cohort members through a signed link from the directory function | Small images, 200 KB |
| `certificates` | `<org>/<profile>/<file>` | The server only | The owner once the record is released; trainers (E); school admin (F) | PDF |
| `consent-evidence` | `<org>/<intern>/<file>` | Trainer (E), when recording consent | Trainers (E); school admin (F) | PDF or image, 2 MB |

**Rules for every bucket**

- No public buckets, and no public read policy.
- Signed links expire quickly and are created by a function that has already checked permission.
- File names are replaced with generated ids on upload, and the original name is stored in the table row.
- Size and type limits keep uploads small, which also protects interns' data costs.
- The under-18 restrictive rules apply to storage as well: an inactive account cannot upload.

## 9. Testing plan and open questions

Policies are only trusted once they are tested. Seed one test user per role in two separate organisations, plus an under-18 intern and an adult intern in the same company. Write the tests as database tests (pgTAP, run with the Supabase CLI) that switch to the `authenticated` role and set the user's id in the request claims, then run each query as that user.

**Cases that must pass**

| Test | Expected result |
| --- | --- |
| An intern in organisation A reads any row of organisation B | Zero rows, every table |
| An intern reads another company's tasks | Zero rows |
| An intern reads a teammate's submission or review | Zero rows |
| An applicant reads their own screening or interview notes | Zero rows; the notes tables are staff-only |
| An intern reads `scenario_answer_keys` | Zero rows |
| An intern updates their own score or attendance | Refused |
| An assignee moves a task to done | Refused; only the manager's review can do it |
| A trainer in cohort 1 reads cohort 2 | Zero rows |
| An adult intern opens a direct channel with an under-18 intern | Refused |
| An employer or guardian reads any message | Zero rows |
| An under-18 with no consent record inserts a message or submission | Refused |
| An intern creates a record link for a draft record | Refused |
| A user other than the safeguarding lead reads a report | Zero rows, except the reporter's own |
| Anyone updates or deletes an `audit_log` row | Refused, even the platform admin |
| The `anon` role selects from any table | Refused |
| A guardian whose link is not yet verified reads attendance | Zero rows |
| An intern turns 18 and the date is advanced in the test | Under-18 restrictions no longer apply |

**Open questions**

- Should a trainer's read access to direct messages be announced to interns on first login? (Recommended: yes.)
- Does the school admin ever need a break-glass route to read a conversation, and who approves it?
- Who can delete personal data on request, given that safeguarding and audit rows are never deleted?
- Should managers who are interns see attendance, or only HR interns and trainers?
- Should trainers be limited to the cohorts they are assigned to when a school has several trainers? (The rules above assume yes.)
