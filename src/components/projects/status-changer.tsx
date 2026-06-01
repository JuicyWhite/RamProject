"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProject } from "@/actions/projects";
import type { ProjectStatus } from "@prisma/client";

const statusLabel: Record<ProjectStatus, string> = {
  DRAFT: "Draft", ACTIVE: "Active", ON_HOLD: "On Hold",
  COMPLETED: "Completed", ARCHIVED: "Archived",
};

const statusColors: Record<ProjectStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  ON_HOLD: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function StatusChanger({ projectId, currentStatus }: { projectId: string; currentStatus: ProjectStatus }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: ProjectStatus) {
    if (newStatus === status) return;
    setSaving(true);
    try {
      await updateProject(projectId, { status: newStatus });
      setStatus(newStatus);
      toast.success(`Status changed to ${statusLabel[newStatus]}.`);
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value as ProjectStatus)}
        disabled={saving}
        className={`appearance-none cursor-pointer rounded-full px-3 py-1 text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-primary ${statusColors[status]}`}
      >
        {(Object.keys(statusLabel) as ProjectStatus[]).map((s) => (
          <option key={s} value={s}>{statusLabel[s]}</option>
        ))}
      </select>
    </div>
  );
}
