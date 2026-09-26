"use server";

import { revalidatePath } from "next/cache";
import {
  AuditAction,
  AuditEntityType,
  Prisma,
  VulnerabilityStatus,
} from "@/generated/prisma/client";
import { auditDescriptions } from "@/lib/audit-descriptions";
import { requirePermission } from "@/lib/authorization";
import {
  MAX_IMPORT_FILE_BYTES,
  classifyVulnerabilityImport,
  countImportStatuses,
  getUtf8ByteLength,
  parseVulnerabilityImport,
  type ClassifiedImportFinding,
  type ImportStatusCounts,
  type VulnerabilityImportDocument,
} from "@/lib/imports/vulnerability-import";
import { Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export type ImportPreviewRow = Pick<
  ClassifiedImportFinding,
  | "rowNumber"
  | "identifier"
  | "title"
  | "cvssScore"
  | "severity"
  | "assetLocator"
  | "detectionDate"
  | "status"
  | "reason"
  | "matchedAsset"
>;

export type VulnerabilityImportPreviewState = {
  error: string;
  preview: {
    rawJson: string;
    source: string;
    scanDate: string;
    counts: ImportStatusCounts;
    rows: ImportPreviewRow[];
  } | null;
};

export type VulnerabilityImportConfirmationState = {
  error: string;
  result: {
    counts: ImportStatusCounts;
    imported: Array<{
      id: string;
      identifier: string;
      affectedAssetName: string;
    }>;
  } | null;
};

function toPreviewRows(findings: ClassifiedImportFinding[]) {
  return findings.map(
    ({
      rowNumber,
      identifier,
      title,
      cvssScore,
      severity,
      assetLocator,
      detectionDate,
      status,
      reason,
      matchedAsset,
    }) => ({
      rowNumber,
      identifier,
      title,
      cvssScore,
      severity,
      assetLocator,
      detectionDate,
      status,
      reason,
      matchedAsset,
    })
  );
}

async function readImportLookups(document: VulnerabilityImportDocument) {
  const identifiers = [
    ...new Set(
      document.findings.flatMap((finding) =>
        finding.data ? [finding.data.identifier] : []
      )
    ),
  ];

  return Promise.all([
    prisma.asset.findMany({
      select: { id: true, name: true, ipAddress: true },
    }),
    identifiers.length > 0
      ? prisma.vulnerability.findMany({
          where: { identifier: { in: identifiers } },
          select: { identifier: true, affectedAssetId: true },
        })
      : Promise.resolve([]),
  ]);
}

function readJsonFile(
  formData: FormData
): { file: File } | { error: string } {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a non-empty JSON file." } as const;
  }

  if (!file.name.toLocaleLowerCase("en-US").endsWith(".json")) {
    return { error: "The import file must use the .json extension." } as const;
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { error: "Import file must be 1 MB or smaller." } as const;
  }

  return { file } as const;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function previewVulnerabilityImport(
  _previousState: VulnerabilityImportPreviewState,
  formData: FormData
): Promise<VulnerabilityImportPreviewState> {
  await requirePermission(Permission.MANAGE_VULNERABILITIES);

  const fileResult = readJsonFile(formData);

  if ("error" in fileResult) {
    return { error: fileResult.error, preview: null };
  }

  const rawJson = await fileResult.file.text();
  const parsed = parseVulnerabilityImport(rawJson);

  if (!parsed.ok) {
    return { error: parsed.errors.join(" "), preview: null };
  }

  const [assets, existingVulnerabilities] = await readImportLookups(
    parsed.document
  );
  const findings = classifyVulnerabilityImport(
    parsed.document,
    assets,
    existingVulnerabilities
  );

  return {
    error: "",
    preview: {
      rawJson,
      source: parsed.document.source,
      scanDate: parsed.document.scanDate,
      counts: countImportStatuses(findings),
      rows: toPreviewRows(findings),
    },
  };
}

export async function confirmVulnerabilityImport(
  _previousState: VulnerabilityImportConfirmationState,
  formData: FormData
): Promise<VulnerabilityImportConfirmationState> {
  const user = await requirePermission(Permission.MANAGE_VULNERABILITIES);
  const rawJson = formData.get("payload");
  const confirmed = formData.get("confirmImport") === "on";

  if (!confirmed) {
    return {
      error: "Confirm that you want to import every finding marked Ready.",
      result: null,
    };
  }

  if (
    typeof rawJson !== "string" ||
    !rawJson ||
    getUtf8ByteLength(rawJson) > MAX_IMPORT_FILE_BYTES
  ) {
    return {
      error: "The preview payload is missing or exceeds the 1 MB limit.",
      result: null,
    };
  }

  const parsed = parseVulnerabilityImport(rawJson);

  if (!parsed.ok) {
    return {
      error: `The import is no longer valid: ${parsed.errors.join(" ")}`,
      result: null,
    };
  }

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const identifiers = [
          ...new Set(
            parsed.document.findings.flatMap((finding) =>
              finding.data ? [finding.data.identifier] : []
            )
          ),
        ];
        const [assets, existingVulnerabilities] = await Promise.all([
          transaction.asset.findMany({
            select: { id: true, name: true, ipAddress: true },
          }),
          identifiers.length > 0
            ? transaction.vulnerability.findMany({
                where: { identifier: { in: identifiers } },
                select: { identifier: true, affectedAssetId: true },
              })
            : Promise.resolve([]),
        ]);
        const findings = classifyVulnerabilityImport(
          parsed.document,
          assets,
          existingVulnerabilities
        );
        const readyFindings = findings.filter(
          (finding) => finding.status === "READY"
        );

        const created =
          readyFindings.length > 0
            ? await transaction.vulnerability.createManyAndReturn({
                data: readyFindings.map((finding) => ({
                  identifier: finding.data!.identifier,
                  title: finding.data!.title,
                  description: finding.data!.description,
                  cvssScore: finding.data!.cvssScore.toFixed(1),
                  severity: finding.data!.severity,
                  affectedAssetId: finding.matchedAsset!.id,
                  detectionDate: new Date(finding.data!.detectionDate),
                  status: VulnerabilityStatus.OPEN,
                })),
                select: { id: true, identifier: true, affectedAssetId: true },
              })
            : [];

        if (created.length > 0) {
          await transaction.auditEvent.createMany({
            data: created.map((vulnerability) => ({
              userId: user.id,
              action: AuditAction.CREATE,
              entityType: AuditEntityType.VULNERABILITY,
              entityId: vulnerability.id,
              description: auditDescriptions.vulnerabilityImported(
                vulnerability.identifier,
                parsed.document.source
              ),
            })),
          });
        }

        const assetNames = new Map(assets.map((asset) => [asset.id, asset.name]));

        return {
          counts: countImportStatuses(findings),
          imported: created.map((vulnerability) => ({
            id: vulnerability.id,
            identifier: vulnerability.identifier,
            affectedAssetName:
              assetNames.get(vulnerability.affectedAssetId) ?? "Unknown asset",
          })),
        };
      },
      { maxWait: 5000, timeout: 30000 }
    );

    if (result.imported.length > 0) {
      revalidatePath("/");
      revalidatePath("/vulnerabilities");
      revalidatePath("/reports");
    }

    return { error: "", result };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error:
          "The database changed after preview. Review the file again before importing.",
        result: null,
      };
    }

    console.error("Vulnerability import failed without committing changes.");

    return {
      error: "The import could not be completed. No findings were imported.",
      result: null,
    };
  }
}
