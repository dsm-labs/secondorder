"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AuditAction,
  AuditEntityType,
  AssetStatus,
  BusinessCriticality,
  type AssetStatus as AssetStatusValue,
  type BusinessCriticality as BusinessCriticalityValue,
} from "@/generated/prisma/client";
import { auditDescriptions } from "@/lib/audit-descriptions";
import { recordAuditEvent } from "@/lib/audit";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";

type AssetInput = {
  name: string;
  assetType: string;
  ipAddress: string | null;
  operatingSystem: string | null;
  departmentId: string;
  ownerId: string | null;
  businessCriticality: BusinessCriticalityValue;
  internetExposure: boolean;
  status: AssetStatusValue;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(formData: FormData, field: string) {
  const value = getText(formData, field);

  return value.length > 0 ? value : null;
}

function isBusinessCriticality(
  value: string
): value is BusinessCriticalityValue {
  return Object.values(BusinessCriticality).includes(
    value as BusinessCriticalityValue
  );
}

function isAssetStatus(value: string): value is AssetStatusValue {
  return Object.values(AssetStatus).includes(value as AssetStatusValue);
}

async function readAssetInput(formData: FormData): Promise<AssetInput> {
  const name = getText(formData, "name");
  const assetType = getText(formData, "assetType");
  const departmentId = getText(formData, "departmentId");
  const ownerId = getOptionalText(formData, "ownerId");
  const businessCriticality = getText(formData, "businessCriticality");
  const internetExposure = getText(formData, "internetExposure");
  const status = getText(formData, "status");

  if (!name || !assetType || !departmentId) {
    throw new Error("Name, asset type, and department are required.");
  }

  if (!isBusinessCriticality(businessCriticality)) {
    throw new Error("Business criticality is not valid.");
  }

  if (!isAssetStatus(status)) {
    throw new Error("Asset status is not valid.");
  }

  if (internetExposure !== "true" && internetExposure !== "false") {
    throw new Error("Internet exposure must be yes or no.");
  }

  const [department, owner] = await Promise.all([
    prisma.department.findUnique({ where: { id: departmentId } }),
    ownerId ? prisma.user.findUnique({ where: { id: ownerId } }) : null,
  ]);

  if (!department) {
    throw new Error("Selected department does not exist.");
  }

  if (ownerId && !owner) {
    throw new Error("Selected owner does not exist.");
  }

  return {
    name,
    assetType,
    ipAddress: getOptionalText(formData, "ipAddress"),
    operatingSystem: getOptionalText(formData, "operatingSystem"),
    departmentId,
    ownerId,
    businessCriticality,
    internetExposure: internetExposure === "true",
    status,
  };
}

export async function createAsset(formData: FormData) {
  const user = await requirePermission(Permission.MANAGE_ASSETS);
  const data = await readAssetInput(formData);

  const asset = await prisma.$transaction(async (transaction) => {
    const createdAsset = await transaction.asset.create({
      data,
      select: { id: true, name: true },
    });

    await recordAuditEvent(
      {
        userId: user.id,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.ASSET,
        entityId: createdAsset.id,
        description: auditDescriptions.assetCreated(createdAsset.name),
      },
      transaction
    );

    return createdAsset;
  });

  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(assetId: string, formData: FormData) {
  const user = await requirePermission(Permission.MANAGE_ASSETS);
  const data = await readAssetInput(formData);

  await prisma.$transaction(async (transaction) => {
    const asset = await transaction.asset.update({
      where: { id: assetId },
      data,
      select: { id: true, name: true },
    });

    await recordAuditEvent(
      {
        userId: user.id,
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.ASSET,
        entityId: asset.id,
        description: auditDescriptions.assetUpdated(asset.name),
      },
      transaction
    );
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function archiveAsset(assetId: string, formData: FormData) {
  const user = await requirePermission(Permission.MANAGE_ASSETS);
  const confirmed = formData.get("confirmArchive") === "on";

  if (!confirmed) {
    throw new Error("Please confirm before archiving this asset.");
  }

  await prisma.$transaction(async (transaction) => {
    const asset = await transaction.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.ARCHIVED },
      select: { id: true, name: true },
    });

    await recordAuditEvent(
      {
        userId: user.id,
        action: AuditAction.STATUS_CHANGE,
        entityType: AuditEntityType.ASSET,
        entityId: asset.id,
        description: auditDescriptions.assetArchived(asset.name),
      },
      transaction
    );
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}
