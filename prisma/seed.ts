import {
  AssetStatus,
  AuditAction,
  AuditEntityType,
  BusinessCriticality,
  BusinessImpact,
  DataSensitivity,
  RemediationPriority,
  RemediationStatus,
  RiskStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "../src/generated/prisma/client";
import { calculateOrganizationalRisk } from "../src/lib/risk-engine";
import prisma from "../src/lib/prisma";

const ids = {
  departments: {
    security: "11111111-1111-4111-8111-111111111111",
    infrastructure: "22222222-2222-4222-8222-222222222222",
    finance: "33333333-3333-4333-8333-333333333333",
    operations: "44444444-4444-4444-8444-444444444444",
    executive: "55555555-5555-4555-8555-555555555555",
  },
  users: {
    maya: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
    noah: "aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa",
    priya: "aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa",
    ethan: "aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa",
    sofia: "aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa",
    liam: "aaaaaaaa-6666-4666-8666-aaaaaaaaaaaa",
    ava: "aaaaaaaa-7777-4777-8777-aaaaaaaaaaaa",
    jordan: "aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa",
  },
  assets: {
    customerPortal: "bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb",
    apiGateway: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
    financeDb: "bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb",
    payrollSystem: "bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb",
    hrFileShare: "bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb",
    identityProvider: "bbbbbbbb-6666-4666-8666-bbbbbbbbbbbb",
    vpnConcentrator: "bbbbbbbb-7777-4777-8777-bbbbbbbbbbbb",
    workstationPoolA: "bbbbbbbb-8888-4888-8888-bbbbbbbbbbbb",
    analyticsWarehouse: "bbbbbbbb-9999-4999-8999-bbbbbbbbbbbb",
    ticketingPlatform: "bbbbbbbb-aaaa-4aaa-8aaa-bbbbbbbbbbbb",
    backupRepository: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    networkSwitchCore: "bbbbbbbb-cccc-4ccc-8ccc-bbbbbbbbbbbb",
    executiveLaptopPool: "bbbbbbbb-dddd-4ddd-8ddd-bbbbbbbbbbbb",
    vendorPortal: "bbbbbbbb-eeee-4eee-8eee-bbbbbbbbbbbb",
  },
};

const departments = [
  {
    id: ids.departments.security,
    name: "Security Operations",
    description: "Monitors cyber risk, vulnerabilities, and remediation.",
  },
  {
    id: ids.departments.infrastructure,
    name: "Infrastructure",
    description: "Owns servers, networks, identity, and endpoint platforms.",
  },
  {
    id: ids.departments.finance,
    name: "Finance",
    description: "Operates financial reporting and payment workflows.",
  },
  {
    id: ids.departments.operations,
    name: "Operations",
    description: "Supports customer-facing and internal business processes.",
  },
  {
    id: ids.departments.executive,
    name: "Executive Office",
    description: "Reviews organizational risk and business impact.",
  },
] as const;

const users = [
  {
    id: ids.users.maya,
    name: "Maya Chen",
    email: "maya.chen@secondorder-demo.example",
    role: UserRole.ANALYST,
    departmentId: ids.departments.security,
  },
  {
    id: ids.users.noah,
    name: "Noah Patel",
    email: "noah.patel@secondorder-demo.example",
    role: UserRole.ANALYST,
    departmentId: ids.departments.security,
  },
  {
    id: ids.users.priya,
    name: "Priya Shah",
    email: "priya.shah@secondorder-demo.example",
    role: UserRole.SECURITY_MANAGER,
    departmentId: ids.departments.security,
  },
  {
    id: ids.users.ethan,
    name: "Ethan Brooks",
    email: "ethan.brooks@secondorder-demo.example",
    role: UserRole.IT_ADMIN,
    departmentId: ids.departments.infrastructure,
  },
  {
    id: ids.users.sofia,
    name: "Sofia Martinez",
    email: "sofia.martinez@secondorder-demo.example",
    role: UserRole.IT_ADMIN,
    departmentId: ids.departments.infrastructure,
  },
  {
    id: ids.users.liam,
    name: "Liam Carter",
    email: "liam.carter@secondorder-demo.example",
    role: UserRole.IT_ADMIN,
    departmentId: ids.departments.operations,
  },
  {
    id: ids.users.ava,
    name: "Ava Thompson",
    email: "ava.thompson@secondorder-demo.example",
    role: UserRole.EXECUTIVE,
    departmentId: ids.departments.executive,
  },
  {
    id: ids.users.jordan,
    name: "Jordan Lee",
    email: "jordan.lee@secondorder-demo.example",
    role: UserRole.EXECUTIVE,
    departmentId: ids.departments.finance,
  },
] as const;

const assets = [
  {
    id: ids.assets.customerPortal,
    name: "Customer Portal",
    assetType: "Web Application",
    ipAddress: "10.20.14.12",
    operatingSystem: "Ubuntu Server 22.04",
    departmentId: ids.departments.operations,
    ownerId: ids.users.liam,
    businessCriticality: BusinessCriticality.CRITICAL,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.apiGateway,
    name: "API Gateway",
    assetType: "Application Gateway",
    ipAddress: "10.20.14.20",
    operatingSystem: "Amazon Linux 2023",
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.ethan,
    businessCriticality: BusinessCriticality.CRITICAL,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.financeDb,
    name: "Finance Database",
    assetType: "Database Server",
    ipAddress: "10.20.30.8",
    operatingSystem: "PostgreSQL on Linux",
    departmentId: ids.departments.finance,
    ownerId: ids.users.jordan,
    businessCriticality: BusinessCriticality.CRITICAL,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.payrollSystem,
    name: "Payroll System",
    assetType: "Business Application",
    ipAddress: "10.20.31.18",
    operatingSystem: "Windows Server 2022",
    departmentId: ids.departments.finance,
    ownerId: ids.users.jordan,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.hrFileShare,
    name: "HR File Share",
    assetType: "File Server",
    ipAddress: "10.20.22.15",
    operatingSystem: "Windows Server 2022",
    departmentId: ids.departments.operations,
    ownerId: ids.users.sofia,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.identityProvider,
    name: "Identity Provider",
    assetType: "Identity Platform",
    ipAddress: "10.20.10.5",
    operatingSystem: null,
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.ethan,
    businessCriticality: BusinessCriticality.CRITICAL,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.vpnConcentrator,
    name: "VPN Concentrator",
    assetType: "Network Appliance",
    ipAddress: "10.20.10.12",
    operatingSystem: "Appliance OS",
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.sofia,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.workstationPoolA,
    name: "Workstation Pool A",
    assetType: "Endpoint Group",
    ipAddress: "10.20.40.0/24",
    operatingSystem: "Windows 11 Enterprise",
    departmentId: ids.departments.operations,
    ownerId: ids.users.liam,
    businessCriticality: BusinessCriticality.MEDIUM,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.analyticsWarehouse,
    name: "Analytics Warehouse",
    assetType: "Data Warehouse",
    ipAddress: "10.20.33.25",
    operatingSystem: "Managed Database",
    departmentId: ids.departments.operations,
    ownerId: ids.users.jordan,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.ticketingPlatform,
    name: "IT Ticketing Platform",
    assetType: "SaaS Application",
    ipAddress: null,
    operatingSystem: null,
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.ethan,
    businessCriticality: BusinessCriticality.MEDIUM,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.backupRepository,
    name: "Backup Repository",
    assetType: "Storage Platform",
    ipAddress: "10.20.50.10",
    operatingSystem: "Linux Storage OS",
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.sofia,
    businessCriticality: BusinessCriticality.CRITICAL,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.networkSwitchCore,
    name: "Core Network Switch",
    assetType: "Network Infrastructure",
    ipAddress: "10.20.1.2",
    operatingSystem: "Switch Firmware",
    departmentId: ids.departments.infrastructure,
    ownerId: ids.users.sofia,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.executiveLaptopPool,
    name: "Executive Laptop Pool",
    assetType: "Endpoint Group",
    ipAddress: "10.20.45.0/28",
    operatingSystem: "macOS",
    departmentId: ids.departments.executive,
    ownerId: ids.users.ethan,
    businessCriticality: BusinessCriticality.HIGH,
    internetExposure: false,
    status: AssetStatus.ACTIVE,
  },
  {
    id: ids.assets.vendorPortal,
    name: "Vendor Portal",
    assetType: "Web Application",
    ipAddress: "10.20.14.32",
    operatingSystem: "Ubuntu Server 22.04",
    departmentId: ids.departments.finance,
    ownerId: ids.users.liam,
    businessCriticality: BusinessCriticality.MEDIUM,
    internetExposure: true,
    status: AssetStatus.ACTIVE,
  },
] as const;

const vulnerabilities = [
  ["001", "Remote code execution exposure", "9.8", VulnerabilitySeverity.CRITICAL, ids.assets.customerPortal, "2026-08-01", VulnerabilityStatus.OPEN],
  ["002", "Authentication bypass in admin workflow", "9.1", VulnerabilitySeverity.CRITICAL, ids.assets.financeDb, "2026-08-02", VulnerabilityStatus.OPEN],
  ["003", "Outdated secure shell service", "8.1", VulnerabilitySeverity.HIGH, ids.assets.hrFileShare, "2026-08-03", VulnerabilityStatus.IN_REVIEW],
  ["004", "Endpoint baseline configuration weakness", "5.9", VulnerabilitySeverity.MEDIUM, ids.assets.workstationPoolA, "2026-08-04", VulnerabilityStatus.ACCEPTED_RISK],
  ["005", "Weak session timeout configuration", "6.5", VulnerabilitySeverity.MEDIUM, ids.assets.customerPortal, "2026-08-05", VulnerabilityStatus.OPEN],
  ["006", "Public endpoint missing strict transport policy", "6.1", VulnerabilitySeverity.MEDIUM, ids.assets.apiGateway, "2026-08-06", VulnerabilityStatus.OPEN],
  ["007", "Privileged service account over-permissioned", "8.4", VulnerabilitySeverity.HIGH, ids.assets.identityProvider, "2026-08-07", VulnerabilityStatus.OPEN],
  ["008", "VPN firmware behind approved baseline", "7.5", VulnerabilitySeverity.HIGH, ids.assets.vpnConcentrator, "2026-08-08", VulnerabilityStatus.IN_REVIEW],
  ["009", "Backup storage encryption policy gap", "7.2", VulnerabilitySeverity.HIGH, ids.assets.backupRepository, "2026-08-09", VulnerabilityStatus.OPEN],
  ["010", "Database audit logging disabled", "6.8", VulnerabilitySeverity.MEDIUM, ids.assets.analyticsWarehouse, "2026-08-10", VulnerabilityStatus.OPEN],
  ["011", "Legacy TLS protocol enabled", "7.4", VulnerabilitySeverity.HIGH, ids.assets.payrollSystem, "2026-08-11", VulnerabilityStatus.IN_REVIEW],
  ["012", "Unpatched third-party application dependency", "8.8", VulnerabilitySeverity.HIGH, ids.assets.vendorPortal, "2026-08-12", VulnerabilityStatus.OPEN],
  ["013", "Network device management interface exposed internally", "6.7", VulnerabilitySeverity.MEDIUM, ids.assets.networkSwitchCore, "2026-08-13", VulnerabilityStatus.OPEN],
  ["014", "Endpoint local admin group drift", "7.0", VulnerabilitySeverity.HIGH, ids.assets.executiveLaptopPool, "2026-08-14", VulnerabilityStatus.OPEN],
  ["015", "SaaS integration token lacks rotation policy", "5.6", VulnerabilitySeverity.MEDIUM, ids.assets.ticketingPlatform, "2026-08-15", VulnerabilityStatus.IN_REVIEW],
  ["016", "Missing rate limiting on public API route", "7.8", VulnerabilitySeverity.HIGH, ids.assets.apiGateway, "2026-08-16", VulnerabilityStatus.OPEN],
  ["017", "Sensitive export folder permissions too broad", "8.0", VulnerabilitySeverity.HIGH, ids.assets.financeDb, "2026-08-17", VulnerabilityStatus.OPEN],
  ["018", "Inactive user access retained", "6.9", VulnerabilitySeverity.MEDIUM, ids.assets.identityProvider, "2026-08-18", VulnerabilityStatus.OPEN],
  ["019", "Monitoring coverage gap on payment workflow", "5.4", VulnerabilitySeverity.MEDIUM, ids.assets.payrollSystem, "2026-08-19", VulnerabilityStatus.RESOLVED],
  ["020", "Administrative console lacks network restriction", "8.6", VulnerabilitySeverity.HIGH, ids.assets.backupRepository, "2026-08-20", VulnerabilityStatus.OPEN],
  ["021", "File share retention policy not enforced", "4.9", VulnerabilitySeverity.LOW, ids.assets.hrFileShare, "2026-08-21", VulnerabilityStatus.ACCEPTED_RISK],
  ["022", "Vendor upload path allows oversized files", "5.8", VulnerabilitySeverity.MEDIUM, ids.assets.vendorPortal, "2026-08-22", VulnerabilityStatus.OPEN],
] as const;

const riskProfiles = [
  [DataSensitivity.HIGH, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.IN_REVIEW],
  [DataSensitivity.MEDIUM, BusinessImpact.MEDIUM, RiskStatus.ACCEPTED_RISK],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.MEDIUM, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.IN_REVIEW],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.IN_REVIEW],
  [DataSensitivity.MEDIUM, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.LOW, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.HIGH, RiskStatus.OPEN],
  [DataSensitivity.MEDIUM, BusinessImpact.MEDIUM, RiskStatus.IN_REVIEW],
  [DataSensitivity.HIGH, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.MEDIUM, BusinessImpact.HIGH, RiskStatus.RESOLVED],
  [DataSensitivity.CRITICAL, BusinessImpact.CRITICAL, RiskStatus.OPEN],
  [DataSensitivity.HIGH, BusinessImpact.MEDIUM, RiskStatus.ACCEPTED_RISK],
  [DataSensitivity.MEDIUM, BusinessImpact.MEDIUM, RiskStatus.OPEN],
] as const;

