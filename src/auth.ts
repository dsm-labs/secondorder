import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { AuditAction, AuditEntityType } from "@/generated/prisma/client";
import { auditDescriptions } from "@/lib/audit-descriptions";
import { recordAuditEvent } from "@/lib/audit";
import prisma from "@/lib/prisma";

export const { auth, handlers } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password = credentials.password;

        if (
          !email ||
          email.length > 320 ||
          typeof password !== "string" ||
          !password ||
          password.length > 1024
        ) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
          },
        });

        if (!user?.passwordHash || !(await compare(password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await recordAuditEvent({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: AuditEntityType.USER,
        entityId: user.id,
        description: auditDescriptions.signedIn(),
      });
    },
    async signOut(message) {
      if (!("token" in message) || typeof message.token?.id !== "string") {
        return;
      }

      await recordAuditEvent({
        userId: message.token.id,
        action: AuditAction.LOGOUT,
        entityType: AuditEntityType.USER,
        entityId: message.token.id,
        description: auditDescriptions.signedOut(),
      });
    },
  },
});
