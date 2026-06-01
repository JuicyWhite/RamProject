"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { NewProjectDialog } from "./new-project-dialog";
import type { ProjectStatus } from "@prisma/client";

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

interface Project {
  id: string;
  name: string;
  code: string | null;
  client: string | null;
  location: string | null;
  status: ProjectStatus;
  budget: string | number | null;
  _count: { wbsItems: number };
}

export function ProjectsClient({ projects }: { projects: Project[] }) {
  const [sort, setSort] = useState("updated");
  const [filter, setFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (filter !== "all") {
      list = list.filter((p) => p.status === filter.toUpperCase());
    }
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [projects, sort, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New Project
        </Button>
      </div>

      {/* Sort & Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm bg-background"
          >
            <option value="updated">Last Updated</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-border rounded px-2 py-1 text-sm bg-background"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-2">
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {filter !== "all" ? "Try a different filter." : "Create your first project to get started."}
            </p>
            {filter === "all" && (
              <div className="pt-2">
                <Button size="sm" onClick={() => setShowNew(true)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New Project
                </Button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full" aria-label="Projects list">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Client</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Location</th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tabular hidden lg:table-cell">Budget</th>
                <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tabular hidden lg:table-cell">Scope Items</th>
                <th scope="col" className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/projects/${project.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                      {project.name}
                    </Link>
                    {project.code && (
                      <span className="ml-2 text-2xs text-muted-foreground">{project.code}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">{project.client ?? "—"}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground hidden md:table-cell">{project.location ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant[project.status] as never}>{statusLabel[project.status]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular hidden lg:table-cell">
                    {project.budget ? formatCurrency(Number(project.budget)) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular text-muted-foreground hidden lg:table-cell">
                    {project._count.wbsItems}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/projects/${project.id}`} className="text-muted-foreground hover:text-foreground transition-colors" aria-label={`Open ${project.name}`}>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewProjectDialog open={showNew} onOpenChange={setShowNew} />
    </div>
  );
}
