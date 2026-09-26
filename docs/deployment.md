# Vercel And Neon Deployment

SecondOrder is live at [https://secondorder-iota.vercel.app](https://secondorder-iota.vercel.app) using Vercel's native Next.js deployment and Neon PostgreSQL. Deployment does not require the Vercel CLI or a `vercel.json` file.

## Vercel Project Configuration

The production project uses this configuration:

1. The GitHub repository is connected through the Vercel dashboard.
2. The framework preset is the auto-detected **Next.js** preset.
3. The repository root is the project root.
4. Vercel's default install and build behavior is retained. The repository uses `npm run build`, and its `postinstall` script generates Prisma Client first.
5. Required environment variables are configured in Vercel before deployment.

The `engines` entry in `package.json` requires Node.js 20.9 or newer.

## Environment Variables

Add real values through **Vercel Project Settings > Environment Variables**. Do not upload or commit `.env`.

| Variable | Vercel requirement | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Required | Neon PostgreSQL connection used by the server-side Prisma client |
| `AUTH_SECRET` | Required | Strong random secret used by Auth.js to protect session data |

Set these for the Vercel environments that will run the application. If Preview deployments should not share production data, give Preview its own database or Neon branch.

Do not configure these as application runtime variables unless a separate controlled task needs them:

| Variable | Scope |
| --- | --- |
| `SHADOW_DATABASE_URL` | Local development only; used by `prisma migrate dev` |
| `DEMO_USER_PASSWORD` | Seed operation only; used to hash credentials for deterministic demo users |

Auth.js detects Vercel's trusted host and request origin from platform headers. This credentials-only configuration does not require `AUTH_URL`, `AUTH_TRUST_HOST`, or `NEXTAUTH_URL` on Vercel.

## Prisma Build Behavior

`npm install` runs `prisma generate` through the `postinstall` script. This creates the ignored Prisma Client output required by `next build` and the application runtime.

The build does not run migrations, `db push`, or seed data. The deployed application reads the existing Neon schema and demo records through `@prisma/adapter-neon`.

## Migration Strategy

The current Neon database already has the repository's committed migrations, so deployment itself needs no database command.

For a future schema change:

1. Create and review the migration in development with `npx prisma migrate dev` and a dedicated shadow database.
2. Commit the schema and migration together.
3. Apply committed migrations from a trusted local or CI environment using:

   ```bash
   npx prisma migrate deploy
   ```

4. Deploy the matching application code.

Do not run `prisma migrate dev`, `prisma db push`, resets, or seed commands as part of every Vercel build.

## Serverless Compatibility

- Prisma and the Neon adapter are imported only by server code.
- Application requests do not use the shadow database.
- No feature depends on persistent local files, process memory shared across requests, or a long-running background worker.
- Vulnerability imports remain in request memory, enforce a 1 MiB application limit, and use Server Actions capped at 2 MB. Both remain below Vercel's 4.5 MB Function payload limit.
- The configured security headers apply through normal Next.js response handling on Vercel.

## Post-Deployment Smoke Test

The current production deployment has completed this smoke test successfully. Use the checklist again after changes to application behavior, authorization, database structure, or hosting configuration.

### Unauthenticated

- Open `/` and confirm it redirects to `/login`.
- Confirm the login page loads without exposing configuration details.

### Authenticated Session

- Sign in with a seeded demo account and the separately shared demo password.
- Refresh a protected page and confirm the session remains active.
- Sign out and confirm protected pages return to `/login`.

### Role-Based Access

- Confirm an Executive sees only the permitted dashboard, risks, and reports navigation.
- Confirm a Security Manager can open the Audit Log.
- Open a forbidden URL directly and confirm the user is redirected to `/unauthorized`.

### Core Reads

- Load Dashboard, Assets, Vulnerabilities, Risks, Remediation, and Reports with a permitted role.
- Load the Audit Log as a Security Manager.
- Open representative asset, vulnerability, risk, and remediation detail pages.

### Core Writes

Perform these manually with clearly labeled temporary data, record the created identifiers, and arrange approved cleanup afterward:

- Create, edit, and archive a temporary asset.
- Preview and confirm a small synthetic vulnerability import.
- Create or reassess a risk for a temporary finding.
- Update a temporary remediation task.
- Verify that the corresponding Audit Log events were created.

Do not use real vulnerability, employee, customer, or infrastructure data during deployment testing.
