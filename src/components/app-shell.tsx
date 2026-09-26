"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import type { UserRole } from "@/generated/prisma/client";
import { hasPermission, Permission } from "@/lib/permissions";

const navigationItems = [
  { label: "Dashboard", href: "/", permission: Permission.VIEW_DASHBOARD },
  { label: "Assets", href: "/assets", permission: Permission.VIEW_ASSETS },
  {
    label: "Vulnerabilities",
    href: "/vulnerabilities",
    permission: Permission.VIEW_VULNERABILITIES,
  },
  { label: "Risks", href: "/risks", permission: Permission.VIEW_RISKS },
  {
    label: "Remediation",
    href: "/remediation",
    permission: Permission.VIEW_REMEDIATION,
  },
  { label: "Reports", href: "/reports", permission: Permission.VIEW_REPORTS },
  {
    label: "Audit Log",
    href: "/audit",
    permission: Permission.VIEW_AUDIT_LOG,
  },
];

export default function AppShell({
  children,
  currentUser,
}: Readonly<{
  children: React.ReactNode;
  currentUser: { name: string; role: UserRole } | null;
}>) {
  const pathname = usePathname();
  const [signOutPending, startSignOutTransition] = useTransition();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const roleLabel = currentUser?.role
    ? {
        ANALYST: "Analyst",
        IT_ADMIN: "IT Admin",
        SECURITY_MANAGER: "Security Manager",
        EXECUTIVE: "Executive",
      }[currentUser.role]
    : null;
  const visibleNavigationItems = currentUser
    ? navigationItems.filter((item) =>
        hasPermission(currentUser.role, item.permission)
      )
    : [];
  const currentPageTitle =
    pathname === "/unauthorized"
      ? "Access denied"
      : navigationItems.find((item) =>
          item.href === "/"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        )?.label ?? "SecondOrder";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-4 text-white md:w-64 md:border-b-0 md:border-r md:px-5 md:py-6">
          <div className="flex min-w-0 items-baseline justify-between gap-4 md:block">
            <p className="text-xl font-semibold">SecondOrder</p>
            <p className="text-xs text-slate-400 md:mt-1 md:text-sm">
              Cyber risk management
            </p>
          </div>

          <nav
            className="mt-4 flex gap-1 overflow-x-auto pb-1 md:mt-9 md:block md:space-y-1 md:overflow-visible md:pb-0"
            aria-label="Primary navigation"
          >
            {visibleNavigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`block shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-900 hover:text-white md:w-full ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-300"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-950 sm:text-xl">
                  {currentPageTitle}
                </h1>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-4 text-sm text-slate-600 sm:justify-end">
                {currentUser ? (
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">
                      {currentUser.name}
                    </span>
                    {roleLabel ? (
                      <span className="block text-xs text-slate-500">
                        {roleLabel}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {currentUser ? (
                  <button
                    className="shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60"
                    disabled={signOutPending}
                    onClick={() =>
                      startSignOutTransition(async () => {
                        await signOut({ redirectTo: "/login" });
                      })
                    }
                    type="button"
                  >
                    {signOutPending ? "Signing out..." : "Sign out"}
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 px-4 py-6 sm:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
