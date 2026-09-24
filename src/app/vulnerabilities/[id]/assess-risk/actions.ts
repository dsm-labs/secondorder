"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BusinessImpact,
  DataSensitivity,
  Prisma,
  RiskStatus,
  type BusinessImpact as BusinessImpactValue,
  type DataSensitivity as DataSensitivityValue,
  type RiskStatus as RiskStatusValue,
} from "@/generated/prisma/client";
import { calculateOrganizationalRisk } from "@/lib/risk-engine";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";

export type RiskAssessmentFormState = {
  error: string;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isDataSensitivity(value: string): value is DataSensitivityValue {
  return Object.values(DataSensitivity).includes(value as DataSensitivityValue);
}

function isBusinessImpact(value: string): value is BusinessImpactValue {
  return Object.values(BusinessImpact).includes(value as BusinessImpactValue);
}

function isRiskStatus(value: string): value is RiskStatusValue {
  return Object.values(RiskStatus).includes(value as RiskStatusValue);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function saveRiskAssessment(
  vulnerabilityId: string,
  _previousState: RiskAssessmentFormState,
  formData: FormData
): Promise<RiskAssessmentFormState> {
  await requirePermission(Permission.ASSESS_RISKS);
  const dataSensitivity = getText(formData, "dataSensitivity");
  const businessImpact = getText(formData, "businessImpact");
  const status = getText(formData, "status");

  if (!isDataSensitivity(dataSensitivity)) {
    return { error: "Data sensitivity is not valid." };
  }

  if (!isBusinessImpact(businessImpact)) {
    return { error: "Business impact is not valid." };
  }

  if (!isRiskStatus(status)) {
    return { error: "Risk status is not valid." };
  }

  const vulnerability = await prisma.vulnerability.findUnique({
    where: { id: vulnerabilityId },
    include: {
      affectedAsset: true,
    },
  });

  if (!vulnerability) {
    return { error: "Selected vulnerability does not exist." };
  }

  const cvssScore = Number(vulnerability.cvssScore.toString());

  if (!Number.isFinite(cvssScore) || cvssScore < 0 || cvssScore > 10) {
    return { error: "The vulnerability CVSS score is outside the expected range." };
  }

  const calculatedRisk = calculateOrganizationalRisk({
    cvssScore,
    assetCriticality: vulnerability.affectedAsset.businessCriticality,
    businessImpact,
    dataSensitivity,
    internetExposure: vulnerability.affectedAsset.internetExposure,
  });

  if (
    calculatedRisk.organizationalRiskScore < 0 ||
    calculatedRisk.organizationalRiskScore > 10
  ) {
    return { error: "Calculated risk score is outside the expected range." };
  }

  let riskRecordId = "";

  try {
    const riskRecord = await prisma.riskRecord.upsert({
      where: { vulnerabilityId },
      create: {
        vulnerabilityId,
        dataSensitivity,
        businessImpact,
        organizationalRiskScore: calculatedRisk.organizationalRiskScore,
        organizationalRiskLevel: calculatedRisk.organizationalRiskLevel,
        explanation: calculatedRisk.explanation,
        status,
      },
      update: {
        dataSensitivity,
        businessImpact,
        organizationalRiskScore: calculatedRisk.organizationalRiskScore,
        organizationalRiskLevel: calculatedRisk.organizationalRiskLevel,
        explanation: calculatedRisk.explanation,
        status,
      },
      select: { id: true },
    });

    riskRecordId = riskRecord.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error:
          "A risk record already exists for this vulnerability. Please reassess the existing record.",
      };
    }

    return { error: "Unable to save the risk assessment. Please try again." };
  }

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskRecordId}`);
  revalidatePath(`/vulnerabilities/${vulnerabilityId}`);
  redirect(`/risks/${riskRecordId}`);
}
