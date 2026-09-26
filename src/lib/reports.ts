import {
  OrganizationalRiskLevel,
  RiskStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  type OrganizationalRiskLevel as OrganizationalRiskLevelValue,
  type UserRole as UserRoleValue,
} from "../generated/prisma/client";
import {
  buildDashboardSummary,
  type DashboardInputs,
  type DashboardMetricKey,
  type DashboardRemediationInput,
} from "./dashboard";
import {
  isRemediationTaskOverdue,
  rankCriticalUnresolvedTasks,
} from "./remediation";

export type ReportRemediationInput = DashboardRemediationInput & {
  relatedAsset: { id: string; name: string };
  relatedVulnerability: {
    id: string;
    identifier: string;
    title: string;
    cvssScore: number;
    severity: VulnerabilitySeverity;
    riskRecord: {
      id: string;
      organizationalRiskLevel: OrganizationalRiskLevel;
      organizationalRiskScore: number;
    } | null;
  };
};

export type ReportInputs = Omit<DashboardInputs, "remediationTasks"> & {
  remediationTasks: readonly ReportRemediationInput[];
};

export type ReportSectionKey =
  | "riskByDepartment"
  | "vulnerabilitiesBySeverity"
  | "riskLevelDistribution"
  | "highestRiskAssets"
  | "highestRiskVulnerabilities"
  | "exposureSummary"
  | "remediationProgress"
  | "remediationWorkload"
  | "criticalUnresolvedWork";

const inactiveRiskStatuses = new Set<RiskStatus>([
  RiskStatus.RESOLVED,
  RiskStatus.ACCEPTED_RISK,
]);

const activeVulnerabilityStatuses = new Set<VulnerabilityStatus>([
  VulnerabilityStatus.OPEN,
  VulnerabilityStatus.IN_REVIEW,
]);

const severityRank = {
  [VulnerabilitySeverity.LOW]: 1,
  [VulnerabilitySeverity.MEDIUM]: 2,
  [VulnerabilitySeverity.HIGH]: 3,
  [VulnerabilitySeverity.CRITICAL]: 4,
};

export function buildReportSummary(
  inputs: ReportInputs,
  currentTime = new Date()
) {
  const dashboardSummary = buildDashboardSummary(inputs, currentTime);
  const currentRisks = inputs.risks.filter(
    (risk) => !inactiveRiskStatuses.has(risk.status)
  );
  const riskLevelCounts = new Map<OrganizationalRiskLevelValue, number>(
    Object.values(OrganizationalRiskLevel).map((level) => [level, 0])
  );

  for (const risk of currentRisks) {
    riskLevelCounts.set(
      risk.organizationalRiskLevel,
      (riskLevelCounts.get(risk.organizationalRiskLevel) ?? 0) + 1
    );
  }

  const storedRiskByVulnerability = new Map(
    inputs.risks.map((risk) => [risk.vulnerability.id, risk])
  );
  const highestRiskVulnerabilities = inputs.vulnerabilities
    .filter((vulnerability) =>
      activeVulnerabilityStatuses.has(vulnerability.status)
    )
    .map((vulnerability) => {
      const risk = storedRiskByVulnerability.get(vulnerability.id);

      return {
        cvssScore: vulnerability.cvssScore,
        identifier: vulnerability.identifier,
        riskLevel: risk?.organizationalRiskLevel ?? null,
        riskRecordId: risk?.id ?? null,
        riskScore: risk?.organizationalRiskScore ?? null,
        severity: vulnerability.severity,
        title: vulnerability.title,
        vulnerabilityId: vulnerability.id,
      };
    })
    .sort((first, second) => {
      if (first.riskScore !== null && second.riskScore === null) {
        return -1;
      }

      if (first.riskScore === null && second.riskScore !== null) {
        return 1;
      }

      const riskDifference =
        (second.riskScore ?? -1) - (first.riskScore ?? -1);

      if (riskDifference !== 0) {
        return riskDifference;
      }

      const cvssDifference = second.cvssScore - first.cvssScore;

      if (cvssDifference !== 0) {
        return cvssDifference;
      }

      const severityDifference =
        severityRank[second.severity] - severityRank[first.severity];

      if (severityDifference !== 0) {
        return severityDifference;
      }

      const identifierDifference = first.identifier.localeCompare(
        second.identifier
      );

      return identifierDifference !== 0
        ? identifierDifference
        : first.vulnerabilityId.localeCompare(second.vulnerabilityId);
    });

  const criticalUnresolvedWork = rankCriticalUnresolvedTasks(
    inputs.remediationTasks
  ).map((task) => ({
    assignedUserName: task.assignedUser.name,
    cvssScore: task.relatedVulnerability.cvssScore,
    dueDate: task.dueDate,
    id: task.id,
    isOverdue: isRemediationTaskOverdue(task, currentTime),
    priority: task.priority,
    relatedAsset: task.relatedAsset,
    relatedVulnerability: {
      id: task.relatedVulnerability.id,
      identifier: task.relatedVulnerability.identifier,
      severity: task.relatedVulnerability.severity,
      title: task.relatedVulnerability.title,
    },
    riskRecord: task.relatedVulnerability.riskRecord,
    status: task.status,
    title: task.title,
  }));

  return {
    ...dashboardSummary,
    highestRiskVulnerabilities,
    riskLevelDistribution: [
      OrganizationalRiskLevel.CRITICAL,
      OrganizationalRiskLevel.HIGH,
      OrganizationalRiskLevel.MEDIUM,
      OrganizationalRiskLevel.LOW,
    ].map((level) => ({
      level,
      count: riskLevelCounts.get(level) ?? 0,
    })),
    criticalUnresolvedWork,
  };
}

export type ReportSummary = ReturnType<typeof buildReportSummary>;

export type ReportRoleView = {
  metrics: readonly DashboardMetricKey[];
  sections: readonly ReportSectionKey[];
};

const roleViews: Record<UserRoleValue, ReportRoleView> = {
  [UserRole.EXECUTIVE]: {
    metrics: [
      "totalAssets",
      "criticalRisks",
      "internetFacingAssets",
      "openRemediation",
      "overdueRemediation",
    ],
    sections: [
      "riskByDepartment",
      "riskLevelDistribution",
      "highestRiskAssets",
      "exposureSummary",
      "remediationProgress",
      "criticalUnresolvedWork",
    ],
  },
  [UserRole.ANALYST]: {
    metrics: [
      "openVulnerabilities",
      "criticalHighVulnerabilities",
      "criticalRisks",
      "internetFacingAssets",
      "overdueRemediation",
    ],
    sections: [
      "vulnerabilitiesBySeverity",
      "riskLevelDistribution",
      "highestRiskVulnerabilities",
      "riskByDepartment",
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
      "exposureSummary",
      "highestRiskAssets",
      "remediationProgress",
      "remediationWorkload",
      "criticalUnresolvedWork",
    ],
  },
  [UserRole.SECURITY_MANAGER]: {
    metrics: [
      "totalAssets",
      "openVulnerabilities",
      "criticalRisks",
      "internetFacingAssets",
      "openRemediation",
      "overdueRemediation",
    ],
    sections: [
      "riskByDepartment",
      "vulnerabilitiesBySeverity",
      "riskLevelDistribution",
      "highestRiskAssets",
      "highestRiskVulnerabilities",
      "exposureSummary",
      "remediationProgress",
      "remediationWorkload",
      "criticalUnresolvedWork",
    ],
  },
};

export function getReportRoleView(role: UserRoleValue) {
  return roleViews[role];
}
