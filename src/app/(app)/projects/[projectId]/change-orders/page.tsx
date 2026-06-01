import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ChangeOrdersShell } from "@/components/change-orders/change-orders-shell";

export const metadata: Metadata = { title: "Change Orders" };

export default async function ChangeOrdersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, orders] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.changeOrder.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { submittedDate: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = orders.map((o) => ({
    id: o.id,
    number: o.number,
    title: o.title,
    description: o.description,
    requestedBy: o.requestedBy,
    submittedDate: o.submittedDate.toISOString(),
    approvedDate: o.approvedDate ? o.approvedDate.toISOString() : null,
    amount: Number(o.amount),
    status: o.status,
    notes: o.notes,
  }));

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Change Orders</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Change Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track formal change orders, approval status, and contract impact.
        </p>
      </div>
      <ChangeOrdersShell projectId={project.id} initialOrders={serialized} />
    </div>
  );
}
