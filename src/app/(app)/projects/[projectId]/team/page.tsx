import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { TeamShell } from "@/components/team/team-shell";

export const metadata: Metadata = { title: "Project Team" };

export default async function TeamPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, members] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.projectTeamMember.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    email: m.email,
    phone: m.phone,
    company: m.company,
    isActive: m.isActive,
  }));

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Project Team</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Project Team</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage the team members assigned to this project.</p>
      </div>
      <TeamShell projectId={project.id} initialMembers={serialized} />
    </div>
  );
}
