import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orgId = (session.user as { orgId?: string }).orgId;
  const org = orgId
    ? await db.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar orgName={org?.name ?? "My Organization"} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
        />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
