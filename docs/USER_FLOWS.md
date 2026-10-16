# User Flows

Oct 14, 2026 · @Archibong

## 1. Overview

Eight flows describe how every role moves through the platform during one 6-week cohort. Each flow names who acts, what triggers it, the steps, and what the system records. Wireframes and screen specs are built from these flows.

| Flow | Main actors | Trigger |
| --- | --- | --- |
| 1. Account setup and consent | Trainer, intern, guardian | Intern is accepted into a cohort |
| 2. Apply and hire | Intern, HR intern, manager, trainer | Cohort opens and jobs are posted |
| 3. Onboarding | New hire, manager, HR intern | Offer accepted |
| 4. Daily workday | Intern, manager, team | Start of each working day |
| 5. Task submission and review | Intern, manager | Intern finishes a task |
| 6. Scenario events | Trainer, interns | Trainer schedules an event |
| 7. Completion and verified record | Intern, trainer | End of week 6 |
| 8. Safeguarding report | Any user, safeguarding lead | A concern arises |

Conventions: "the system" means the platform acting automatically, every flow step that changes data is recorded in the audit trail, and notifications go in the app first with email as a backup.

## 2. Flow 1: Account setup and guardian consent

**Trigger:** the training programme accepts an intern into a cohort. **Outcome:** an active account with the right role, and recorded consent if the intern is under 18.

1. The trainer creates the intern's account with name, display name, email, track, and date of birth.
2. The system sends the intern an invitation to set a password and accept the code of conduct.
3. If the date of birth shows under 18, the account stays **inactive** and the system sends the guardian a consent request.
4. The guardian reads the safeguarding summary and confirms consent. The trainer verifies the guardian's identity and records it.
5. The system activates the account and assigns the intern to the cohort.
6. The intern completes their profile: photo (optional), short bio, CV upload.

**If consent is refused or not given within 7 days:** the account stays inactive, the trainer is alerted, and the intern cannot enter the cohort.

## 3. Flow 2: Apply and hire

**Trigger:** the cohort opens and each company posts its roles. **Outcome:** every intern holds a role in a company, with written feedback along the way.

&#91;embedded content: hiring flow · 2 decisions, 1 retry loop\]

The HR intern screens each CV and, if it passes, runs a scored interview by chat, audio, or video. The HR intern and the manager then decide on an offer. A failed screen or interview returns written feedback, and the intern may apply once more for another role.

**Rules around the flow**

- A trainer can review and override any screening, interview, or offer decision.
- After a second failure, the trainer places the intern in a company directly, and the record notes it.
- The interview score uses a rubric, and the applicant sees the written feedback but not the raw scores.
- Interviews for under-18 interns run in a group channel or with a second adult present.

## 4. Flow 3: Onboarding

**Trigger:** the intern accepts an offer. **Outcome:** the intern knows their team, tools, manager, and first week of tasks.

1. The system posts a welcome message in the company channel and introduces the new hire.
2. The intern receives an onboarding checklist: read the company profile, meet the manager, read the code of conduct, set up tools, complete a short orientation task.
3. The manager holds a short welcome call or chat and shares the first-week plan.
4. The HR intern confirms the checklist items as complete, or a trainer does if no HR intern is assigned.
5. The system assigns the first tasks to the board and shows the intern's working hours and standup time.

**If the checklist is not finished by the end of day 2:** the manager and trainer are notified, and the intern is flagged as at risk of falling behind.

## 5. Flow 4: A normal workday

**Trigger:** the start of the working day. **Outcome:** about 4 hours of recorded, supervised work.

1. The intern logs in and clocks in. The system records the time and flags lateness against the agreed start.
2. The dashboard shows today's standup time, open tasks, deadlines, unread messages, and any scheduled events.
3. The team joins a 10-minute standup by chat or audio: what I did, what I will do, what blocks me.
4. The intern picks the top task from the board, moves it to **In progress**, and works on it.
5. During the day the intern messages teammates, asks the manager questions, and may attend scheduled meetings through a linked call.
6. Scenario events may arrive: an urgent request, a changed requirement, or a difficult message (see Flow 6).
7. Near the end of the day the intern posts a short progress note on the board or channel.
8. The intern clocks out. The system totals the hours and updates attendance.

**Missed clock-in:** after 30 minutes with no login the system messages the intern, then notifies the manager. An absence needs a reason, which the manager or trainer confirms.

