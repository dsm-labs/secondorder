# SecondOrder

SecondOrder is an enterprise-style cybersecurity risk management application that connects technical vulnerability findings with asset ownership, business impact, and remediation work.

SecondOrder v1 is feature-complete locally. Public deployment is pending.

## Overview

Vulnerability scanners describe technical severity, but severity alone does not show which findings matter most to an organization. A finding on an isolated, low-value system can have a different business priority from one on an internet-facing service that supports a critical process.

SecondOrder links findings to assets, ownership, and remediation so technical data can be evaluated in its operating context.

## Key Features

- Asset inventory with departments, owners, criticality, exposure, and lifecycle status
- Vulnerability management with affected-asset context, search, filters, and status tracking
- Structured JSON vulnerability imports with preview, validation, asset matching, and duplicate detection
- A deterministic, business-aware organizational risk engine with factor-level explanations
- Risk prioritization and reassessment workflows
- Remediation task assignment, due dates, overdue detection, workload views, and status tracking
- Auth.js credential authentication with bcrypt password hashing
- Server-enforced role-based access control for four internal user roles
- Transactional audit logging for authentication and business mutations
- Role-aware operational dashboards and executive/security reports

## Why SecondOrder

SecondOrder treats CVSS as an input rather than the final priority. Its deterministic risk model combines CVSS with asset criticality, business impact, data sensitivity, and internet exposure. This makes each ranking inspectable and connects cybersecurity operations with management information systems.

## Risk Model

The centralized risk engine calculates a score on a 0-10 scale:

```text
organizational risk score =
    CVSS                * 0.35
  + asset criticality   * 0.25
  + business impact     * 0.20
  + data sensitivity    * 0.15
  + internet exposure   * 0.05
```

Categorical factors are normalized as follows:

| Value | Normalized score |
| --- | ---: |
| Low | 2.5 |
| Medium | 5.0 |
| High | 7.5 |
| Critical | 10.0 |

Internet exposure contributes `0` when false and `10` when true. The weighted result is rounded to two decimal places and mapped to an organizational level:

| Score | Organizational risk level |
| --- | --- |
| 0.00-3.99 | Low |
| 4.00-6.49 | Medium |
| 6.50-8.49 | High |
| 8.50-10.00 | Critical |

Risk records preserve the assessed business inputs and a deterministic explanation. If current vulnerability or asset context no longer matches a stored assessment, SecondOrder marks it for explicit reassessment rather than silently rewriting it.

## Roles And Permissions

| Role | Major capabilities |
| --- | --- |
| Analyst | View assets; manage and import vulnerabilities; assess risks; view remediation and reports |
| IT Admin | Manage assets and remediation tasks; view vulnerabilities, risks, dashboards, and reports |
| Security Manager | Manage vulnerabilities and remediation; assess risks; view organization-wide reporting and the audit log |
| Executive | View executive dashboard, prioritized risks, and reports |

Permissions are enforced on the server. Navigation visibility is a convenience, not the authorization boundary.

## Architecture

SecondOrder uses the Next.js App Router for server-rendered reads and Server Actions for validated mutations. Prisma connects the application to Neon PostgreSQL through the Neon driver adapter. Domain modules contain risk, remediation, reporting, import, authorization, and audit behavior outside presentation components.

See [Architecture](docs/architecture.md) for system and workflow diagrams.

## Security Design

The application uses credential authentication, bcrypt password hashes, JWT-backed Auth.js sessions, protected application routes, database-verified roles, server-side authorization, security headers, and transactional audit events. Imported files are treated as untrusted input and are parsed and validated before any write is allowed.

See [Security Design](docs/security.md) for the implemented controls and project scope.

## Technical Decisions

See [Technical Decisions](docs/technical-decisions.md) for the project-specific tradeoffs behind the application architecture, risk model, data relationships, audit strategy, and reporting approach.

## Tech Stack

| Area | Technology |
| --- | --- |
| Application | Next.js 16.3.5, React 19.2.8, TypeScript 5.9 |
| UI | Tailwind CSS 4.3 |
| Database | PostgreSQL on Neon |
| Data access | Prisma 7.10 with `@prisma/adapter-neon` |
| Authentication | Auth.js 5 beta (`next-auth` 5.0.0-beta.32) |
| Password hashing | bcryptjs 3.0 |
| Tests | Node test runner through tsx |
| Runtime | Node.js 20.9 or newer |

## Local Setup

### Prerequisites

- Node.js 20.9 or newer
- npm
- A Neon project or another compatible PostgreSQL setup
- A separate PostgreSQL database or Neon branch for Prisma's development shadow database

### Installation

1. Clone and enter the repository.

   ```bash
   git clone <repository-url>
   cd secondorder
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Create a local environment file from the example. On macOS or Linux:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Configure the required variables in `.env`. Never commit this file.

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection used by the application and Prisma |
   | `SHADOW_DATABASE_URL` | Separate database used by `prisma migrate dev` to evaluate migrations |
   | `AUTH_SECRET` | Strong random secret used to protect Auth.js session data |
   | `DEMO_USER_PASSWORD` | Demo password hashed into the deterministic seeded user accounts; must be at least 12 characters and at most 72 UTF-8 bytes |

5. Generate Prisma Client, apply the committed migrations, and seed the fictional demo company.

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

6. Start the development server and open `http://localhost:3000`.

   ```bash
   npm run dev
   ```

If PowerShell execution policy blocks `npm.ps1` or `npx.ps1`, use `npm.cmd` and `npx.cmd` in the same commands.

## Demo Users

The seed creates fictional accounts for each application role. All use the password supplied through `DEMO_USER_PASSWORD`; the password itself is not stored in this repository.

| Name | Email | Role |
| --- | --- | --- |
| Maya Chen | `maya.chen@secondorder-demo.example` | Analyst |
| Ethan Brooks | `ethan.brooks@secondorder-demo.example` | IT Admin |
| Priya Shah | `priya.shah@secondorder-demo.example` | Security Manager |
| Ava Thompson | `ava.thompson@secondorder-demo.example` | Executive |

## Vulnerability Imports

Analysts and Security Managers can preview a structured JSON file before importing it. The pipeline validates every row, matches existing assets by exact IP or normalized exact name, identifies duplicates, and atomically writes only ready findings. It does not create assets or risk assessments automatically, so technical ingestion remains separate from business-risk assessment.

See the [Vulnerability Import Guide](docs/vulnerability-imports.md) and [synthetic example file](samples/vulnerability-import.example.json).

## Testing

Run the pure unit test suite:

```bash
npx tsx --test "src/**/*.test.ts"
```

Run the main project checks:

```bash
npx prisma validate
npx tsc --noEmit --pretty false
npm run lint
npm run build
```

## Screenshots

Screenshots are not committed yet. The planned capture set and filenames are documented in [docs/screenshots/README.md](docs/screenshots/README.md) so the images can be added after final deployment review without fabricating placeholders.

## Project Structure

```text
src/app/          App Router pages, route handlers, and Server Actions
src/components/   Shared UI and feature components
src/lib/          Domain logic, authorization, reporting, imports, and Prisma
src/types/        Auth.js TypeScript augmentation
prisma/           Schema, migrations, and deterministic demo seed
docs/             Architecture, security, decisions, and workflow guides
samples/          Synthetic vulnerability import data
```

## Project Scope

SecondOrder is a portfolio project and is not a claim of formal security certification or production readiness. Public deployment is pending. Historical risk snapshots, scanner-specific integrations, MFA, self-service account management, and exports are outside the current v1 implementation.