const remediationTasks = [
  ["01", "Patch customer portal runtime", ids.users.ethan, "001", ids.assets.customerPortal, RemediationPriority.CRITICAL, "2026-08-29", RemediationStatus.OPEN],
  ["02", "Review finance database access controls", ids.users.sofia, "002", ids.assets.financeDb, RemediationPriority.CRITICAL, "2026-08-30", RemediationStatus.IN_PROGRESS],
  ["03", "Upgrade HR file share secure shell service", ids.users.sofia, "003", ids.assets.hrFileShare, RemediationPriority.HIGH, "2026-09-02", RemediationStatus.AWAITING_VALIDATION],
  ["04", "Document endpoint baseline exception", ids.users.liam, "004", ids.assets.workstationPoolA, RemediationPriority.MEDIUM, "2026-09-05", RemediationStatus.ACCEPTED_RISK],
  ["05", "Tune customer portal session controls", ids.users.liam, "005", ids.assets.customerPortal, RemediationPriority.HIGH, "2026-09-01", RemediationStatus.OPEN],
  ["06", "Enforce public API transport policy", ids.users.ethan, "006", ids.assets.apiGateway, RemediationPriority.MEDIUM, "2026-09-03", RemediationStatus.OPEN],
  ["07", "Reduce identity service account permissions", ids.users.ethan, "007", ids.assets.identityProvider, RemediationPriority.CRITICAL, "2026-08-31", RemediationStatus.IN_PROGRESS],
  ["08", "Schedule VPN firmware update window", ids.users.sofia, "008", ids.assets.vpnConcentrator, RemediationPriority.HIGH, "2026-09-06", RemediationStatus.OPEN],
  ["09", "Close backup encryption policy gap", ids.users.sofia, "009", ids.assets.backupRepository, RemediationPriority.CRITICAL, "2026-09-04", RemediationStatus.OPEN],
  ["10", "Enable warehouse database audit logging", ids.users.jordan, "010", ids.assets.analyticsWarehouse, RemediationPriority.HIGH, "2026-09-08", RemediationStatus.OPEN],
  ["11", "Disable legacy TLS for payroll", ids.users.ethan, "011", ids.assets.payrollSystem, RemediationPriority.HIGH, "2026-09-07", RemediationStatus.AWAITING_VALIDATION],
  ["12", "Patch vendor portal dependency", ids.users.liam, "012", ids.assets.vendorPortal, RemediationPriority.HIGH, "2026-09-09", RemediationStatus.OPEN],
] as const;

