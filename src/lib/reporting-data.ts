import "server-only";
import type { ReportInputs } from "@/lib/reports";
import prisma from "@/lib/prisma";

export async function loadSecurityReportingData(): Promise<ReportInputs> {
  const [assets, vulnerabilities, risks, remediationTasks] = await Promise.all([
    prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        internetExposure: true,
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.vulnerability.findMany({
      select: {
        id: true,
        identifier: true,
        title: true,
        cvssScore: true,
        severity: true,
        status: true,
        affectedAsset: { select: { id: true, name: true } },
      },
    }),
    prisma.riskRecord.findMany({
      select: {
        id: true,
        organizationalRiskLevel: true,
        organizationalRiskScore: true,
        status: true,
        vulnerability: {
          select: {
            id: true,
            identifier: true,
            title: true,
            cvssScore: true,
            severity: true,
            status: true,
            affectedAsset: {
              select: {
                id: true,
                name: true,
                status: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.remediationTask.findMany({
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
        relatedAsset: { select: { id: true, name: true } },
        relatedVulnerability: {
          select: {
            id: true,
            identifier: true,
            title: true,
            cvssScore: true,
            severity: true,
            riskRecord: {
              select: {
                id: true,
                organizationalRiskLevel: true,
                organizationalRiskScore: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    assets,
    vulnerabilities: vulnerabilities.map((vulnerability) => ({
      ...vulnerability,
      cvssScore: Number(vulnerability.cvssScore.toString()),
    })),
    risks: risks.map((risk) => ({
      ...risk,
      organizationalRiskScore: Number(
        risk.organizationalRiskScore.toString()
      ),
      vulnerability: {
        ...risk.vulnerability,
        cvssScore: Number(risk.vulnerability.cvssScore.toString()),
      },
    })),
    remediationTasks: remediationTasks.map((task) => ({
      ...task,
      relatedVulnerability: {
        ...task.relatedVulnerability,
        cvssScore: Number(task.relatedVulnerability.cvssScore.toString()),
        riskRecord: task.relatedVulnerability.riskRecord
          ? {
              ...task.relatedVulnerability.riskRecord,
              organizationalRiskScore: Number(
                task.relatedVulnerability.riskRecord.organizationalRiskScore.toString()
              ),
            }
          : null,
      },
    })),
  };
}
