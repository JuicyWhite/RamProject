import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check-email=1",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as { orgId?: string }).orgId = token.orgId as string;
        (session.user as { orgRole?: string }).orgRole = token.orgRole as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  providers: [],
};
