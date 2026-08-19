# SecondOrder v1 Roadmap

## Final Goal

SecondOrder is a deployed enterprise cyber risk and vulnerability management platform that combines cybersecurity data with MIS and business context.

The project should demonstrate both sides of the degree:

### Cybersecurity

* Vulnerabilities
* CVSS and severity
* Asset exposure
* Remediation
* Access control
* Audit logging
* Scan and vulnerability-data imports

### MIS / Business Systems

* Asset ownership
* Departments
* Business criticality
* Workflows
* Reporting
* Risk prioritization
* Executive dashboards
* Organizational impact

The core idea is that a vulnerability should not be prioritized only because its CVSS score is high.

SecondOrder should combine technical severity with business context to determine what actually matters most to the organization.

That is the heart of the project.

---

# Phase 0 — Foundation

Establish the project foundation before building application features.

Tasks include:

* Create and publish the GitHub repository
* Create the README
* Create the project specification
* Create the development roadmap
* Establish the Git workflow
* Choose and configure the technology stack
* Create the application
* Install dependencies
* Configure the local development environment
* Confirm the application runs locally

## Phase 0 Finish Line

SecondOrder can be started locally and an actual webpage appears in the browser.

No product features are required yet.

---

# Phase 1 — Application Shell / UI

Build the visual skeleton of SecondOrder.

Create pages for:

* Dashboard
* Assets
* Vulnerabilities
* Risks
* Remediation
* Reports

The application should include:

* Sidebar navigation
* Header
* Responsive layout
* Consistent page structure
* Professional enterprise SaaS appearance

At this stage, most displayed data may be hard-coded or fake.

The goal is to establish the visual structure and user experience before connecting the application to a real backend.

## Phase 1 Finish Line

A user can navigate throughout SecondOrder and the application already looks like a realistic enterprise product even though the backend is not fully implemented.

---

# Phase 2 — Database and Data Model

Replace hard-coded application data with a real structured database.

Create the data model for:

* Users
* Departments
* Assets
* Vulnerabilities
* Risk Records
* Remediation Tasks
* Audit Events

Define relationships between the entities.

For example:

Department
↓
owns
↓
Asset
↓
has
↓
Vulnerabilities

Create realistic demo company data to populate the system.

## Phase 2 Finish Line

SecondOrder reads structured information from a real database instead of relying on hard-coded application data.

---

# Phase 3 — Core Functionality

Make the asset and vulnerability management portions of SecondOrder functional.

## Assets

Users should be able to:

* Create assets
* View assets
* Edit assets
* Delete or archive assets

Assets should include information such as:

* Owner
* Department
* Operating system
* IP address
* Business criticality
* Internet exposure

## Vulnerabilities

Users should be able to:

* Add vulnerabilities
* View vulnerabilities
* Edit vulnerabilities
* Associate vulnerabilities with affected assets
* Track vulnerability status

Add:

* Search
* Filters
* Sorting
* Status tracking

## Phase 3 Finish Line

SecondOrder functions as a real asset and vulnerability management system.

---

# Phase 4 — Business-Aware Risk Engine

Build the feature that differentiates SecondOrder from a basic vulnerability tracker.

SecondOrder should prioritize organizational risk using more than CVSS alone.

Risk factors may include:

* Technical severity
* Asset criticality
* Internet exposure
* Data sensitivity
* Business impact

Conceptually:

Technical Severity
+
Asset Criticality
+
Internet Exposure
+
Data Sensitivity
+
Business Impact
===============

Organizational Risk

For example, a CVSS 9.8 vulnerability on an isolated low-value test system may represent less organizational risk than a CVSS 8.1 vulnerability affecting an internet-facing customer payment system containing sensitive information.

This is the core MIS × cybersecurity concept behind SecondOrder.

The system should also explain why one vulnerability is prioritized above another by displaying the contributing technical and business factors.

## Phase 4 Finish Line

SecondOrder calculates organizational risk and clearly explains why vulnerabilities receive their priority.

---

# Phase 5 — Remediation Workflow

Turn identified cybersecurity risks into manageable business processes.

Users should be able to create remediation tasks containing:

* Assigned employee or team
* Priority
* Due date
* Status
* Notes
* Related vulnerability
* Related asset

Possible statuses include:

* Open
* In Progress
* Awaiting Validation
* Resolved
* Accepted Risk

