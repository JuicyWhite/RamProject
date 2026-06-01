import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { TimesheetShell } from "@/components/timesheet/timesheet-shell";

export const metadata: Metadata = { title: "Timesheet & Payroll" };

export default async function TimesheetPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, workers, entries] = await Promise.all([
    db.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true, name: true },
    }),
    db.worker.findMany({
      where: { projectId, project: { orgId }, isActive: true },
      select: { id: true, name: true, role: true, dailyRate: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    db.timesheetEntry.findMany({
      where: { projectId, project: { orgId } },
      include: { worker: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!project) notFound();

  const serializedWorkers = workers.map((w) => ({
    id: w.id,
    name: w.name,
    role: w.role,
    dailyRate: w.dailyRate !== null ? Number(w.dailyRate) : null,
    isActive: w.isActive,
  }));

  const serializedEntries = entries.map((e) => ({
    id: e.id,
    workerId: e.workerId,
    workerName: e.worker.name,
    date: e.date.toISOString(),
    hoursWorked: Number(e.hoursWorked),
    overtime: Number(e.overtime),
    notes: e.notes ?? null,
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
        <span className="text-foreground">Timesheet &amp; Payroll</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Timesheet &amp; Payroll</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log daily hours and compute worker payroll.
        </p>
      </div>

      <TimesheetShell
        projectId={project.id}
        workers={serializedWorkers}
        initialEntries={serializedEntries}
      />
    </div>
  );
}
