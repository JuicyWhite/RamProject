import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { SubcontractorsShell } from "@/components/subcontractors/subcontractors-shell";

export const metadata: Metadata = { title: "Subcontractors" };

export default async function SubcontractorsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, subs] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.subcontractor.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { company: "asc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = subs.map((s) =>
    JSON.parse(JSON.stringify(s, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Subcontractors</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Subcontractors</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage subcontractors, contract values, and payment tracking.</p>
      </div>
      <SubcontractorsShell projectId={project.id} initialSubs={serialized} />
    </div>
  );
}
