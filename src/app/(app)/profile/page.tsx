import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-6 max-w-lg space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account details.</p>
      </div>
      <ProfileForm
        userId={session.user.id}
        initialName={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </div>
  );
}
