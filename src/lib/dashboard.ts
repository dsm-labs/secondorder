import {
  AssetStatus,
  OrganizationalRiskLevel,
  RemediationStatus,
  RiskStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  type AssetStatus as AssetStatusValue,
  type OrganizationalRiskLevel as OrganizationalRiskLevelValue,
  type RemediationPriority as RemediationPriorityValue,
  type RemediationStatus as RemediationStatusValue,
  type RiskStatus as RiskStatusValue,
  type UserRole as UserRoleValue,
  type VulnerabilitySeverity as VulnerabilitySeverityValue,
  type VulnerabilityStatus as VulnerabilityStatusValue,
} from "../generated/prisma/client";
import {
  aggregateRemediationWorkload,
  isRemediationTaskActive,
  isRemediationTaskOverdue,
} from "./remediation";

export type DashboardAssetInput = {
  id: string;
  internetExposure: boolean;
  name: string;
  status: AssetStatusValue;
  department: { id: string; name: string };
};

export type DashboardVulnerabilityInput = {
  id: string;
  identifier: string;
  title: string;
  cvssScore: number;
  severity: VulnerabilitySeverityValue;
  status: VulnerabilityStatusValue;
  affectedAsset: { id: string; name: string };
};

export type DashboardRiskInput = {
  id: string;
  organizationalRiskLevel: OrganizationalRiskLevelValue;
  organizationalRiskScore: number;
  status: RiskStatusValue;
  vulnerability: {
    id: string;
    identifier: string;
    title: string;
    cvssScore: number;
    severity: VulnerabilitySeverityValue;
    status: VulnerabilityStatusValue;
    affectedAsset: {
      id: string;
      name: string;
      status: AssetStatusValue;
      department: { id: string; name: string };
    };
  };
};

export type DashboardRemediationInput = {
  id: string;
  title: string;
  dueDate: Date;
  priority: RemediationPriorityValue;
  status: RemediationStatusValue;
  assignedUser: {
    id: string;
    name: string;
    department: { name: string } | null;
  };
};

export type DashboardInputs = {
  assets: readonly DashboardAssetInput[];
  vulnerabilities: readonly DashboardVulnerabilityInput[];
  risks: readonly DashboardRiskInput[];
  remediationTasks: readonly DashboardRemediationInput[];
};

export type DashboardMetricKey =
  | "totalAssets"
  | "openVulnerabilities"
  | "criticalHighVulnerabilities"
  | "criticalRisks"
  | "openRemediation"
  | "overdueRemediation"
  | "internetFacingAssets";

export type DashboardSectionKey =
  | "riskByDepartment"
  | "vulnerabilitiesBySeverity"
  | "remediationProgress"
  | "highestRiskAssets"
  | "highestRiskVulnerabilities"
  | "exposureSummary"
  | "remediationWorkload";

const activeVulnerabilityStatuses = new Set<VulnerabilityStatusValue>([
  VulnerabilityStatus.OPEN,
  VulnerabilityStatus.IN_REVIEW,
]);

const inactiveRiskStatuses = new Set<RiskStatusValue>([
  RiskStatus.RESOLVED,
  RiskStatus.ACCEPTED_RISK,
]);

const highRiskLevels = new Set<OrganizationalRiskLevelValue>([
  OrganizationalRiskLevel.CRITICAL,
  OrganizationalRiskLevel.HIGH,
]);

function isActiveVulnerability(vulnerability: DashboardVulnerabilityInput) {
  return activeVulnerabilityStatuses.has(vulnerability.status);
}

function isCurrentRisk(risk: DashboardRiskInput) {
  return !inactiveRiskStatuses.has(risk.status);
}

