import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { NotesShell } from "@/components/notes/notes-shell";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, notes] = await Promise.all([
    db.project.findFirst({
      where: { id: projectId, orgId },
      select: { id: true, name: true },
    }),
    db.projectNote.findMany({
      where: { projectId, project: { orgId } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  if (!project) notFound();

  const serializedNotes = notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
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
        <span className="text-foreground">Notes</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Notes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Attach notes and important information to this project.
        </p>
      </div>

      <NotesShell projectId={project.id} initialNotes={serializedNotes} />
    </div>
  );
}
