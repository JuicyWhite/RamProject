import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ScheduleShell } from "@/components/schedule/schedule-shell";

export const metadata: Metadata = { title: "Project Schedule" };

export default async function SchedulePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, tasks] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.projectTask.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = tasks.map((t) =>
    JSON.parse(JSON.stringify(t, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Project Schedule</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Project Schedule</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage tasks and track project timeline.</p>
      </div>
      <ScheduleShell projectId={project.id} initialTasks={serialized} />
    </div>
  );
}
