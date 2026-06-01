import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { SafetyShell } from "@/components/safety/safety-shell";

export const metadata: Metadata = { title: "Safety Incidents" };

export default async function SafetyPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, incidents] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.safetyIncident.findMany({
      where: { projectId, project: { orgId } },
      orderBy: [{ status: "asc" }, { incidentDate: "desc" }],
    }),
  ]);

  if (!project) notFound();

  const serialized = incidents.map((i) =>
    JSON.parse(JSON.stringify(i, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Safety Incidents</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Safety Incidents</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log and track safety incidents on site.</p>
      </div>
      <SafetyShell projectId={project.id} initialIncidents={serialized} />
    </div>
  );
}
