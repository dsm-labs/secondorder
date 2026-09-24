import Link from "next/link";
import PageSection from "@/components/page-section";
import { requireUser } from "@/lib/auth-user";

export default async function UnauthorizedPage() {
  await requireUser();

  return (
    <PageSection
      title="Access denied"
      subtitle="You do not have permission to access this area."
    >
      <Link
        className="inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        href="/"
      >
        Back to Dashboard
      </Link>
    </PageSection>
  );
}
