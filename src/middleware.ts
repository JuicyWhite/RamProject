import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { decode } from "@auth/core/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) return NextResponse.next();

  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  const sessionToken = req.cookies.get(cookieName)?.value;
  let isLoggedIn = false;

  if (sessionToken) {
    try {
      const payload = await decode({
        token: sessionToken,
        secret: process.env.AUTH_SECRET!,
        salt: cookieName,
      });
      isLoggedIn = !!payload;
    } catch {
      isLoggedIn = false;
    }
  }

  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
