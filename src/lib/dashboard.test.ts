import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AssetStatus,
  OrganizationalRiskLevel,
  RemediationPriority,
  RemediationStatus,
  RiskStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "../generated/prisma/client";
import {
  buildDashboardSummary,
  getDashboardRoleView,
  type DashboardAssetInput,
  type DashboardInputs,
  type DashboardRemediationInput,
  type DashboardRiskInput,
  type DashboardVulnerabilityInput,
} from "./dashboard";

const currentTime = new Date("2026-09-25T12:00:00.000Z");
const department = { id: "department-1", name: "Technology" };

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
    affectedAsset: { id: "asset-1", name: "Customer Portal" },
    cvssScore: 8,
    identifier: `CVE-${id}`,
    severity: VulnerabilitySeverity.HIGH,
    status: VulnerabilityStatus.OPEN,
    title: `Vulnerability ${id}`,
    ...overrides,
  };
}

function makeRisk(
  id: string,
  overrides: Partial<DashboardRiskInput> = {}
): DashboardRiskInput {
  return {
    id,
    organizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    organizationalRiskScore: 8,
    status: RiskStatus.OPEN,
    vulnerability: {
      id: `vulnerability-${id}`,
      identifier: `CVE-${id}`,
      title: `Vulnerability ${id}`,
      cvssScore: 8,
      severity: VulnerabilitySeverity.HIGH,
      status: VulnerabilityStatus.OPEN,
      affectedAsset: {
        id: `asset-${id}`,
        name: `Asset ${id}`,
        status: AssetStatus.ACTIVE,
        department,
      },
    },
    ...overrides,
  };
}

function makeTask(
  id: string,
  overrides: Partial<DashboardRemediationInput> = {}
): DashboardRemediationInput {
  return {
    id,
    title: `Task ${id}`,
    dueDate: new Date("2026-09-30T12:00:00.000Z"),
    priority: RemediationPriority.HIGH,
    status: RemediationStatus.OPEN,
    assignedUser: {
      id: "user-1",
      name: "Jordan Lee",
      department: { name: "Technology" },
    },
    ...overrides,
  };
}

function summarize(overrides: Partial<DashboardInputs> = {}) {
  return buildDashboardSummary(
    {
      assets: [],
      vulnerabilities: [],
      risks: [],
      remediationTasks: [],
      ...overrides,
    },
    currentTime
  );
}

