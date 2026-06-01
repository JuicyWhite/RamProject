import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { FinancialShell } from "@/components/financial/financial-shell";

export const metadata: Metadata = { title: "Financial Tracker" };

export default async function FinancialPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, entries] = await Promise.all([
    db.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true, name: true, contractAmount: true },
    }),
    db.financialEntry.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = {
    id: project.id,
    name: project.name,
    contractAmount: project.contractAmount != null ? Number(project.contractAmount) : null,
  };

  const serializedEntries = entries.map((e) => ({
    ...e,
    amount: Number(e.amount),
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Financial Tracker</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Financial Tracker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track contract additions and subtractions against the contract amount.
        </p>
      </div>

      <FinancialShell project={serialized} initialEntries={serializedEntries} />
    </div>
  );
}
