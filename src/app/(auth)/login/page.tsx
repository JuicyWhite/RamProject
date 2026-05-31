import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; "check-email"?: string }>;
}) {
  const params = await searchParams;
  const checkEmail = !!params["check-email"];
  const callbackUrl = params.callbackUrl ?? "/";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in to Ascend</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Construction project management &amp; cost estimating
        </p>
      </div>

      {checkEmail ? (
        <div className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">Check your email</p>
          <p className="text-muted-foreground mt-0.5">
            We sent you a magic link. Click it to sign in — no password needed.
          </p>
        </div>
      ) : (
        <LoginForm callbackUrl={callbackUrl} />
      )}
    </div>
  );
}
