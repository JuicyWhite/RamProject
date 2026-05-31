import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ArrowRight, FolderOpen, TrendingUp, AlertCircle } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return null;

  const projects = await db.project.findMany({
    where: { orgId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      code: true,
      client: true,
      status: true,
      budget: true,
      _count: { select: { wbsItems: true } },
    },
  });

  const statusCount = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const totalBudget = projects.reduce(
    (sum, p) => sum + (p.budget ? Number(p.budget) : 0),
    0
  );

  const statusMap: Record<ProjectStatus, string> = {
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

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of your active projects
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Projects",
            value: projects.length,
            icon: FolderOpen,
          },
          {
            label: "Active",
            value: statusCount["ACTIVE"] ?? 0,
            icon: TrendingUp,
          },
          {
            label: "On Hold",
            value: statusCount["ON_HOLD"] ?? 0,
            icon: AlertCircle,
          },
          {
            label: "Total Budget",
            value: formatCurrency(totalBudget, { compact: true }),
            icon: TrendingUp,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-md border border-border bg-surface p-4 space-y-2"
          >
            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            <p className="text-xl font-semibold tabular leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="rounded-md border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-semibold">Recent Projects</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No projects yet.{" "}
            <Link href="/projects/new" className="text-primary hover:underline">
              Create your first project
            </Link>
          </div>
        ) : (
          <table className="w-full" aria-label="Recent projects">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Client
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground tabular hidden md:table-cell">
                  Budget
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">
                  Items
                </th>
                <th className="w-8" />
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
                      <p className="text-2xs text-muted-foreground mt-0.5">
                        {project.code}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
                    {project.client ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusMap[project.status] as never}>
                      {statusLabel[project.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular hidden md:table-cell">
                    {project.budget
                      ? formatCurrency(Number(project.budget))
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular text-muted-foreground hidden md:table-cell">
                    {project._count.wbsItems}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-muted-foreground hover:text-foreground"
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

      {/* Status summary pills */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(statusCount) as [ProjectStatus, number][]).map(
            ([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs"
              >
                <span className="font-medium">{count}</span>
                <span className="text-muted-foreground">{statusLabel[status]}</span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
