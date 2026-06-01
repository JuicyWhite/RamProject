import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { DocumentsShell } from "@/components/documents/documents-shell";

export const metadata: Metadata = { title: "Document Control" };

export default async function DocumentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, documents] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.projectDocument.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { date: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = documents.map((d) =>
    JSON.parse(JSON.stringify(d, (_, v) => (v instanceof Date ? v.toISOString() : v)))
  );

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Document Control</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Document Control</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track Submittals, RFIs, and Transmittals.</p>
      </div>
      <DocumentsShell projectId={project.id} initialDocuments={serialized} />
    </div>
  );
}