## 6. Flow 5: Task submission and review

**Trigger:** the intern finishes a task. **Outcome:** a scored, commented task that feeds the intern's portfolio and record.

1. The intern opens the task, attaches files or links, adds a short note, and submits. The task moves to **In review**.
2. The manager is notified and reviews the work against the task's rubric.
3. The manager chooses one of three outcomes:
   - **Approve:** the task moves to **Done** with a score and comments.
   - **Request changes:** the task returns to **In progress** with specific feedback and a new deadline.
   - **Reject:** used only for work that misses the brief entirely; the trainer is notified.
4. The intern reads the feedback and, if changes were requested, resubmits. A task can be revised twice before the manager must decide or escalate to the trainer.
5. Approved tasks, scores, and comments are added to the intern's portfolio.

**Dispute:** if the intern disagrees with a score, they add a note and the trainer reviews it. The trainer's decision is final.

## 7. Flow 6: Scenario events

**Trigger:** a trainer schedules an event for a time, cohort, company, or person. **Outcome:** the intern practises handling realistic workplace pressure and the response is assessed.

1. The trainer picks a scenario from the library (urgent bug, changed requirement, unclear client email, team conflict, tight deadline) or writes one.
2. The trainer sets the target, delivery time, channel (email, chat, or task), and the expected good response.
3. At the set time the system delivers the event, written in the voice of a character such as a client or senior manager. A trainer or volunteer may play the character live.
4. The intern responds in the normal channel. The system starts a response timer.
5. The trainer or manager scores the response using the scenario rubric and adds feedback.
6. The result is added to the intern's record under **Workplace skills**.

**Safety rule:** scenarios test professional skills. They must never target an intern's personal background, appearance, or identity, and any intern can pause one and report it.

## 8. Flow 7: Completion and verified record

**Trigger:** the end of week 6. **Outcome:** a certificate, portfolio, reference letter request, and verified record.

1. In weeks 3 and 6 the manager completes a performance review: task quality, attendance, teamwork, communication, and scenario responses.
2. The system compiles the intern's record: attendance rate, reviewed tasks and scores, scenario results, and review comments.
3. The trainer checks the record, adds a final comment, and **releases** it. Nothing is visible to others before release.
4. The intern receives a certificate PDF, a portfolio page of approved work, and a record page with a unique verification code.
5. The intern can create a shareable link to the record and revoke it at any time. For under-18s the guardian's consent applies to sharing.
6. The intern can request a reference letter, which a trainer reviews and signs (version 2 automates the draft).
7. Anyone with the link or verification code sees the released record and its check mark that it was issued by the platform.

**Incomplete internships:** an intern who leaves early or falls below the attendance threshold receives a record that states hours completed, without a completion certificate.

## 9. Flow 8: Safeguarding report

**Trigger:** any user has a concern about their own or someone else's safety, treatment, or messages. **Outcome:** the concern reaches the safeguarding lead quickly and is handled and recorded.

1. The user taps **Report a concern** from any screen, picks a category, writes a short description, and can attach a message or screenshot. They may choose to stay anonymous to other interns, but not to the safeguarding lead.
2. The system confirms receipt and sends the report only to the safeguarding lead, with a time stamp.
3. The lead reviews it, usually within one working day, and may pause an account, hide a message, or involve the guardian or school admin.
4. The lead records the action and outcome. The reporter receives a short update that does not reveal confidential details.
5. Serious concerns (risk of harm, abuse, or exploitation) follow the safeguarding policy for escalation outside the platform.

Trainers and managers who receive a concern verbally must file it in the system and not handle it alone.

## 10. Edge cases and open questions

**Edge cases the screens must handle**

- An intern stops attending: after 3 missed days the trainer is alerted and the intern is contacted.
- A company lacks an intern for a role: a trainer or volunteer fills it, marked clearly as a stand-in.
- Two interns apply to the same role: the HR intern ranks them and the manager decides.
- An intern is rejected twice: the trainer places them in a company directly, and the record notes it.
- A guardian does not respond: the account stays inactive and no work is recorded.
- A trainer is unavailable: the school admin can reassign approvals.
- An internet drop during submission: drafts save locally and sync when the connection returns.

**Open questions**

- Should every intern go through hiring, or can a trainer place some directly from the start?
- How long should the interview be, and is audio enough?
- What attendance rate earns a completion certificate?
- Can interns change companies or roles during the 6 weeks?
