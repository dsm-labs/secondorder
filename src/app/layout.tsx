import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecondOrder",
  description: "Enterprise cyber risk and vulnerability management platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
