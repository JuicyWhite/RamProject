import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { DiaryShell } from "@/components/diary/diary-shell";

export const metadata: Metadata = { title: "Daily Diary" };

export default async function DiaryPage({
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
      select: { id: true, name: true },
    }),
    db.dailyDiary.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
      include: { createdBy: { select: { name: true, email: true } } },
    }),
  ]);

  if (!project) notFound();

  const serializedEntries = entries.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
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
        <span className="text-foreground">Daily Diary</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Daily Diary</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log daily site progress, manpower, and challenges.
        </p>
      </div>

      <DiaryShell projectId={project.id} initialEntries={serializedEntries} />
    </div>
  );
}
