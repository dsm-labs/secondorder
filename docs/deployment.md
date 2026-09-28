# Vercel And Neon Deployment

SecondOrder is live at [https://secondorder-iota.vercel.app](https://secondorder-iota.vercel.app) using Vercel's native Next.js deployment and Neon PostgreSQL. Deployment does not require the Vercel CLI or a `vercel.json` file.

## Vercel Project Configuration

Production configuration:

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
| `DEMO_USER_PASSWORD` | Seed operation only; used to hash credentials for the role-specific demo users |
| `PUBLIC_DEMO_PASSWORD` | Seed operation only; used to hash credentials for the public read-only demo account |

Auth.js detects Vercel's trusted host and request origin from platform headers. This credentials-only configuration does not require `AUTH_URL`, `AUTH_TRUST_HOST`, or `NEXTAUTH_URL` on Vercel.

## Prisma Build Behavior

`npm install` runs `prisma generate` through the `postinstall` script. This creates the ignored Prisma Client output required by `next build` and the application runtime.

The build does not run migrations, `db push`, or seed data. The deployed application reads the existing Neon schema and demo records through `@prisma/adapter-neon`.

## Migration Strategy

Production uses the repository's committed Prisma migrations.

For schema changes:

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

## Production Verification

After deployment, verify:

- Authentication, session persistence, and sign-out
- Role-based access and direct-route authorization
- Dashboard, Assets, Vulnerabilities, Risks, Remediation, Reports, and Audit Log
- Representative create and update workflows using synthetic data
- Audit events for authenticated business actions

Use only synthetic test data and remove temporary records after verification.