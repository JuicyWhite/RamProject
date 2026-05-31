import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EstimateShell } from "@/components/estimate/estimate-shell";

export const metadata: Metadata = { title: "Estimate" };

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, rateItems] = await Promise.all([
    db.project.findFirst({
      where: { id: projectId, orgId },
      include: { rateOverrides: true },
    }),
    db.rateItem.findMany({
      where: { orgId, isActive: true },
      orderBy: [{ category: "asc" }, { description: "asc" }],
    }),
  ]);

  if (!project) notFound();

  const wbsItems = await db.wbsItem.findMany({
    where: { projectId: project.id },
    include: {
      variables: true,
      lineItems: { include: { rateItem: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Serialize Prisma Decimal fields to numbers before passing to client components
  const serializedProject = {
    ...project,
    budget: project.budget != null ? Number(project.budget) : null,
    contractAmount: project.contractAmount != null ? Number(project.contractAmount) : null,
    overheadPct: Number(project.overheadPct),
    profitPct: Number(project.profitPct),
    vatPct: Number(project.vatPct),
    rateOverrides: project.rateOverrides.map((ro) => ({
      ...ro,
      unitRate: Number(ro.unitRate),
    })),
  };

  const serializedWbsItems = wbsItems.map((item) => ({
    ...item,
    quantity: item.quantity != null ? Number(item.quantity) : null,
    variables: item.variables.map((v) => ({ ...v, value: Number(v.value) })),
    lineItems: item.lineItems.map((li) => ({
      ...li,
      quantity: li.quantity != null ? Number(li.quantity) : null,
      rateItem: { ...li.rateItem, unitRate: Number(li.rateItem.unitRate) },
    })),
  }));

  const serializedRateItems = rateItems.map((ri) => ({
    ...ri,
    unitRate: Number(ri.unitRate),
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top breadcrumb */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border text-sm text-muted-foreground bg-background shrink-0">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Estimate</span>
      </div>

      <EstimateShell
        project={serializedProject as unknown as typeof project & { rateOverrides: { rateItemId: string; unitRate: number }[] }}
        initialWbsItems={serializedWbsItems as unknown as typeof wbsItems}
        rateItems={serializedRateItems as unknown as typeof rateItems}
      />
    </div>
  );
}
