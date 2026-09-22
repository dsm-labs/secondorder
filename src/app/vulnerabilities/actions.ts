"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Prisma,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  type VulnerabilitySeverity as VulnerabilitySeverityValue,
  type VulnerabilityStatus as VulnerabilityStatusValue,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export type VulnerabilityFormState = {
  error: string;
};

type VulnerabilityInput = {
  identifier: string;
  title: string;
  description: string | null;
  cvssScore: string;
  severity: VulnerabilitySeverityValue;
  affectedAssetId: string;
  detectionDate: Date;
  status: VulnerabilityStatusValue;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(formData: FormData, field: string) {
  const value = getText(formData, field);

  return value.length > 0 ? value : null;
}

function isSeverity(value: string): value is VulnerabilitySeverityValue {
  return Object.values(VulnerabilitySeverity).includes(
    value as VulnerabilitySeverityValue
  );
}

function isStatus(value: string): value is VulnerabilityStatusValue {
  return Object.values(VulnerabilityStatus).includes(
    value as VulnerabilityStatusValue
  );
}

function parseCvssScore(value: string) {
  if (!/^\d{1,2}(\.\d)?$/.test(value)) {
    return null;
  }

  const score = Number(value);

  if (!Number.isFinite(score) || score < 0 || score > 10) {
    return null;
  }

  return score.toFixed(1);
}

function parseDetectionDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function readVulnerabilityInput(
  formData: FormData
): Promise<VulnerabilityInput | VulnerabilityFormState> {
  const identifier = getText(formData, "identifier");
  const title = getText(formData, "title");
  const cvssScore = parseCvssScore(getText(formData, "cvssScore"));
  const severity = getText(formData, "severity");
  const affectedAssetId = getText(formData, "affectedAssetId");
  const detectionDate = parseDetectionDate(getText(formData, "detectionDate"));
  const status = getText(formData, "status");

  if (!identifier || !title || !affectedAssetId) {
    return {
      error: "Identifier, title, and affected asset are required.",
    };
  }

  if (!cvssScore) {
    return {
      error: "CVSS score must be a number from 0.0 through 10.0.",
    };
  }

  if (!isSeverity(severity)) {
    return {
      error: "Severity is not valid.",
    };
  }

  if (!detectionDate) {
    return {
      error: "Detection date must be a valid date.",
    };
  }

  if (!isStatus(status)) {
    return {
      error: "Status is not valid.",
    };
  }

  const affectedAsset = await prisma.asset.findUnique({
    where: { id: affectedAssetId },
  });

  if (!affectedAsset) {
    return {
      error: "Selected affected asset does not exist.",
    };
  }

  return {
    identifier,
    title,
    description: getOptionalText(formData, "description"),
    cvssScore,
    severity,
    affectedAssetId,
    detectionDate,
    status,
  };
}

export async function createVulnerability(
  _previousState: VulnerabilityFormState,
  formData: FormData
): Promise<VulnerabilityFormState> {
  await requireUser();
  const input = await readVulnerabilityInput(formData);

  if ("error" in input) {
    return input;
  }

  const duplicate = await prisma.vulnerability.findFirst({
    where: {
      identifier: input.identifier,
      affectedAssetId: input.affectedAssetId,
    },
  });

  if (duplicate) {
    return {
      error:
        "This vulnerability identifier is already linked to the selected asset.",
    };
  }

  let vulnerabilityId = "";

  try {
    const vulnerability = await prisma.vulnerability.create({
      data: input,
      select: { id: true },
    });

    vulnerabilityId = vulnerability.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error:
          "This vulnerability identifier is already linked to the selected asset.",
      };
    }

    throw error;
  }

  revalidatePath("/vulnerabilities");
  redirect(`/vulnerabilities/${vulnerabilityId}`);
}

export async function updateVulnerability(
  vulnerabilityId: string,
  _previousState: VulnerabilityFormState,
  formData: FormData
): Promise<VulnerabilityFormState> {
  await requireUser();
  const input = await readVulnerabilityInput(formData);

  if ("error" in input) {
    return input;
  }

  const duplicate = await prisma.vulnerability.findFirst({
    where: {
      identifier: input.identifier,
      affectedAssetId: input.affectedAssetId,
      NOT: { id: vulnerabilityId },
    },
  });

  if (duplicate) {
    return {
      error:
        "This vulnerability identifier is already linked to the selected asset.",
    };
  }

  try {
    await prisma.vulnerability.update({
      where: { id: vulnerabilityId },
      data: input,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error:
          "This vulnerability identifier is already linked to the selected asset.",
      };
    }

    throw error;
  }

  revalidatePath("/vulnerabilities");
  revalidatePath(`/vulnerabilities/${vulnerabilityId}`);
  redirect(`/vulnerabilities/${vulnerabilityId}`);
}
