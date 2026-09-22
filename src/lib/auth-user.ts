import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const id = session?.user?.id;

  if (!id) {
    return null;
  }

  // Re-read identity so future authorization never relies on a stale JWT role.
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
