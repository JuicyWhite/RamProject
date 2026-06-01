import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { MeetingsShell } from "@/components/meetings/meetings-shell";

export const metadata: Metadata = { title: "Meeting Minutes" };

export default async function MeetingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, meetings] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.meeting.findMany({
      where: { projectId, project: { orgId } },
      include: { actionItems: { orderBy: { isCompleted: "asc" } } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = meetings.map((m) =>
    JSON.parse(JSON.stringify(m, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

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
        <span className="text-foreground">Meeting Minutes</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Meeting Minutes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log project meetings, decisions, and action items.
        </p>
      </div>
      <MeetingsShell projectId={project.id} initialMeetings={serialized} />
    </div>
  );
}
