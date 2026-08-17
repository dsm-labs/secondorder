# SecondOrder Project Specification

## Overview

SecondOrder is an enterprise cyber risk and vulnerability management platform designed to help organizations understand, prioritize, and remediate cybersecurity risk.

The platform combines technical vulnerability data with business context so security teams can prioritize risks based not only on vulnerability severity, but also on asset importance, exposure, and organizational impact.

## Core Problem

Traditional vulnerability management tools can produce large numbers of findings without clearly communicating which vulnerabilities represent the greatest business risk.

SecondOrder aims to solve this by connecting cybersecurity data with business-critical information.

## Core Users

### Security Analyst
- Reviews vulnerabilities
- Investigates risk
- Creates remediation tasks
- Tracks unresolved findings

### IT Administrator
- Manages organizational assets
- Updates system information
- Resolves assigned remediation tasks

### Security Manager
- Reviews organizational risk
- Monitors remediation progress
- Views security metrics and trends

### Executive
- Views high-level cyber risk
- Reviews critical business exposures
- Tracks risk trends and remediation performance

## Initial Modules

### Dashboard
Displays:
- Total assets
- Total vulnerabilities
- Critical risks
- Open remediation tasks
- Risk trends
- Highest-risk systems

### Assets
Tracks:
- Asset name
- Asset type
- IP address
- Operating system
- Department
- Owner
- Business criticality
- Internet exposure
- Status

### Vulnerabilities
Tracks:
- CVE identifier
- Vulnerability title
- Description
- CVSS score
- Severity
- Affected asset
- Detection date
- Status

### Risks
Combines technical and business factors to determine organizational risk.

Risk factors may include:
- CVSS severity
- Asset criticality
- Internet exposure
- Data sensitivity
- Exploitability

### Remediation
Tracks:
- Assigned remediation tasks
- Responsible user/team
- Priority
- Status
- Due date
- Resolution notes

### Reports
Provides executive-level summaries of:
- Critical risks
- Vulnerability trends
- Remediation progress
- Asset exposure

## Security Features

SecondOrder will eventually include:
- Authentication
- Role-based access control
- Secure password handling
- Audit logs
- Input validation
- Protected API routes

## Future Integrations

Possible future integrations include:
- Nmap scan imports
- CVE/NVD vulnerability data
- OpenVAS vulnerability data
- Automated asset discovery

## Project Goal

SecondOrder should resemble a realistic enterprise cybersecurity SaaS product rather than a classroom demonstration.

The application should demonstrate skills in:
- Cybersecurity
- Information systems
- Risk management
- Databases
- Systems analysis
- Business processes
- Web application development