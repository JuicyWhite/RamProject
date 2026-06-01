import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { PunchListShell } from "@/components/punch-list/punch-list-shell";

export const metadata: Metadata = { title: "Punch List" };

export default async function PunchListPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, items] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.punchListItem.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = items.map((i) =>
    JSON.parse(JSON.stringify(i, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

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
        <span className="text-foreground">Punch List</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Punch List</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track pre-completion deficiency items and close them out.
        </p>
      </div>
      <PunchListShell projectId={project.id} initialItems={serialized} />
    </div>
  );
}
