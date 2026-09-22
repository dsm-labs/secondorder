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

The application uses Auth.js credential sessions. Set `AUTH_SECRET` to a strong, private random value in the local `.env` before starting the app; never commit it. `DATABASE_URL` is also required. The current demo users cannot sign in until the pending `passwordHash` migration is applied and the seed is run with `DEMO_USER_PASSWORD` set to a non-sensitive demo password of at least 12 characters (at most 72 UTF-8 bytes). The seed hashes that password with bcrypt for the existing eight demo users; it does not change their IDs, roles, departments, or email addresses. For example, the demo account `maya.chen@secondorder-demo.example` can then sign in with the configured demo password. Do not reuse a real password for these public demo accounts.
