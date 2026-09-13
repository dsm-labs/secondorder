import prisma from "@/lib/prisma";

export async function getRemediationFormOptions() {
  const [vulnerabilities, users] = await Promise.all([
    prisma.vulnerability.findMany({
      orderBy: [{ identifier: "asc" }, { title: "asc" }],
      select: {
        id: true,
        identifier: true,
        title: true,
        affectedAsset: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return { vulnerabilities, users };
}
