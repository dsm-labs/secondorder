# Security Design

SecondOrder is an internal-application portfolio project. Its security design demonstrates practical controls for authentication, authorization, input handling, and accountability, but it is not a claim of formal certification or production readiness.

## Authentication

- Auth.js uses a credentials provider with normalized email and password input.
- Passwords are hashed with bcrypt; plaintext passwords are never persisted.
- Accounts without a password hash cannot authenticate.
- Invalid sign-in attempts return a generic error rather than revealing whether an account exists.
- Auth.js manages JWT-backed sessions in protected cookies, so the application does not need a separate session table.
- Session data contains only the user's identifier, name, email, and role. Password hashes are never sent to the browser.
- There is no public signup, password reset, social login, or MFA flow in v1.

## Route And Action Protection

The application proxy redirects unauthenticated requests for protected pages to `/login`. This improves navigation behavior, but it is not the only control.

Every protected server page and mutation uses centralized authentication and authorization helpers. Server Actions obtain identity from the authenticated session and verify the current user and role against the database. User IDs and roles submitted by a browser are never treated as authorization evidence.

## Role-Based Access Control

The permission matrix is centralized and covers four roles:

- **Analyst:** vulnerability investigation/import and risk assessment
- **IT Admin:** asset administration and remediation execution
- **Security Manager:** vulnerability, risk, remediation, reporting, and audit oversight
- **Executive:** read-only organizational risk dashboards and reports

The UI hides inaccessible navigation and actions for clarity, while server-side checks remain the security boundary. Unauthorized authenticated users are directed to a dedicated access-denied page.

## Audit Logging

Supported authentication events and business mutations create concise AuditEvents. Where a mutation and audit event belong together, they are written in one Prisma transaction so the business change cannot succeed without its corresponding audit record. Audit descriptions are intentionally bounded summaries rather than serialized request bodies.

## Untrusted Import Data

Vulnerability import files are treated as untrusted input:

- uploads are limited to 1 MiB and 500 findings
- JSON structure, field lengths, enums, dates, and CVSS range are validated
- asset locators require an exact IP or normalized exact name match
- duplicate and unmatched rows are excluded from writes
- confirmation re-parses and revalidates the original file
- ready findings and audit events are created atomically
- imports never create assets or risk assessments automatically

See the [Vulnerability Import Guide](vulnerability-imports.md) for the accepted format and preview behavior.

## Environment And Database Safety

Database URLs, the Auth.js secret, and the demo seed password belong only in local or deployment environment configuration. `.env` files are ignored, while `.env.example` contains variable names with blank placeholders. The deterministic seed hashes `DEMO_USER_PASSWORD` before storing it and does not contain a real password.

Prisma Client runs only on the server through the Neon adapter. Server-rendered reads and Server Actions prevent database credentials and the Prisma client from entering browser bundles.

## HTTP Headers

Next.js applies these response headers across the application:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- a restrictive Permissions Policy for camera, microphone, and geolocation

These controls supplement application-level validation and authorization; they do not replace browser, hosting, dependency, database, or operational security review before a real deployment.
