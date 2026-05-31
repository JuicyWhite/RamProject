import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "Project Settings" };

export default async function ProjectSettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const project = await db.project.findFirst({
    where: { id: params.projectId, orgId },
  });
  if (!project) notFound();

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          {project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      <div>
        <h1 className="text-lg font-semibold">Project Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Edit project metadata, scope, and financial parameters.
        </p>
      </div>

      <ProjectForm project={project} />
    </div>
  );
}
