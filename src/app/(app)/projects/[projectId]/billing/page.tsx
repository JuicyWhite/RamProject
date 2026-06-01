import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { BillingShell } from "@/components/billing/billing-shell";

export const metadata: Metadata = { title: "Progress Billing" };

export default async function BillingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, statements] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.billingStatement.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = statements.map((s) => ({
    id: s.id,
    number: s.number,
    date: s.date.toISOString(),
    periodStart: s.periodStart ? s.periodStart.toISOString() : null,
    periodEnd: s.periodEnd ? s.periodEnd.toISOString() : null,
    amount: Number(s.amount),
    paidAmount: Number(s.paidAmount),
    status: s.status,
    notes: s.notes,
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
        <span className="text-foreground">Progress Billing</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Progress Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track billing statements, payment status, and outstanding balances.
        </p>
      </div>
      <BillingShell projectId={project.id} initialStatements={serialized} />
    </div>
  );
}
