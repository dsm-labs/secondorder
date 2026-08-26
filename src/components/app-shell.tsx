"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Assets", href: "/assets" },
  { label: "Vulnerabilities", href: "/vulnerabilities" },
  { label: "Risks", href: "/risks" },
  { label: "Remediation", href: "/remediation" },
  { label: "Reports", href: "/reports" }
];

export default function AppShell({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const currentPageTitle =
    navigationItems.find((item) =>
      item.href === "/"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label ??
    "SecondOrder";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-5 text-white md:w-64 md:border-b-0 md:border-r md:px-5 md:py-6">
          <div className="min-w-0">
            <p className="text-xl font-semibold">SecondOrder</p>
            <p className="mt-1 text-sm text-slate-400">Risk management</p>
          </div>

          <nav
            className="mt-5 flex flex-wrap gap-1 md:mt-10 md:block md:space-y-1"
            aria-label="Primary navigation"
          >
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-900 hover:text-white md:w-full ${
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
          <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Phase 1</p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  {currentPageTitle}
                </h1>
              </div>
              <p className="text-sm text-slate-500">SecondOrder</p>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
