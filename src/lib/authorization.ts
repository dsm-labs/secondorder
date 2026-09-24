import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-user";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!hasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}
