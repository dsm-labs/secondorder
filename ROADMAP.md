SecondOrder — final goal
We are building a deployed enterprise cyber risk and vulnerability management platform that shows both sides of your degree:
Cybersecurity
vulnerabilities
CVSS/severity
asset exposure
remediation
access control
audit logging
scan/import data
MIS / business systems
asset ownership
departments
business criticality
workflows
reporting
risk prioritization
executive dashboards
organizational impact
The key idea remains:
A vulnerability should not be prioritized only because its CVSS score is high. SecondOrder should combine technical severity with business context to determine what actually matters most to the organization.
That is the heart of the project.

The master build plan
Phase 0 — Foundation
We are here right now.
Already complete:
✅ GitHub repo created
✅ Repo published
✅ VS Code connected
✅ README.md
✅ PROJECT_SPEC.md
✅ .gitignore
✅ First proper commit/push
Still to do:
Choose/finalize tech stack
Create actual application
Install dependencies
Confirm it runs locally
Establish our Git/commit workflow
Phase 0 finish line
You can run:
SecondOrder
↓
localhost
↓
actual webpage appears
No features required yet.

Phase 1 — Application shell
We build the visual skeleton of SecondOrder.
Pages:
Dashboard
Assets
Vulnerabilities
Risks
Remediation
Reports
Plus:
sidebar navigation
header
responsive layout
professional enterprise SaaS appearance
At this point, most data can still be fake.
Finish line
You can navigate around SecondOrder and it already looks like a real product, even though the backend isn't fully alive yet.

Phase 2 — Database + data model
This is when SecondOrder stops being a mockup.
We create the database structure for things like:
Users
Departments
Assets
Vulnerabilities
Risk Records
Remediation Tasks
Audit Events
Relationships matter.
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
We'll also generate realistic demo company data.
Finish line
SecondOrder is reading real structured data from a database instead of hard-coded fake text.

Phase 3 — Core functionality
Now you can actually use it.
Assets
Create:
Production Web Server
Edit it.
View it.
Delete/archive it.
Assign:
owner
department
operating system
IP address
criticality
exposure
Vulnerabilities
Add things like:
CVE-XXXX-XXXX
Then link vulnerabilities to assets.
Also add:
search
filters
sorting
status tracking
Finish line
SecondOrder becomes an actual asset + vulnerability management system.

Phase 4 — The feature that makes SecondOrder special
Business-aware risk engine
THIS is arguably the centerpiece of the whole portfolio project.
Instead of:
CVSS 9.8
=
OMG PRIORITY #1
SecondOrder considers additional factors.
Something roughly like:
Technical Severity
+
Asset Criticality
+
Internet Exposure
+
Data Sensitivity
+
Business Impact
=
Organizational Risk
Example:
Asset A
Internal testing server
CVSS: 9.8
Business criticality: Low
Internet-facing: No
Sensitive data: No
SecondOrder might rate it:
Medium/High organizational risk
Meanwhile:
Asset B
Customer payment portal
CVSS: 8.1
Business criticality: Critical
Internet-facing: Yes
Sensitive data: Yes
SecondOrder might rate that:
Critical organizational risk
Even though its CVSS score is technically lower.
THAT is the MIS × cybersecurity crossover.
Finish line
SecondOrder can explain:
Why is this vulnerability ranked above that one?
And show the actual contributing business/security factors.

Phase 5 — Remediation workflow
Finding problems isn't enough.
Now the organization has to actually fix them.
Users can create remediation tasks with:
assigned employee/team
priority
due date
status
notes
related vulnerability
related asset
Statuses could be:
Open
In Progress
Awaiting Validation
Resolved
Accepted Risk
SecondOrder highlights:
overdue remediation
critical unresolved vulnerabilities
average remediation time
workloads
Finish line
You can follow:
Vulnerability found
↓
Risk assessed
↓
Task assigned
↓
Fix implemented
↓
Issue resolved
That's an actual business process.