describe("dashboard aggregations", () => {
  it("excludes archived assets from total assets", () => {
    const summary = summarize({
      assets: [
        makeAsset("active"),
        makeAsset("inactive", { status: AssetStatus.INACTIVE }),
        makeAsset("archived", { status: AssetStatus.ARCHIVED }),
      ],
    });

    assert.equal(summary.metrics.totalAssets, 2);
  });

  it("excludes resolved and accepted vulnerabilities from open counts", () => {
    const summary = summarize({
      vulnerabilities: [
        makeVulnerability("open", {
          severity: VulnerabilitySeverity.CRITICAL,
        }),
        makeVulnerability("review", {
          severity: VulnerabilitySeverity.HIGH,
          status: VulnerabilityStatus.IN_REVIEW,
        }),
        makeVulnerability("resolved", {
          severity: VulnerabilitySeverity.CRITICAL,
          status: VulnerabilityStatus.RESOLVED,
        }),
        makeVulnerability("accepted", {
          status: VulnerabilityStatus.ACCEPTED_RISK,
        }),
      ],
    });

    assert.equal(summary.metrics.openVulnerabilities, 2);
    assert.equal(summary.metrics.criticalHighVulnerabilities, 2);
    assert.deepEqual(
      summary.vulnerabilitiesBySeverity.map((item) => item.count),
      [1, 1, 0, 0]
    );
  });

  it("excludes resolved and accepted risk records from critical risk counts", () => {
    const summary = summarize({
      risks: [
        makeRisk("open", {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
        }),
        makeRisk("review", {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          status: RiskStatus.IN_REVIEW,
        }),
        makeRisk("resolved", {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          status: RiskStatus.RESOLVED,
        }),
        makeRisk("accepted", {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          status: RiskStatus.ACCEPTED_RISK,
        }),
      ],
    });

    assert.equal(summary.metrics.criticalRisks, 2);
  });

  it("reuses active and overdue remediation semantics", () => {
    const pastDue = new Date("2026-09-20T12:00:00.000Z");
    const summary = summarize({
      remediationTasks: [
        makeTask("open-overdue", { dueDate: pastDue }),
        makeTask("awaiting", {
          status: RemediationStatus.AWAITING_VALIDATION,
        }),
        makeTask("resolved", {
          dueDate: pastDue,
          status: RemediationStatus.RESOLVED,
        }),
        makeTask("accepted", {
          dueDate: pastDue,
          status: RemediationStatus.ACCEPTED_RISK,
        }),
      ],
    });

    assert.equal(summary.metrics.openRemediation, 2);
    assert.equal(summary.metrics.overdueRemediation, 1);
  });

  it("aggregates every remediation progress state", () => {
    const summary = summarize({
      remediationTasks: [
        makeTask("open"),
        makeTask("progress", { status: RemediationStatus.IN_PROGRESS }),
        makeTask("validation", {
          status: RemediationStatus.AWAITING_VALIDATION,
        }),
        makeTask("resolved", { status: RemediationStatus.RESOLVED }),
        makeTask("accepted", { status: RemediationStatus.ACCEPTED_RISK }),
      ],
    });

    assert.deepEqual(
      summary.remediationProgress.map((item) => item.count),
      [2, 1, 1, 1]
    );
  });

  it("calculates exposure from non-archived assets only", () => {
    const summary = summarize({
      assets: [
        makeAsset("public", { internetExposure: true }),
        makeAsset("internal"),
        makeAsset("archived-public", {
          internetExposure: true,
          status: AssetStatus.ARCHIVED,
        }),
      ],
    });

    assert.deepEqual(summary.exposureSummary, {
      internetFacing: 1,
      internal: 1,
      total: 2,
      internetFacingPercentage: 50,
    });
  });

  it("ranks highest-risk assets deterministically", () => {
    const alphaRisk = makeRisk("alpha", {
      organizationalRiskScore: 9,
      organizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    });
    alphaRisk.vulnerability.affectedAsset = {
      id: "asset-alpha",
      name: "Alpha",
      status: AssetStatus.ACTIVE,
      department,
    };

    const betaRiskOne = makeRisk("beta-one", {
      organizationalRiskScore: 9,
      organizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    });
    betaRiskOne.vulnerability.affectedAsset = {
      id: "asset-beta",
      name: "Beta",
      status: AssetStatus.ACTIVE,
      department,
    };

    const betaRiskTwo = makeRisk("beta-two", {
      organizationalRiskScore: 8,
      organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
    });
    betaRiskTwo.vulnerability.affectedAsset =
      betaRiskOne.vulnerability.affectedAsset;

    const charlieRisk = makeRisk("charlie", {
      organizationalRiskScore: 9,
      organizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    });
    charlieRisk.vulnerability.affectedAsset = {
      id: "asset-charlie",
      name: "Charlie",
      status: AssetStatus.ACTIVE,
      department,
    };

    const summary = summarize({
      risks: [charlieRisk, betaRiskTwo, alphaRisk, betaRiskOne],
    });

    assert.deepEqual(
      summary.highestRiskAssets.map((asset) => asset.assetName),
      ["Beta", "Alpha", "Charlie"]
    );
  });

  it("returns stable zero-value summaries for an empty dataset", () => {
    const summary = summarize();

    assert.deepEqual(summary.metrics, {
      totalAssets: 0,
      openVulnerabilities: 0,
      criticalHighVulnerabilities: 0,
      criticalRisks: 0,
      openRemediation: 0,
      overdueRemediation: 0,
      internetFacingAssets: 0,
    });
    assert.deepEqual(summary.riskByDepartment, []);
    assert.deepEqual(summary.highestRiskAssets, []);
    assert.equal(summary.exposureSummary.internetFacingPercentage, 0);
    assert.equal(
      summary.vulnerabilitiesBySeverity.every((item) => item.count === 0),
      true
    );
  });

  it("provides distinct executive and operational role views", () => {
    const executiveView = getDashboardRoleView(UserRole.EXECUTIVE);
    const itAdminView = getDashboardRoleView(UserRole.IT_ADMIN);

    assert.equal(
      executiveView.sections.includes("riskByDepartment"),
      true
    );
    assert.equal(
      executiveView.sections.includes("remediationWorkload"),
      false
    );
    assert.equal(itAdminView.sections.includes("remediationWorkload"), true);
    assert.equal(
      itAdminView.metrics.includes("internetFacingAssets"),
      true
    );
  });
});
