import type { Metadata } from "next";
import AppShell from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecondOrder",
  description: "Enterprise cyber risk and vulnerability management platform"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <AppShell currentUser={currentUser}>{children}</AppShell>
      </body>
    </html>
  );
}
