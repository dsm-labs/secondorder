import Link from "next/link";
import PageSection from "@/components/page-section";
import {
  AuditAction,
  AuditEntityType,
  Prisma,
  type AuditAction as AuditActionValue,
  type AuditEntityType as AuditEntityTypeValue,
} from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isAuditAction(value: string | undefined): value is AuditActionValue {
  return value
    ? Object.values(AuditAction).includes(value as AuditActionValue)
    : false;
}

function isAuditEntityType(
  value: string | undefined
): value is AuditEntityTypeValue {
  return value
    ? Object.values(AuditEntityType).includes(value as AuditEntityTypeValue)
    : false;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requirePermission(Permission.VIEW_AUDIT_LOG);

  const params = await searchParams;
  const query = (getSingleParam(params.q)?.trim() ?? "").slice(0, 160);
  const action = getSingleParam(params.action);
  const entityType = getSingleParam(params.entityType);
  const rawUserId = getSingleParam(params.userId) ?? "";
  const userId = UUID_PATTERN.test(rawUserId) ? rawUserId : "";
  const conditions: Prisma.AuditEventWhereInput[] = [];

  if (query) {
    const searchConditions: Prisma.AuditEventWhereInput[] = [
      { description: { contains: query, mode: "insensitive" } },
      { user: { name: { contains: query, mode: "insensitive" } } },
      { user: { email: { contains: query, mode: "insensitive" } } },
    ];

    if (UUID_PATTERN.test(query)) {
      searchConditions.push({ entityId: query });
    }

    conditions.push({ OR: searchConditions });
  }

  if (isAuditAction(action)) {
    conditions.push({ action });
  }

  if (isAuditEntityType(entityType)) {
    conditions.push({ entityType });
  }

  if (userId) {
    conditions.push({ userId });
  }

  const where: Prisma.AuditEventWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};
  const [events, users] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PageSection
      title="Audit Log"
      subtitle="Review successful authentication activity and authorized business changes."
    >
      <form className="grid gap-3 lg:grid-cols-4" method="get">
        <label className="lg:col-span-4">
          <span className="mb-1 block font-medium text-slate-700">Search</span>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            defaultValue={query}
            maxLength={160}
            name="q"
            placeholder="User, description, or exact entity ID"
            type="search"
          />
        </label>

        <label>
          <span className="mb-1 block font-medium text-slate-700">Action</span>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
            defaultValue={isAuditAction(action) ? action : ""}
            name="action"
          >
            <option value="">All actions</option>
            {Object.values(AuditAction).map((value) => (
              <option key={value} value={value}>
                {formatEnum(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block font-medium text-slate-700">Entity Type</span>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
            defaultValue={isAuditEntityType(entityType) ? entityType : ""}
            name="entityType"
          >
            <option value="">All entity types</option>
            {Object.values(AuditEntityType).map((value) => (
              <option key={value} value={value}>
                {formatEnum(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block font-medium text-slate-700">User</span>
          <select
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
            defaultValue={userId}
            name="userId"
          >
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button
            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
            type="submit"
          >
            Apply
          </button>
          <Link className="px-2 py-2 font-medium text-slate-700 hover:text-slate-950" href="/audit">
            Reset
          </Link>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-3 font-semibold">Timestamp</th>
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">Action</th>
              <th className="px-3 py-3 font-semibold">Entity Type</th>
              <th className="px-3 py-3 font-semibold">Entity ID</th>
              <th className="px-3 py-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr className="border-b border-slate-100 text-slate-700" key={event.id}>
                <td className="whitespace-nowrap px-3 py-3">{formatTimestamp(event.createdAt)}</td>
                <td className="px-3 py-3">
                  <span className="block font-medium text-slate-900">{event.user.name}</span>
                  <span className="block text-xs text-slate-500">{event.user.email}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">{formatEnum(event.action)}</td>
                <td className="whitespace-nowrap px-3 py-3">{formatEnum(event.entityType)}</td>
                <td className="px-3 py-3 font-mono text-xs text-slate-600">{event.entityId}</td>
                <td className="px-3 py-3">{event.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {events.length === 0 ? (
          <p className="py-10 text-center text-slate-500">No audit events match these filters.</p>
        ) : null}
      </div>
    </PageSection>
  );
}
