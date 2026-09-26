import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AssetStatus,
  OrganizationalRiskLevel,
  RiskStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "../generated/prisma/client";
import type {
  DashboardAssetInput,
  DashboardRiskInput,
  DashboardVulnerabilityInput,
} from "./dashboard";
import {
  buildReportSummary,
  getReportRoleView,
  type ReportInputs,
} from "./reports";

const department = { id: "department-1", name: "Operations" };

function makeAsset(
  id: string,
  overrides: Partial<DashboardAssetInput> = {}
): DashboardAssetInput {
  return {
    id,
    department,
    internetExposure: false,
    name: `Asset ${id}`,
    status: AssetStatus.ACTIVE,
    ...overrides,
  };
}

function makeVulnerability(
  id: string,
  overrides: Partial<DashboardVulnerabilityInput> = {}
): DashboardVulnerabilityInput {
  return {
    id,
    affectedAsset: { id: "asset-1", name: "Portal" },
    cvssScore: 8,
    identifier: `CVE-${id}`,
    severity: VulnerabilitySeverity.HIGH,
    status: VulnerabilityStatus.OPEN,
    title: `Finding ${id}`,
    ...overrides,
  };
}

function makeRisk(
  id: string,
  vulnerability: DashboardVulnerabilityInput,
  overrides: Partial<DashboardRiskInput> = {}
): DashboardRiskInput {
  return {
    id,
    organizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    organizationalRiskScore: 8,
    status: RiskStatus.OPEN,
    vulnerability: {
      id: vulnerability.id,
      identifier: vulnerability.identifier,
      title: vulnerability.title,
      cvssScore: vulnerability.cvssScore,
      severity: vulnerability.severity,
      status: vulnerability.status,
      affectedAsset: {
        id: vulnerability.affectedAsset.id,
        name: vulnerability.affectedAsset.name,
        status: AssetStatus.ACTIVE,
        department,
      },
    },
    ...overrides,
  };
}

function summarize(overrides: Partial<ReportInputs> = {}) {
  return buildReportSummary(
    {
      assets: [],
      vulnerabilities: [],
      risks: [],
      remediationTasks: [],
      ...overrides,
    },
    new Date("2026-09-25T12:00:00.000Z")
  );
}

describe("report aggregations", () => {
  it("groups only current unresolved risks by organizational level", () => {
    const vulnerability = makeVulnerability("risk-levels");
    const summary = summarize({
      risks: [
        makeRisk("critical", vulnerability, {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
        }),
        makeRisk("high", vulnerability),
        makeRisk("resolved", vulnerability, {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          status: RiskStatus.RESOLVED,
        }),
        makeRisk("accepted", vulnerability, {
          organizationalRiskLevel: OrganizationalRiskLevel.MEDIUM,
          status: RiskStatus.ACCEPTED_RISK,
        }),
      ],
    });

    assert.deepEqual(
      summary.riskLevelDistribution.map((item) => item.count),
      [1, 1, 0, 0]
    );
  });

  it("reuses active severity, department risk, and exposure semantics", () => {
    const first = makeVulnerability("first", {
      severity: VulnerabilitySeverity.CRITICAL,
    });
    const second = makeVulnerability("second", {
      severity: VulnerabilitySeverity.MEDIUM,
      status: VulnerabilityStatus.RESOLVED,
    });
    const summary = summarize({
      assets: [
        makeAsset("public", { internetExposure: true }),
        makeAsset("internal"),
        makeAsset("archived", {
          internetExposure: true,
          status: AssetStatus.ARCHIVED,
        }),
      ],
      vulnerabilities: [first, second],
      risks: [
        makeRisk("first-risk", first, { organizationalRiskScore: 8 }),
        makeRisk("second-risk", second, { organizationalRiskScore: 6 }),
      ],
    });

    assert.deepEqual(
      summary.vulnerabilitiesBySeverity.map((item) => item.count),
      [1, 0, 0, 0]
    );
    assert.deepEqual(summary.exposureSummary, {
      internetFacing: 1,
      internal: 1,
      total: 2,
      internetFacingPercentage: 50,
    });
    assert.equal(summary.riskByDepartment[0].riskCount, 2);
    assert.equal(summary.riskByDepartment[0].averageScore, 7);
    assert.equal(summary.riskByDepartment[0].highestScore, 8);
  });

  it("ranks assessed findings before deterministic technical tie-breakers", () => {
    const assessedLowerCvss = makeVulnerability("A", { cvssScore: 7 });
    const assessedHigherCvss = makeVulnerability("B", { cvssScore: 9 });
    const unassessedCritical = makeVulnerability("C", {
      cvssScore: 10,
      severity: VulnerabilitySeverity.CRITICAL,
    });
    const unassessedHigh = makeVulnerability("D", {
      cvssScore: 10,
      severity: VulnerabilitySeverity.HIGH,
    });
    const resolved = makeVulnerability("E", {
      cvssScore: 10,
      status: VulnerabilityStatus.RESOLVED,
    });
    const activeWithResolvedRisk = makeVulnerability("F", { cvssScore: 6 });

    const summary = summarize({
      vulnerabilities: [
        unassessedHigh,
        resolved,
        assessedLowerCvss,
        unassessedCritical,
        assessedHigherCvss,
        activeWithResolvedRisk,
      ],
      risks: [
        makeRisk("risk-a", assessedLowerCvss),
        makeRisk("risk-b", assessedHigherCvss),
        makeRisk("risk-f", activeWithResolvedRisk, {
          organizationalRiskScore: 9,
          status: RiskStatus.RESOLVED,
        }),
      ],
    });

    assert.deepEqual(
      summary.highestRiskVulnerabilities.map((item) => item.identifier),
      ["CVE-F", "CVE-B", "CVE-A", "CVE-C", "CVE-D"]
    );
  });

  it("returns clean empty report distributions and rankings", () => {
    const summary = summarize();

    assert.equal(
      summary.riskLevelDistribution.every((item) => item.count === 0),
      true
    );
    assert.deepEqual(summary.highestRiskVulnerabilities, []);
    assert.deepEqual(summary.criticalUnresolvedWork, []);
    assert.equal(summary.exposureSummary.total, 0);
  });

  it("composes distinct leadership and security-manager reports", () => {
    const executive = getReportRoleView(UserRole.EXECUTIVE);
    const securityManager = getReportRoleView(UserRole.SECURITY_MANAGER);

    assert.equal(executive.sections.includes("riskByDepartment"), true);
    assert.equal(executive.sections.includes("remediationWorkload"), false);
    assert.equal(
      executive.sections.includes("highestRiskVulnerabilities"),
      false
    );
    assert.equal(securityManager.sections.includes("remediationWorkload"), true);
    assert.equal(
      securityManager.sections.includes("highestRiskVulnerabilities"),
      true
    );
  });
});
