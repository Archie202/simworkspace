# UI_GUIDELINES.md

How the interface looks and behaves. Follow this together with the wireframes. The goal is a calm, professional workplace tool that loads fast on slow, expensive connections and works for every intern.

## 1. Principles

1. **Looks like work, not a game.** Plain, professional, uncluttered. No mascots, badges for fun, or confetti.
2. **Text first.** Words and layout carry the interface. Images and icons are the exception.
3. **Fast on slow connections.** Every screen respects the budgets in section 9.
4. **One main action per screen.** It is the single blue button. Everything else is quieter.
5. **Say what happened.** Every action ends with a clear message. Never fail silently.
6. **Safe by default.** Notices about visibility (trainers can read chat) and under-18 rules are shown, not hidden.

## 2. Design tokens

Define these once as CSS variables and map them into the Tailwind theme. Do not hard-code colours or sizes elsewhere.

```css
:root {
  /* colour */
  --bg: #f4f4f2;            /* page background */
  --surface: #ffffff;       /* cards, panels */
  --surface-muted: #ebebe7; /* board columns, quiet areas */
  --fill: #e6e6e1;          /* placeholders, selected nav, bars */
  --border: #cfcfca;        /* card borders, dividers */
  --border-strong: #85857f; /* input borders (3:1 against white) */
  --text: #1f1f1f;
  --text-muted: #6b6b66;
  --accent: #2f5fd0;        /* the main action */
  --accent-hover: #1f3f94;
  --on-accent: #ffffff;
  --focus: #1f3f94;

  /* spacing (4 px scale) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px; --space-8: 32px;

  /* shape */
  --radius-sm: 6px; --radius-md: 8px; --radius-pill: 999px;
}
```

Status colours are limited to meaning that also has a text label. See section 6. Dark mode is not part of the MVP.

Contrast notes (approximate, check with a contrast tool before release): body text and muted text on white are above 4.5:1; white text on `--accent` is above 4.5:1; `--border-strong` on white is above 3:1.

## 3. Typography

- System font stack only: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web fonts.
- Sizes: page title 24 px, section title 16 to 18 px, body 14 px, small and meta 12 to 13 px. Never below 12 px.
- Line height about 1.5 for paragraphs.
- Weight: regular for text, 600 for names, headings, and key figures. Avoid italics and all-caps except small section labels.
- Left-align text. Keep lines under about 75 characters.

## 4. Layout

- **Desktop first.** Design for 1366 x 768 and up. Content area uses a max width where reading matters (record page: 960 px).
- **Shell:** top bar, left navigation (200 px), content area. Below about 760 px the navigation stacks above the content. Do not hide navigation behind a hidden menu in the MVP.
- Use CSS grid or flex with wrapping. Avoid fixed widths. Wide tables and boards scroll inside their own container, never the page.
- Spacing uses the scale above. Cards have 16 to 20 px padding and 16 px gaps.
- No horizontal page scroll at any width.

## 5. Components

Build these once in `src/components/` and reuse them. Every interactive element is a real `<button>`, `<a>`, `<input>`, `<select>`, or `<textarea>`.

| Component | Rules |
| --- | --- |
| Button (primary) | Filled `--accent`, white text, 44 px high, 600 weight. One per screen section |
| Button (secondary) | Transparent with a `--text` border and text, 44 px high |
| Link | `--accent`, underlined on hover and focus |
| Input, select, textarea | 44 px high (textarea grows), `--border-strong` border, always with a visible `<label>` above it |
| Card | `--surface`, 1 px `--border`, 8 px radius, 16 to 20 px padding |
| Chip | Pill shape, 12 px text, 1 px `--border`; the selected chip uses `--fill` and 600 weight |
| Table | Header row 12 px muted, 600 weight; rows separated by a thin divider; wrapped in a horizontal scroll container |
| Tabs and filters | Row of chips; the selected one has `--fill` and bold text; never colour alone |
| Progress bar | 12 px high, `--fill` track, darker fill, with the numbers written next to it |
| Kanban card | Card with title (600), due date, and priority in text; selected card has a 2 px `--accent` border |
| Chat message | 36 px avatar placeholder, name (600), role chip if relevant, time, message text; "Report this message" link in small muted text |
| Banner | Card with a 1 px dashed `--border-strong` for notices, or 1 px solid for errors, with an icon-free text message |
| Empty state | One sentence saying what belongs here and one button or link to start |
| Loading state | Text such as "Loading tasks" with a simple skeleton block; no spinners that animate forever |
| Dialog | Only for confirmations that cannot be undone (reject, revoke link, release record); focus moves into it and returns on close |

Icons: use inline SVG sparingly, always with a text label or an accessible name. No icon-only buttons except close.

## 6. Status labels

Always show the status as text. A chip can have a border style, but the word carries the meaning.