SecondOrder should highlight:

* Overdue remediation
* Critical unresolved vulnerabilities
* Average remediation time
* Remediation workloads

The intended workflow is:

Vulnerability Found
↓
Risk Assessed
↓
Task Assigned
↓
Fix Implemented
↓
Issue Resolved

## Phase 5 Finish Line

SecondOrder supports the complete workflow from identifying a vulnerability through tracking and completing remediation.

---

# Phase 6 — Authentication and Security

Secure SecondOrder as a realistic internal enterprise application.

Add:

* Login
* Authenticated sessions
* Protected pages
* Protected backend routes
* Secure password handling
* Input validation
* Secure environment and secret handling
* Audit logging

## Role-Based Access Control

Implement different user roles.

### Analyst

* Investigates vulnerabilities
* Reviews risks

### IT Administrator

* Manages assets
* Handles remediation work

### Security Manager

* Oversees organizational risk
* Monitors remediation

### Executive

* Views high-level security and business-risk information
* Does not require the same technical detail as analysts

Different roles should have appropriate permissions and views.

## Phase 6 Finish Line

SecondOrder behaves like a secured internal enterprise application rather than an unrestricted public dashboard.

---

# Phase 7 — Dashboards and Executive Reporting

Turn SecondOrder's data into useful technical and business information.

Dashboard metrics may include:

* Total assets
* Open vulnerabilities
* Critical risks
* Open remediation tasks
* Overdue remediation tasks

Visualizations may include:

* Risk by department
* Vulnerabilities by severity
* Remediation progress
* Highest-risk assets
* Risk trends
* Exposure breakdown
* Risk heatmap

SecondOrder should distinguish between:

* Security analyst information
* Executive information

Technical users may need detailed vulnerability data, while leadership should receive higher-level business-risk information.

## Phase 7 Finish Line

SecondOrder clearly communicates both:

* What is technically wrong?
* What does leadership need to care about?

---

# Phase 8 — Cybersecurity Data Integration

Move beyond manually entered vulnerabilities by importing structured cybersecurity data.

A potential workflow is:

Nmap
↓
Scan Output
↓
SecondOrder Importer
↓
Asset Identification
↓
Services Discovered
↓
Vulnerability Information
↓
Risk Engine

Potential integrations may include:

* Nmap scan data
* Public CVE information
* Other structured vulnerability or asset data

Begin with safe sample or structured import files before implementing more complicated integrations.

## Phase 8 Finish Line

SecondOrder can ingest external cybersecurity data and transform it into actionable organizational risk.

---

# Phase 9 — Portfolio Polish and Deployment

Once the application works, prepare it for internship and portfolio review.

Add:

* Polished responsive UI
* Loading states
* Empty states
* Error handling
* Realistic demo company
* Demo account and data
* Tests for important logic
* Screenshots
* Architecture diagram
* Project documentation
* Setup instructions
* Explanation of technical decisions
* Clean README
* Public deployment

The final architecture should be understandable as something like:

Scanner / Data Source
↓
SecondOrder API
↓
Database
↓
Risk Engine
↓
Remediation Workflow
↓
Analyst and Executive Dashboards

---

# SecondOrder v1 Definition of Done

SecondOrder v1 is complete when someone reviewing the project for an internship can:

1. Open a publicly deployed SecondOrder instance.
2. Sign into a demo environment.
3. View realistic organizational assets.
4. Inspect vulnerabilities affecting those assets.
5. See business context associated with the assets.
6. See SecondOrder prioritize vulnerabilities using technical and business risk.
7. Create and track remediation work.
8. View dashboards and reports.
9. See different user roles and permissions.
10. Inspect a clean GitHub repository that explains how the application works.

At that point, SecondOrder can be described as:

**A full-stack enterprise cyber risk and vulnerability management platform that combines technical security findings with organizational business context to prioritize remediation.**

---

# Development Rule

Do not jump ahead in the roadmap simply because a later feature looks interesting.

The development order is:

Foundation
↓
UI
↓
Data
↓
Core Functionality
↓
Risk Engine
↓
Workflow
↓
Security
↓
Reporting
↓
Integration
↓
Polish

Each phase should follow the same process:

**Build → Test → Understand → Commit → Push → Next Phase**

Development should remain controlled and incremental so that every major component of SecondOrder can be understood and explained during an interview.
