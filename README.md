This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Development logins

The local Supabase seed (`supabase/seed.sql`) creates development-only accounts.
All emails use the `.test` domain and are not real. Supabase Auth sign-in is not
yet wired up (T08), so these are the credentials documented for when auth is
connected. Passwords are not set in the seed; use Supabase Auth invites or
direct auth user creation for local testing.

### Organisations

| Slug | Name | ID |
|------|------|------|
| org-a | Org A | `11111111-1111-1111-1111-111111111111` |
| org-b | Org B | `22222222-2222-2222-2222-222222222222` |

### Users (Org A)

| Display name | Email | Role | Function | Status |
|--------------|-------|------|----------|--------|
| Platform Admin A | platform-admin@a.test | platform_admin | — | active |
| School Admin A | school-admin@a.test | school_admin (safeguarding lead) | — | active |
| Trainer A | trainer@a.test | trainer | — | active |
| HR Intern A | hr-intern@a.test | intern | hr | active |
| Manager A | manager@a.test | intern | manager | active |
| Adult Intern A | adult-intern@a.test | intern | intern | active |
| Under18 Intern A | under18-intern@a.test | intern | intern | pending_consent |
| Guardian A | guardian@a.test | guardian | — | active |

### Users (Org B)

| Display name | Email | Role | Status |
|--------------|-------|------|--------|
| School Admin B | school-admin@b.test | school_admin | active |
| Trainer B | trainer@b.test | trainer | active |
| Intern B | intern@b.test | intern | active |

### Cohort and companies

| Name | Org | ID |
|------|-----|------|
| Cohort A1 | Org A | `10000000-0000-0000-0000-000000000001` |
| Company A1 | Org A | `30000000-0000-0000-0000-000000000001` |
| Company A2 | Org A | `30000000-0000-0000-0000-000000000002` |

Adult Intern A and Under18 Intern A are both members of Company A1. Under18 Intern A has a verified guardian link to Guardian A.

### Local Supabase

Start the local stack:

```bash
npx supabase start
```

Apply migrations and seed:

```bash
npx supabase db reset
```

Stop the stack:

```bash
npx supabase stop
```
