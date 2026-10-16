# Roles and Permissions Matrix

Oct 14, 2026 · @Archibong

## 1. Principles and roles

Every permission is decided by three things: the user's role, the organisation, cohort, and company they belong to, and whether they are under 18. The database enforces these rules, so the interface can never be the only guard.

**Rules that apply everywhere**

1. **Deny by default.** A user can do only what a rule below allows.
2. **Organisation walls.** A user never sees another organisation's data, except a platform admin.
3. **Cohort and company scope.** Interns see only their own cohort and company, unless a rule says otherwise.
4. **Trainer visibility.** Trainers can see every channel and message in their cohorts. This is stated openly to all users.
5. **Logged actions.** Sensitive actions (overrides, deletions, exports, record releases) are written to an audit log.
6. **Least data.** Each role sees the minimum personal data it needs.

**Roles**

| Role | Scope | Notes |
| --- | --- | --- |
| Platform admin | All organisations | The platform owner; used for support and setup, never for daily work |
| School admin | One organisation | Manages trainers, cohorts, branding |
| Trainer | Assigned cohorts | Full control within their cohorts |
| Manager | One company | A trainer or senior intern leading a team |
| HR intern | One company | An intern with hiring and attendance duties |
| Intern | One company in one cohort | The main learner role |
| Employer | Own account, verified records only | Version 2 |
| Guardian | Linked under-18 interns | Consent and progress notices only |

An intern can hold more than one function in a company (an HR intern is also an intern), but each function is a separate permission set that a trainer grants and can remove.

## 2. Permission matrix

The platform admin can do everything and is left out of the tables. Legend: **Own** = only the user's own records; **Team** = own company; **Cohort** = the whole assigned cohort; **Org** = the whole organisation; **Yes** = allowed; a dash = not allowed.

**Setup and hiring**

| Action | Intern | HR intern | Manager | Trainer | School admin | Employer | Guardian |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create or deactivate accounts | - | - | - | Cohort | Org | - | - |
| Assign roles and functions | - | - | - | Cohort | Org | - | - |
| Create cohorts and companies | - | - | - | Yes | Org | - | - |
| Draft or edit job postings | - | Team | Team | Cohort | Org | - | - |
| View applications | Own | Team | Team | Cohort | Org | - | - |
| Screen and score interviews | - | Team | Team | Cohort | - | - | - |
| Make offer or rejection | - | Team | Team | Cohort | - | - | - |
| Override a hiring decision | - | - | - | Cohort | Org | - | - |

**Daily work**

| Action | Intern | HR intern | Manager | Trainer | School admin | Employer | Guardian |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View tasks | Team | Team | Team | Cohort | Org (read) | - | - |
| Create and assign tasks | - | - | Team | Cohort | - | - | - |
| Submit work | Own | Own | - | - | - | - | - |
| Review and score work | - | - | Team | Cohort | - | - | - |
| Clock in and out | Own | Own | Own | - | - | - | - |
| View attendance | Own | Team | Team | Cohort | Org | - | Own child |
| Edit attendance | - | - | - | Cohort | - | - | - |
| Schedule scenario events | - | - | - | Cohort | - | - | - |
| Post in company channels | Yes | Yes | Yes | Yes | - | - | - |
| Send direct messages | Peers only | Peers only | Yes | Yes | - | - | - |
| Read all cohort channels | - | - | - | Cohort | On request, logged | - | - |
| Delete another user's message | - | - | Team | Cohort | - | - | - |

**Records, safeguarding, and oversight**

| Action | Intern | HR intern | Manager | Trainer | School admin | Employer | Guardian |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View own record and portfolio | Own | Own | Own | Cohort | Org | - | Own child |
| Release a verified record | - | - | - | Cohort | Org | - | - |
| Create a shareable record link | Own, after release | Own, after release | Own, after release | - | - | - | - |
| View a released record | - | - | - | Cohort | Org | Link or directory (V2) | - |
| Report a concern | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View and resolve reports | - | - | - | Safeguarding lead | Safeguarding lead | - | - |
| View audit log | - | - | - | - | Org | - | - |

## 3. Data visibility rules

Personal data is split by sensitivity. Inside the workspace interns appear under display names, and sensitive details are limited to the people who need them.

| Data | Who can see it |
| --- | --- |
| Display name and role | Everyone in the same company |
| Full name | The user, trainers, school admin; employers only on a released record |
| Email and phone | The user, trainers, school admin |
| Date of birth and consent status | The user, trainers, school admin, and the guardian for under-18s |
| CV and application | The applicant, HR and managers of the company applied to, trainers |
| Interview notes and scores | HR and managers who ran it, trainers; the applicant sees the written feedback only |
| Task submissions | The author, managers of that company, trainers |
| Task scores and review comments | The author, managers, trainers; teammates see only a public status such as done or in review |
| Chat messages | Members of that channel, plus trainers at all times |
| Attendance | The user, HR and managers of that company, trainers, school admin; the guardian for an under-18 |
| Safeguarding reports | Safeguarding lead only, and the reporter's own submission |
| Verified record | The intern, trainers, school admin; others only through the intern's own link |
| Audit log | School admin and platform admin |

## 4. Rules for under-18 interns and guardians

These rules apply on top of everything above and cannot be switched off by a trainer.

- **Consent first.** The account is inactive until a guardian's consent is recorded. Trainers can record consent only after verifying the guardian.
- **No private adult contact.** Direct messages between an under-18 and any adult (trainer, manager, employer, adult intern) are blocked. Adults reach them only in logged group channels.
- **Peer messages are logged.** Direct messages between interns are allowed but visible to trainers and the safeguarding lead.
- **No public presence.** An under-18's record has no public link and is excluded from any employer directory unless the guardian consents in writing and a trainer approves.
- **Limited employer contact.** Employers cannot message an under-18 directly. Introductions go through a trainer and the guardian.
- **Guardian view.** A guardian sees their child's attendance, progress summary, and safeguarding notices, never other interns' data or chat content.
- **Safeguarding lead.** One named person receives all reports, and every report is logged and time-stamped.
- **Age change.** When an intern turns 18, the restrictions lift automatically, and the guardian's access ends unless the intern keeps it.

## 5. Enforcement and open questions

The matrix becomes row-level security policies in the database, so each rule holds even if the interface has a bug.

**Enforcement notes**

- Every table carries an organisation id, and most carry a cohort id and a company id for scoping.
- A user's role, cohort, company, and age status are read from the database on every request, never trusted from the browser.
- Policies are written per table and per action (read, create, update, delete) and tested with one test user per role.
- The under-18 rules are separate policies layered over the role policies, so they always win.
- Overrides, deletions, record releases, and exports write to the audit log with who, what, and when.
- The platform admin account uses multi-factor sign-in and is not used for daily tasks.

**Open questions**

- Should a school admin ever read chat content, or only counts and flags? The matrix says on request and logged.
- Can a manager who is an intern override a trainer's task assignment? The matrix says no.
- Should interns see teammates' scores for peer learning, or only their own?
- Who is the first safeguarding lead, and is there a backup?
