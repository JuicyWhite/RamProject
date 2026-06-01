import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { SiteReportsShell } from "@/components/site-reports/site-reports-shell";

export const metadata: Metadata = { title: "Site Reports" };

export default async function SiteReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, reports] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.siteReport.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = reports.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    weather: r.weather,
    temperature: r.temperature,
    manpower: r.manpower,
    equipment: r.equipment,
    workDone: r.workDone,
    materials: r.materials,
    visitors: r.visitors,
    issues: r.issues,
    notes: r.notes,
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
        <span className="text-foreground">Site Reports</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Site Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Daily site reports capturing weather, manpower, work done, and site conditions.
        </p>
      </div>
      <SiteReportsShell projectId={project.id} initialReports={serialized} />
    </div>
  );
}