const auditEvents = [
  ["01", ids.users.maya, AuditAction.CREATE, AuditEntityType.ASSET, ids.assets.customerPortal, "Created demo asset record for Customer Portal."],
  ["02", ids.users.noah, AuditAction.CREATE, AuditEntityType.VULNERABILITY, "cccccccc-0010-4010-8010-cccccccccccc", "Logged demo vulnerability CVE-DEMO-001."],
  ["03", ids.users.priya, AuditAction.CREATE, AuditEntityType.RISK_RECORD, "dddddddd-0010-4010-8010-dddddddddddd", "Created demo organizational risk record for Customer Portal exposure."],
  ["04", ids.users.priya, AuditAction.ASSIGN, AuditEntityType.REMEDIATION_TASK, "eeeeeeee-0010-4010-8010-eeeeeeeeeeee", "Assigned customer portal remediation to Web Platform Team."],
  ["05", ids.users.ethan, AuditAction.UPDATE, AuditEntityType.ASSET, ids.assets.identityProvider, "Updated demo ownership for Identity Provider."],
  ["06", ids.users.sofia, AuditAction.STATUS_CHANGE, AuditEntityType.REMEDIATION_TASK, "eeeeeeee-0030-4030-8030-eeeeeeeeeeee", "Moved HR file share task to awaiting validation."],
  ["07", ids.users.ava, AuditAction.LOGIN, AuditEntityType.USER, ids.users.ava, "Executive demo user signed in for reporting review."],
  ["08", ids.users.maya, AuditAction.UPDATE, AuditEntityType.VULNERABILITY, "cccccccc-0190-4190-8190-cccccccccccc", "Marked monitoring coverage finding as resolved."],
] as const;

