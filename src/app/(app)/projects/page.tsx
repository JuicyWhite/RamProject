import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectsClient } from "@/components/projects/projects-client";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return null;

  const projects = await db.project.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      client: true,
      location: true,
      status: true,
      budget: true,
      _count: { select: { wbsItems: true } },
    },
  });

  const serialized = projects.map((p) => ({
    ...p,
    budget: p.budget != null ? Number(p.budget) : null,
  }));

  return (
    <div className="p-6 max-w-6xl">
      <ProjectsClient projects={serialized} />
    </div>
  );
}
