import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      // Dummy fallback so Auth.js passes its "server required" check in dev.
      // The custom sendVerificationRequest below handles actual delivery.
      server: process.env.EMAIL_SERVER || "smtp://0.0.0.0:0",
      from: process.env.EMAIL_FROM || "Ascend <noreply@localhost>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (!process.env.BREVO_API_KEY) {
          console.log(`\n[auth] Magic sign-in link for ${email}:\n  ${url}\n`);
          return;
        }
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "AscendyX", email: "info.ascendyx@gmail.com" },
            to: [{ email }],
            subject: "Sign in to Ascend",
            htmlContent: `<p>Click to sign in to Ascend:</p><p><a href="${url}">${url}</a></p>`,
            textContent: `Sign in with this link:\n${url}`,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Brevo API error ${res.status}: ${body}`);
        }
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.sub = dbUser.id;

          const membership = await db.orgMembership.findFirst({
            where: { userId: dbUser.id },
            select: { orgId: true, role: true },
            orderBy: { joinedAt: "asc" },
          });

          if (membership) {
            token.orgId = membership.orgId;
            token.orgRole = membership.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as { orgId?: string }).orgId = token.orgId as string;
        (session.user as { orgRole?: string }).orgRole = token.orgRole as string;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;

      // Always resolve the DB user by email — user.id from the callback
      // may be a pre-assigned temporary value when using JWT + email provider.
      const dbUser = await db.user.findUnique({ where: { email: user.email } });
      if (!dbUser) {
        // User not persisted yet (Phase 1 of magic-link flow). Allow the
        // send-verification step; org will be created on Phase 2 (verify).
        return true;
      }

      const existingMembership = await db.orgMembership.findFirst({
        where: { userId: dbUser.id },
      });

      if (!existingMembership) {
        const slug = dbUser.email!
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .slice(0, 32);

        const uniqueSlug = `${slug}-${dbUser.id.slice(-6)}`;

        const org = await db.organization.create({
          data: {
            name:
              user.name ||
              user.email.split("@")[0].replace(/[^a-zA-Z0-9 ]/g, " "),
            slug: uniqueSlug,
          },
        });

        await db.orgMembership.create({
          data: {
            userId: dbUser.id,
            orgId: org.id,
            role: "OWNER",
          },
        });
      }

      return true;
    },
  },
});
