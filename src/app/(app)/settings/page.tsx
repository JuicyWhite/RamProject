import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: { members: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!org) notFound();

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Organization settings and team members
        </p>
      </div>

      <div className="rounded-md border border-border bg-surface divide-y divide-border">
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Organization
          </p>
          <p className="mt-1 text-sm font-medium">{org.name}</p>
          <p className="text-xs text-muted-foreground">Slug: {org.slug}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Members
          </p>
          <table className="w-full" aria-label="Team members">
            <thead>
              <tr className="text-left">
                <th className="text-xs font-medium text-muted-foreground pb-1.5">Name</th>
                <th className="text-xs font-medium text-muted-foreground pb-1.5">Email</th>
                <th className="text-xs font-medium text-muted-foreground pb-1.5">Role</th>
              </tr>
            </thead>
            <tbody>
              {org.members.map((m) => (
                <tr key={m.id} className="border-t border-border/40">
                  <td className="py-2 text-sm">{m.user.name ?? "—"}</td>
                  <td className="py-2 text-sm text-muted-foreground">{m.user.email}</td>
                  <td className="py-2">
                    <span className="text-2xs font-medium text-muted-foreground capitalize">
                      {m.role.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