function roundToTwo(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildDashboardSummary(
  inputs: DashboardInputs,
  currentTime = new Date()
) {
  const activeAssets = inputs.assets.filter(
    (asset) => asset.status !== AssetStatus.ARCHIVED
  );
  const activeVulnerabilities = inputs.vulnerabilities.filter(
    isActiveVulnerability
  );
  const currentRisks = inputs.risks.filter(isCurrentRisk);
  const currentAssetRisks = currentRisks.filter(
    (risk) => risk.vulnerability.affectedAsset.status !== AssetStatus.ARCHIVED
  );
  const internetFacingAssetCount = activeAssets.filter(
    (asset) => asset.internetExposure
  ).length;

  const severityCounts = new Map<VulnerabilitySeverityValue, number>(
    Object.values(VulnerabilitySeverity).map((severity) => [severity, 0])
  );

  for (const vulnerability of activeVulnerabilities) {
    severityCounts.set(
      vulnerability.severity,
      (severityCounts.get(vulnerability.severity) ?? 0) + 1
    );
  }

  const progressCounts = {
    active: 0,
    awaitingValidation: 0,
    resolved: 0,
    acceptedRisk: 0,
  };

  for (const task of inputs.remediationTasks) {
    if (task.status === RemediationStatus.AWAITING_VALIDATION) {
      progressCounts.awaitingValidation += 1;
    } else if (task.status === RemediationStatus.RESOLVED) {
      progressCounts.resolved += 1;
    } else if (task.status === RemediationStatus.ACCEPTED_RISK) {
      progressCounts.acceptedRisk += 1;
    } else {
      progressCounts.active += 1;
    }
  }

  const departmentMap = new Map<
    string,
    {
      departmentId: string;
      departmentName: string;
      riskCount: number;
      criticalHighRiskCount: number;
      totalScore: number;
      highestScore: number;
    }
  >();

  for (const risk of currentAssetRisks) {
    const department = risk.vulnerability.affectedAsset.department;
    const summary = departmentMap.get(department.id) ?? {
      departmentId: department.id,
      departmentName: department.name,
      riskCount: 0,
      criticalHighRiskCount: 0,
      totalScore: 0,
      highestScore: 0,
    };

    summary.riskCount += 1;
    summary.totalScore += risk.organizationalRiskScore;
    summary.highestScore = Math.max(
      summary.highestScore,
      risk.organizationalRiskScore
    );

    if (highRiskLevels.has(risk.organizationalRiskLevel)) {
      summary.criticalHighRiskCount += 1;
    }

    departmentMap.set(department.id, summary);
  }

  const riskByDepartment = [...departmentMap.values()]
    .map(({ totalScore, ...department }) => ({
      ...department,
      averageScore: roundToTwo(totalScore / department.riskCount),
      highestScore: roundToTwo(department.highestScore),
    }))
    .sort((first, second) => {
      const peakDifference = second.highestScore - first.highestScore;

      if (peakDifference !== 0) {
        return peakDifference;
      }

      const averageDifference = second.averageScore - first.averageScore;

      return averageDifference !== 0
        ? averageDifference
        : first.departmentName.localeCompare(second.departmentName);
    });

  const assetRiskMap = new Map<
    string,
    {
      assetId: string;
      assetName: string;
      departmentName: string;
      highestRiskRecordId: string;
      highestRiskScore: number;
      criticalHighRiskCount: number;
      riskCount: number;
    }
  >();

  for (const risk of currentAssetRisks) {
    const asset = risk.vulnerability.affectedAsset;
    const summary = assetRiskMap.get(asset.id) ?? {
      assetId: asset.id,
      assetName: asset.name,
      departmentName: asset.department.name,
      highestRiskRecordId: risk.id,
      highestRiskScore: risk.organizationalRiskScore,
      criticalHighRiskCount: 0,
      riskCount: 0,
    };

    summary.riskCount += 1;

    if (
      risk.organizationalRiskScore > summary.highestRiskScore ||
      (risk.organizationalRiskScore === summary.highestRiskScore &&
        risk.id.localeCompare(summary.highestRiskRecordId) < 0)
    ) {
      summary.highestRiskScore = risk.organizationalRiskScore;
      summary.highestRiskRecordId = risk.id;
    }

    if (highRiskLevels.has(risk.organizationalRiskLevel)) {
      summary.criticalHighRiskCount += 1;
    }

    assetRiskMap.set(asset.id, summary);
  }

  const highestRiskAssets = [...assetRiskMap.values()].sort(
    (first, second) => {
      const scoreDifference =
        second.highestRiskScore - first.highestRiskScore;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const elevatedRiskDifference =
        second.criticalHighRiskCount - first.criticalHighRiskCount;

      if (elevatedRiskDifference !== 0) {
        return elevatedRiskDifference;
      }

      const nameDifference = first.assetName.localeCompare(second.assetName);

      return nameDifference !== 0
        ? nameDifference
        : first.assetId.localeCompare(second.assetId);
    }
  );

  const highestRiskVulnerabilities = currentAssetRisks
    .filter((risk) =>
      activeVulnerabilityStatuses.has(risk.vulnerability.status)
    )
    .map((risk) => ({
      cvssScore: risk.vulnerability.cvssScore,
      identifier: risk.vulnerability.identifier,
      riskLevel: risk.organizationalRiskLevel,
      riskRecordId: risk.id,
      riskScore: risk.organizationalRiskScore,
      severity: risk.vulnerability.severity,
      title: risk.vulnerability.title,
      vulnerabilityId: risk.vulnerability.id,
    }))
    .sort((first, second) => {
      const riskDifference = second.riskScore - first.riskScore;

      if (riskDifference !== 0) {
        return riskDifference;
      }

      const cvssDifference = second.cvssScore - first.cvssScore;

      return cvssDifference !== 0
        ? cvssDifference
        : first.identifier.localeCompare(second.identifier);
    });

  return {
    metrics: {
      totalAssets: activeAssets.length,
      openVulnerabilities: activeVulnerabilities.length,
      criticalHighVulnerabilities: activeVulnerabilities.filter(
        (vulnerability) =>
          vulnerability.severity === VulnerabilitySeverity.CRITICAL ||
          vulnerability.severity === VulnerabilitySeverity.HIGH
      ).length,
      criticalRisks: currentRisks.filter(
        (risk) =>
          risk.organizationalRiskLevel === OrganizationalRiskLevel.CRITICAL
      ).length,
      openRemediation: inputs.remediationTasks.filter(
        isRemediationTaskActive
      ).length,
      overdueRemediation: inputs.remediationTasks.filter((task) =>
        isRemediationTaskOverdue(task, currentTime)
      ).length,
      internetFacingAssets: internetFacingAssetCount,
    },
    riskByDepartment,
    vulnerabilitiesBySeverity: [
      VulnerabilitySeverity.CRITICAL,
      VulnerabilitySeverity.HIGH,
      VulnerabilitySeverity.MEDIUM,
      VulnerabilitySeverity.LOW,
    ].map((severity) => ({
      severity,
      count: severityCounts.get(severity) ?? 0,
    })),
    remediationProgress: [
      { key: "active", label: "Open / In Progress", count: progressCounts.active },
      {
        key: "awaitingValidation",
        label: "Awaiting Validation",
        count: progressCounts.awaitingValidation,
      },
      { key: "resolved", label: "Resolved", count: progressCounts.resolved },
      {
        key: "acceptedRisk",
        label: "Accepted Risk",
        count: progressCounts.acceptedRisk,
      },
    ],
    exposureSummary: {
      internetFacing: internetFacingAssetCount,
      internal: activeAssets.length - internetFacingAssetCount,
      total: activeAssets.length,
      internetFacingPercentage:
        activeAssets.length === 0
          ? 0
          : Math.round((internetFacingAssetCount / activeAssets.length) * 100),
    },
    highestRiskAssets,
    highestRiskVulnerabilities,
    remediationWorkload: aggregateRemediationWorkload(
      inputs.remediationTasks,
      currentTime
    ),
  };
}

export type DashboardSummary = ReturnType<typeof buildDashboardSummary>;

export type DashboardRoleView = {
  metrics: readonly DashboardMetricKey[];
  sections: readonly DashboardSectionKey[];
};

const roleViews: Record<UserRoleValue, DashboardRoleView> = {
  [UserRole.EXECUTIVE]: {
    metrics: [
      "totalAssets",
      "openVulnerabilities",
      "criticalRisks",
      "openRemediation",
      "overdueRemediation",
    ],
    sections: [
      "riskByDepartment",
      "highestRiskAssets",
      "remediationProgress",
      "exposureSummary",
    ],
  },
  [UserRole.ANALYST]: {
    metrics: [
      "openVulnerabilities",
      "criticalHighVulnerabilities",
      "criticalRisks",
      "internetFacingAssets",
      "openRemediation",
      "overdueRemediation",
    ],
    sections: [
      "vulnerabilitiesBySeverity",
      "highestRiskVulnerabilities",
      "exposureSummary",
      "remediationProgress",
    ],
  },
  [UserRole.IT_ADMIN]: {
    metrics: [
      "totalAssets",
      "internetFacingAssets",
      "openRemediation",
      "overdueRemediation",
      "criticalRisks",
    ],
    sections: [
      "remediationProgress",
      "remediationWorkload",
      "highestRiskAssets",
      "exposureSummary",
    ],
  },
  [UserRole.SECURITY_MANAGER]: {
    metrics: [
      "totalAssets",
      "openVulnerabilities",
      "criticalRisks",
      "openRemediation",
      "overdueRemediation",
    ],
    sections: [
      "riskByDepartment",
      "vulnerabilitiesBySeverity",
      "remediationProgress",
      "highestRiskAssets",
      "exposureSummary",
    ],
  },
};

export function getDashboardRoleView(role: UserRoleValue) {
  return roleViews[role];
}
