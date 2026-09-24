import type { UserRole } from "@/generated/prisma/client";

export const Permission = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_ASSETS: "VIEW_ASSETS",
  MANAGE_ASSETS: "MANAGE_ASSETS",
  VIEW_VULNERABILITIES: "VIEW_VULNERABILITIES",
  MANAGE_VULNERABILITIES: "MANAGE_VULNERABILITIES",
  VIEW_RISKS: "VIEW_RISKS",
  ASSESS_RISKS: "ASSESS_RISKS",
  VIEW_REMEDIATION: "VIEW_REMEDIATION",
  MANAGE_REMEDIATION: "MANAGE_REMEDIATION",
  VIEW_REPORTS: "VIEW_REPORTS",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const rolePermissions = {
  ANALYST: new Set<Permission>([
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.MANAGE_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.ASSESS_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.VIEW_REPORTS,
  ]),
  IT_ADMIN: new Set<Permission>([
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.MANAGE_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_REPORTS,
  ]),
  SECURITY_MANAGER: new Set<Permission>([
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.MANAGE_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.ASSESS_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_REPORTS,
  ]),
  EXECUTIVE: new Set<Permission>([
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_RISKS,
    Permission.VIEW_REPORTS,
  ]),
} satisfies Record<UserRole, ReadonlySet<Permission>>;

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].has(permission);
}
