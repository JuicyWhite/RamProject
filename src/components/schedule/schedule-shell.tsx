"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createTask, updateTaskStatus, deleteTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar } from "lucide-react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "OVERDUE";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee: string | null;
  dueDate: string | null;
  status: TaskStatus;
}

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "OVERDUE"];
const statusLabel: Record<TaskStatus, string> = {
  TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done", OVERDUE: "Overdue",
};

export function ScheduleShell({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignee: "", dueDate: "" });

  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, OVERDUE: 0 };
  tasks.forEach((t) => counts[t.status]++);

  async function handleCreate() {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const task = await createTask(projectId, {
        title: form.title, description: form.description || null,
        assignee: form.assignee || null, dueDate: form.dueDate || null,
      });
      setTasks((p) => [...p, JSON.parse(JSON.stringify(task, (_, v) => v instanceof Date ? v.toISOString() : v))]);
      setForm({ title: "", description: "", assignee: "", dueDate: "" });
      setShowForm(false);
      toast.success("Task added.");
    } catch { toast.error("Failed."); }
    finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: TaskStatus) {
    try {
      await updateTaskStatus(projectId, id, status);
      setTasks((p) => p.map((t) => t.id === id ? { ...t, status } : t));
    } catch { toast.error("Failed."); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(projectId, id);
      setTasks((p) => p.filter((t) => t.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Failed."); }
  }

  const grouped = statusOptions.map((s) => ({ status: s, tasks: tasks.filter((t) => t.status === s) }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statusOptions.map((s) => (
          <div key={s} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{statusLabel[s]}</p>
            <p className="text-xl font-semibold tabular">{counts[s]}</p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Task</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="ttitle">Title <span className="text-destructive">*</span></Label>
              <Input id="ttitle" placeholder="Task name" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tassign">Assignee</Label>
              <Input id="tassign" placeholder="Person responsible" value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tdue">Due Date</Label>
              <Input id="tdue" type="date" value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="tdesc">Description</Label>
              <Textarea id="tdesc" rows={2} placeholder="Optional details" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Add Task"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No tasks yet. Add your first task to track project schedule.
        </div>
      )}

      <div className="space-y-4">
        {grouped.filter((g) => g.tasks.length > 0).map(({ status, tasks: groupTasks }) => (
          <div key={status} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{statusLabel[status]}</p>
            <div className="space-y-2">
              {groupTasks.map((task) => (
                <div key={task.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {task.assignee && <span className="text-xs text-muted-foreground">👤 {task.assignee}</span>}
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            📅 {new Date(task.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatus(task.id, e.target.value as TaskStatus)}
                        className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${statusColors[task.status]}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{statusLabel[s]}</option>
                        ))}
                      </select>
                      <button onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
