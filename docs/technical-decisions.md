# Technical Decisions

These choices are project-specific tradeoffs for SecondOrder v1, not universal prescriptions.

## 1. Next.js App Router And TypeScript

The App Router supports server-rendered data access, nested routes, and Server Actions in one application. TypeScript gives the UI, actions, domain helpers, Prisma models, and Auth.js session data a shared type system.

## 2. Prisma And Neon PostgreSQL

The relational domain benefits from database constraints and explicit relationships among assets, findings, risks, users, and remediation tasks. Prisma provides generated types and migration history, while Neon provides managed PostgreSQL and a serverless-compatible adapter.

## 3. JWT-Backed Auth.js Sessions

The application needs internal credential authentication but does not need server-managed session records for its current scale. JWT-backed Auth.js sessions avoid extra Account and Session tables while retaining protected, HttpOnly cookie handling.

## 4. Server-Side RBAC

Hiding a button is useful UX but insufficient authorization. A centralized permission matrix is checked by server pages and Server Actions, with the current role verified from the database before sensitive work.

## 5. Nullable Password Hash Migration

`User.passwordHash` was introduced after deterministic demo users already existed. Making it nullable allowed a safe additive migration; users without a hash are simply unable to authenticate until credentials are provisioned.

## 6. One Current RiskRecord Per Vulnerability

V1 models the current official organizational assessment, enforced by a unique vulnerability relation. This keeps prioritization and reassessment clear. Historical assessment snapshots would require an intentional versioned model rather than overloading the current record.

## 7. Direct Asset Reference On RemediationTask

A task references both its vulnerability and asset to support operational filters and reporting. Server-side validation always derives the asset from the selected vulnerability, preserving consistency instead of trusting two independent selections.

## 8. Organizational Risk Is Separate From CVSS

CVSS remains a technical input. A separate 0-10 organizational score combines it with criticality, impact, sensitivity, and exposure so users can inspect how business context changes remediation priority.

## 9. Imports Do Not Create RiskRecords

Imported scanner findings lack reviewed business impact and data sensitivity. Importing them as open vulnerabilities while requiring an explicit assessment avoids presenting an automated guess as an approved organizational risk decision.

## 10. Structured JSON Before Scanner-Specific Schemas

A small documented JSON contract allowed validation, preview, duplicate handling, and transactional ingestion to be built before coupling the system to Nmap, OpenVAS, or another vendor format. Scanner-specific adapters can later target the same internal pipeline.

## 11. Transactional Audit Events

Audit events for supported business mutations are written in the same Prisma transaction as the change. This avoids a state where the mutation commits but its application audit record does not.

## 12. No Fabricated Historical Trends

The current schema stores timestamps and current state, not periodic snapshots. Dashboard and report visualizations therefore show current distributions and rankings instead of inferring a historical series the database cannot support.

## 13. No Chart Library For Current Visualizations

The current dashboards use compact HTML and CSS bars, tables, and summaries. This keeps the dependency surface small and remains accessible for the present use cases. A chart library can be justified later if richer interaction or historical series are added.