| Area | Statuses (shown text) |
| --- | --- |
| Tasks | To do, In progress, In review, Changes requested, Done |
| Applications | Applied, Screening, Interview, Offer, Accepted, Not successful, Withdrawn |
| Attendance | Present, Late, Absent, Excused |
| Intern (trainer view) | On track, At risk, Consent pending, Left |
| Records | Draft, Released, Revoked |
| Reports (safeguarding lead) | New, In review, Actioned, Closed |

"At risk" and "Not successful" get a darker border (`--text`), not red. Red is reserved for errors on forms.

## 7. Forms and validation

- Label every field. Placeholder text is a hint, never the label.
- Mark optional fields as "(optional)". Do not mark required fields with only a star.
- Validate on the server and show errors next to the field, in plain words ("Enter a date after today"), and in a summary at the top for long forms.
- Do not clear the form on error.
- Long forms and messages **autosave a draft on the device** and show "Draft saved on this device".
- After success show a clear message and move focus to it.
- Destructive or irreversible actions ask for confirmation in a dialog and say what will happen.

## 8. Accessibility (required, not optional)

- Everything works by keyboard. Tab order follows reading order. Focus is always visible (2 px outline in `--focus`, offset 2 px).
- Touch and click targets are at least 44 x 44 px.
- Never use colour alone to carry meaning.
- Headings are in order (one `h1` per page). Use landmarks: `header`, `nav`, `main`.
- Images have alt text; decorative ones are hidden from screen readers. Avoid images anyway.
- Announce changes (new messages, form errors, success) with `aria-live` regions where needed, without spamming.
- Do not rely on hover. Everything available on hover is available on focus and tap.
- Use plain language at about a secondary-school reading level. Avoid jargon without a short explanation.
- Respect `prefers-reduced-motion`. The MVP uses almost no animation.

## 9. Low-data rules for the interface

These budgets apply to every screen. They are starting targets; confirm by testing on a throttled Slow 3G profile.

- First page load under 500 KB; under 150 KB of JavaScript per route (compressed).
- No web fonts. No decorative images. Avatars are optional, resized, and 200 KB or less.
- Server components by default. Add client JavaScript only where interaction needs it.
- Paginate every list (10 to 25 rows). Chat loads the latest 50 messages.
- No background polling. Realtime runs only for the open chat.
- Show text immediately and load heavy parts (CV preview, file lists) on request.
- A **Data saver** setting turns off avatars, auto-refresh, and typing indicators.
- Audio is the default for calls. Video is opt-in.
- Cache the app shell with a service worker so repeat visits are light.

## 10. Safety and trust notices

Show these in the interface, in plain words:

- **Chat:** "Trainers can read every channel and direct message in this cohort." Visible on the chat screen and in the sign-in terms.
- **Under-18 interns:** the login screen says a guardian must give consent first. Interview invitations say a second adult attends.
- **Staff-only fields:** screening notes and interview notes say "Visible to staff only".
- **Reports:** a "Report a concern" link is on every screen footer or nav, and "Report this message" is on each message.
- **Scenarios:** scenario messages must not be labelled as fake, but the intern can always pause and report one.
- **Sharing:** the record sharing bar says who can see the link and how to revoke it.

## 11. Screens

The wireframes define layout and content. Build these screens from them, in this order of priority.

| Screen | Wireframe | Main action |
| --- | --- | --- |
| Login | 1. Login | Sign in |
| Intern dashboard | 2. Intern dashboard | Clock in or out |
| Job board | 3. Job board | Apply |
| HR screening and interview | 4. HR screening and interview | Advance to interview |
| Task board and task detail | 5. Task board | Submit for review |
| Team chat | 6. Team chat | Send |
| Trainer dashboard | 7. Trainer dashboard | Schedule a scenario event |
| Verified record | 8. Verified record | Create link |

Screens without a wireframe (offers, onboarding checklist, meetings, safeguarding console, trainer setup, task library, scenario editor, review screen) follow the same shell, components, and rules above. When in doubt, copy the pattern of the nearest wireframed screen and keep one main action.

## 12. Content style

- Short sentences. Active voice. Say what the person can do next.
- Use placeholders such as `[COMPANY NAME]` only in wireframes, never in production.
- Error messages say what went wrong and how to fix it, with no blame.
- Names: show `display_name` inside the workspace; show full names only on records and trainer views.
- Dates: write them in an unambiguous format (for example "14 Oct 2026") with the time zone stated where it matters.

## 13. Do and do not

| Do | Do not |
| --- | --- |
| Reuse the shared components | Create one-off styles per page |
| Keep one primary button per section | Put several blue buttons side by side |
| Show status as words | Use colour dots alone |
| Save drafts on the device | Lose typed work on a dropped connection |
| Test on Slow 3G and with the keyboard | Test only on a fast laptop with a mouse |
| Ask before adding a UI library | Add a heavy component library |
