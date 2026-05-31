import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Projects" };

const statusVariant: Record<ProjectStatus, string> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ON_HOLD: "on-hold",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

const statusLabel: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export default async function ProjectsPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return null;

  const projects = await db.project.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { wbsItems: true } } },
  });

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/projects/new">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New Project
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        {projects.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-2">
            <p className="text-sm font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first project to start estimating.
            </p>
            <div className="pt-2">
              <Button asChild size="sm">
                <Link href="/projects/new">
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New Project
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <table className="w-full" aria-label="Projects list">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Project
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Client
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Location
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tabular hidden lg:table-cell">
                  Budget
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tabular hidden lg:table-cell">
                  Scope Items
                </th>
                <th scope="col" className="w-8" />
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium text-sm hover:text-primary transition-colors"
                    >
                      {project.name}
                    </Link>
                    {project.code && (
                      <span className="ml-2 text-2xs text-muted-foreground">{project.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
                    {project.client ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground hidden md:table-cell">
                    {project.location ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant[project.status] as never}>
                      {statusLabel[project.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular hidden lg:table-cell">
                    {project.budget
                      ? formatCurrency(Number(project.budget))
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular text-muted-foreground hidden lg:table-cell">
                    {project._count.wbsItems}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Open ${project.name}`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
