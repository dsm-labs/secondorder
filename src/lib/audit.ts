import "server-only";
import {
  type AuditAction,
  type AuditEntityType,
  Prisma,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

type AuditEventInput = {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  description: string;
};

export async function recordAuditEvent(
  input: AuditEventInput,
  client: Prisma.TransactionClient = prisma
) {
  await client.auditEvent.create({
    data: input,
    select: { id: true },
  });
}
