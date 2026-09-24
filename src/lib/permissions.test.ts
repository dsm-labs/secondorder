import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UserRole } from "../generated/prisma/client";
import { hasPermission, Permission } from "./permissions";

const expectedPermissions = {
  [UserRole.ANALYST]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.MANAGE_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.ASSESS_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.IT_ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.MANAGE_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.SECURITY_MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ASSETS,
    Permission.VIEW_VULNERABILITIES,
    Permission.MANAGE_VULNERABILITIES,
    Permission.VIEW_RISKS,
    Permission.ASSESS_RISKS,
    Permission.VIEW_REMEDIATION,
    Permission.MANAGE_REMEDIATION,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.EXECUTIVE]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_RISKS,
    Permission.VIEW_REPORTS,
  ],
} satisfies Record<UserRole, Permission[]>;

describe("role-based permissions", () => {
  for (const role of Object.values(UserRole)) {
    it(`${role} has exactly its expected capabilities`, () => {
      const allowedPermissions: readonly Permission[] = expectedPermissions[role];

      for (const permission of Object.values(Permission)) {
        assert.equal(
          hasPermission(role, permission),
          allowedPermissions.includes(permission),
          `${role} ${permission}`
        );
      }
    });
  }

  it("enforces the required management boundaries", () => {
    assert.equal(hasPermission(UserRole.ANALYST, Permission.MANAGE_VULNERABILITIES), true);
    assert.equal(hasPermission(UserRole.ANALYST, Permission.ASSESS_RISKS), true);
    assert.equal(hasPermission(UserRole.ANALYST, Permission.MANAGE_ASSETS), false);
    assert.equal(hasPermission(UserRole.ANALYST, Permission.MANAGE_REMEDIATION), false);

    assert.equal(hasPermission(UserRole.IT_ADMIN, Permission.MANAGE_ASSETS), true);
    assert.equal(hasPermission(UserRole.IT_ADMIN, Permission.MANAGE_REMEDIATION), true);
    assert.equal(hasPermission(UserRole.IT_ADMIN, Permission.MANAGE_VULNERABILITIES), false);
    assert.equal(hasPermission(UserRole.IT_ADMIN, Permission.ASSESS_RISKS), false);

    assert.equal(hasPermission(UserRole.SECURITY_MANAGER, Permission.MANAGE_ASSETS), false);
    assert.equal(hasPermission(UserRole.SECURITY_MANAGER, Permission.MANAGE_VULNERABILITIES), true);
    assert.equal(hasPermission(UserRole.SECURITY_MANAGER, Permission.ASSESS_RISKS), true);
    assert.equal(hasPermission(UserRole.SECURITY_MANAGER, Permission.MANAGE_REMEDIATION), true);

    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.VIEW_RISKS), true);
    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.VIEW_REPORTS), true);
    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.MANAGE_ASSETS), false);
    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.MANAGE_VULNERABILITIES), false);
    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.ASSESS_RISKS), false);
    assert.equal(hasPermission(UserRole.EXECUTIVE, Permission.MANAGE_REMEDIATION), false);
  });
});
