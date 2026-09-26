# SecondOrder

SecondOrder is an enterprise cyber risk and vulnerability management platform that combines technical vulnerability data with business context to help organizations identify and prioritize their most significant cybersecurity risks.

## Status

🚧 Currently in development.

## Planned Features

- Asset inventory
- Vulnerability tracking
- Business-context risk scoring
- Remediation workflows
- Role-based access control
- Executive security dashboards
- Audit logging
- Vulnerability scanner integrations

## Purpose

SecondOrder is being developed as a cybersecurity and information systems portfolio project focused on the intersection of technical security operations, enterprise risk management, and business information systems.

## Authentication setup

SecondOrder uses Auth.js credentials authentication. Local development requires `AUTH_SECRET` in `.env`, and seeded demo authentication uses `DEMO_USER_PASSWORD`. Never commit secrets or environment values. After configuring the database and local environment, run the normal Prisma migration and seed setup as documented.