function demoUuid(prefix: string, number: string) {
  const normalized = number.padStart(3, "0");
  const lastTwoDigits = normalized.slice(1);

  return `${prefix}-${normalized}0-4${lastTwoDigits}0-8${lastTwoDigits}0-${prefix}${prefix.slice(0, 4)}`;
}

function vulnerabilityId(number: string) {
  return demoUuid("cccccccc", number);
}

function riskRecordId(number: string) {
  return demoUuid("dddddddd", number);
}

function remediationTaskId(number: string) {
  return demoUuid("eeeeeeee", number);
}

function auditEventId(number: string) {
  return demoUuid("ffffffff", number);
}

async function main() {
  for (const department of departments) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: department,
      create: department,
    });
  }

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: asset,
      create: asset,
    });
  }

  for (const [number, title, cvssScore, severity, affectedAssetId, detectionDate, status] of vulnerabilities) {
    const identifier = `CVE-DEMO-${number}`;

    await prisma.vulnerability.upsert({
      where: {
        identifier_affectedAssetId: {
          identifier,
          affectedAssetId,
        },
      },
      update: {
        title,
        description: `${title} affecting ${assets.find((asset) => asset.id === affectedAssetId)?.name ?? "a demo asset"}.`,
        cvssScore,
        severity,
        detectionDate: new Date(`${detectionDate}T12:00:00.000Z`),
        status,
      },
      create: {
        id: vulnerabilityId(number),
        identifier,
        title,
        description: `${title} affecting ${assets.find((asset) => asset.id === affectedAssetId)?.name ?? "a demo asset"}.`,
        cvssScore,
        severity,
        affectedAssetId,
        detectionDate: new Date(`${detectionDate}T12:00:00.000Z`),
        status,
      },
    });
  }

  for (const [index, vulnerability] of vulnerabilities.entries()) {
    const number = vulnerability[0];
    const [, , cvssScore, , affectedAssetId] = vulnerability;
    const [dataSensitivity, businessImpact, status] = riskProfiles[index];
    const affectedAsset = assets.find((asset) => asset.id === affectedAssetId);

    if (!affectedAsset) {
      throw new Error(`Missing seeded asset for CVE-DEMO-${number}.`);
    }

    const calculatedRisk = calculateOrganizationalRisk({
      cvssScore: Number(cvssScore),
      assetCriticality: affectedAsset.businessCriticality,
      businessImpact,
      dataSensitivity,
      internetExposure: affectedAsset.internetExposure,
    });

    await prisma.riskRecord.upsert({
      where: { vulnerabilityId: vulnerabilityId(number) },
      update: {
        dataSensitivity,
        businessImpact,
        organizationalRiskScore: calculatedRisk.organizationalRiskScore,
        organizationalRiskLevel: calculatedRisk.organizationalRiskLevel,
        explanation: calculatedRisk.explanation,
        status,
      },
      create: {
        id: riskRecordId(number),
        vulnerabilityId: vulnerabilityId(number),
        dataSensitivity,
        businessImpact,
        organizationalRiskScore: calculatedRisk.organizationalRiskScore,
        organizationalRiskLevel: calculatedRisk.organizationalRiskLevel,
        explanation: calculatedRisk.explanation,
        status,
      },
    });
  }

  for (const [number, title, assignedUserId, vulnerabilityNumber, relatedAssetId, priority, dueDate, status] of remediationTasks) {
    await prisma.remediationTask.upsert({
      where: { id: remediationTaskId(number) },
      update: {
        title,
        description: `Demo remediation task for CVE-DEMO-${vulnerabilityNumber}.`,
        assignedUserId,
        relatedVulnerabilityId: vulnerabilityId(vulnerabilityNumber),
        relatedAssetId,
        priority,
        dueDate: new Date(`${dueDate}T17:00:00.000Z`),
        status,
        resolutionNotes:
          status === RemediationStatus.ACCEPTED_RISK
            ? "Demo accepted-risk note for portfolio data."
            : null,
      },
      create: {
        id: remediationTaskId(number),
        title,
        description: `Demo remediation task for CVE-DEMO-${vulnerabilityNumber}.`,
        assignedUserId,
        relatedVulnerabilityId: vulnerabilityId(vulnerabilityNumber),
        relatedAssetId,
        priority,
        dueDate: new Date(`${dueDate}T17:00:00.000Z`),
        status,
        resolutionNotes:
          status === RemediationStatus.ACCEPTED_RISK
            ? "Demo accepted-risk note for portfolio data."
            : null,
      },
    });
  }

  for (const [number, userId, action, entityType, entityId, description] of auditEvents) {
    await prisma.auditEvent.upsert({
      where: { id: auditEventId(number) },
      update: {
        userId,
        action,
        entityType,
        entityId,
        description,
      },
      create: {
        id: auditEventId(number),
        userId,
        action,
        entityType,
        entityId,
        description,
      },
    });
  }

  console.log("Prepared SecondOrder demo seed data.");
  console.log({
    departments: departments.length,
    users: users.length,
    assets: assets.length,
    vulnerabilities: vulnerabilities.length,
    riskRecords: riskProfiles.length,
    remediationTasks: remediationTasks.length,
    auditEvents: auditEvents.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