Phase 6 — Authentication + security
Now we secure our cybersecurity application because having a security platform with admin/admin would be comedy. 😭
We'll add:
login
authenticated sessions
protected pages
protected backend routes
secure password handling
validation
proper secret/environment handling
audit logging
And importantly:
Role-Based Access Control
Likely roles:
Analyst
Investigates vulnerabilities and risks.
IT Admin
Manages assets and remediation.
Security Manager
Oversees risk and remediation.
Executive
Gets high-level reports without needing every technical detail.
Different roles should have different permissions/views.
Finish line
SecondOrder behaves like an actual internal enterprise application rather than a public dashboard.

Phase 7 — Dashboards + executive reporting
Now we turn all that data into useful information.
Dashboard might show:
127 Assets
342 Open Vulnerabilities
18 Critical Risks
37 Open Remediation Tasks
11 Overdue Tasks
And visualizations such as:
risk by department
vulnerabilities by severity
remediation progress
highest-risk assets
risk trends
exposure breakdown
risk heatmap
We'll distinguish between:
Security analyst information
and
Executive information
because executives generally don't need a 900-row CVE table thrown at their forehead.
Finish line
SecondOrder clearly communicates both:
What is technically wrong?
and:
What does leadership need to care about?

Phase 8 — Real cybersecurity integration
This is where we move beyond manually-entered vulnerabilities.
We'll eventually feed SecondOrder structured scan/security data.
Potential pipeline:
Nmap
↓
scan output
↓
SecondOrder importer
↓
asset identification
↓
services discovered
↓
vulnerability information
↓
risk engine
Potentially also public CVE data.
We will start with safe sample/import files before doing anything complicated.
Finish line
SecondOrder can ingest external cybersecurity data and transform it into actionable organizational risk.
That's a BIG portfolio milestone.

Phase 9 — Portfolio polish + deployment
Only after the actual app works.
Then we make it recruiter-ready.
We'll add:
polished responsive UI
loading states
empty states
error handling
realistic demo company
demo user/account
tests for important logic
screenshots
architecture diagram
project documentation
setup instructions
technical decisions
cleaned-up README
public deployment
The GitHub README will eventually explain something like:
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
Analyst + Executive Dashboards

The actual finish line
We're DONE with SecondOrder v1 when somebody reviewing your internship application can click the project and:
Open a publicly deployed SecondOrder.
Sign into a demo environment.
See realistic company assets.
Inspect vulnerabilities affecting them.
See business context attached to those assets.
See SecondOrder prioritize vulnerabilities using technical + business risk.
Create/track remediation work.
See dashboards and reports.
See different permissions/users.
Look at GitHub and understand exactly how the application works.
At that point you can legitimately describe it as:
A full-stack enterprise cyber risk and vulnerability management platform that combines technical security findings with organizational business context to prioritize remediation.
That's the portfolio piece we're chasing.

One extremely important rule
We do not jump around the roadmap because something looks cool.
No:
"Bro let's add AI vulnerability summaries!"
while our database barely works. 💀
Our rule is:
Foundation
↓
UI
↓
Data
↓
Core functionality
↓
Risk engine
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
And each phase gets:
build → test → understand → commit → push → next phase
That is how we're going to fully vibecode this while still ending up with something you understand and can defend in an interview.
Current tracker
SecondOrder Progress

[✓] Repo created
[✓] GitHub published
[✓] README created
[✓] Project specification created
[✓] Initial commit pushed

[ ] Phase 0 — Application setup      ← WE ARE HERE
[ ] Phase 1 — UI shell
[ ] Phase 2 — Database
[ ] Phase 3 — Core functionality
[ ] Phase 4 — Risk engine
[ ] Phase 5 — Remediation workflow
[ ] Phase 6 — Authentication/security
[ ] Phase 7 — Dashboards/reporting
[ ] Phase 8 — Cyber integrations
[ ] Phase 9 — Portfolio/deployment

FINAL: SecondOrder v1 deployed
That is now our north star.
Next move is very contained: finish Phase 0 by choosing the stack and getting the first actual SecondOrder webpage running locally. No dashboard building yet, no database yet, no random extras.

