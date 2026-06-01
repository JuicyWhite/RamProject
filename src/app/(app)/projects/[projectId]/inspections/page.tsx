import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { InspectionsShell } from "@/components/inspections/inspections-shell";

export const metadata: Metadata = { title: "Inspections & Issues" };

export default async function InspectionsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, inspections, issues] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.inspection.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
    }),
    db.projectIssue.findMany({
      where: { projectId, project: { orgId } },
      orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!project) notFound();

  const serialize = (obj: Record<string, unknown>) =>
    JSON.parse(JSON.stringify(obj, (_, v) =>
      v instanceof Date ? v.toISOString() : v
    ));

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Inspections & Issues</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Inspections & Issues</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log QC inspections and track open issues to resolution.
        </p>
      </div>

      <InspectionsShell
        projectId={project.id}
        initialInspections={inspections.map(serialize)}
        initialIssues={issues.map(serialize)}
      />
    </div>
  );
}
