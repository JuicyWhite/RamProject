"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createPunchItem, updatePunchStatus, deletePunchItem } from "@/actions/punch-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ClipboardList } from "lucide-react";

type PunchStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
type PunchPriority = "HIGH" | "MEDIUM" | "LOW";

interface PunchItem {
  id: string;
  description: string;
  location: string | null;
  assignee: string | null;
  dueDate: string | null;
  status: PunchStatus;
  priority: PunchPriority;
  notes: string | null;
  createdAt: string;
}

const priorityDot: Record<PunchPriority, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-green-500",
};

const priorityBadge: Record<PunchPriority, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const statusBadge: Record<PunchStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  CLOSED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const statusLabel: Record<PunchStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
};

type FilterTab = "ALL" | PunchStatus;

const emptyForm = {
  description: "",
  location: "",
  assignee: "",
  dueDate: "",
  priority: "MEDIUM" as PunchPriority,
  notes: "",
};

export function PunchListShell({
  projectId,
  initialItems,
}: {
  projectId: string;
  initialItems: PunchItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [form, setForm] = useState(emptyForm);

  const open = items.filter((i) => i.status === "OPEN");
  const inProgress = items.filter((i) => i.status === "IN_PROGRESS");
  const closed = items.filter((i) => i.status === "CLOSED");

  const filtered =
    filter === "ALL"
      ? items
      : filter === "OPEN"
      ? open
      : filter === "IN_PROGRESS"
      ? inProgress
      : closed;

  async function handleCreate() {
    if (!form.description.trim()) {
      toast.error("Description is required.");
      return;
    }
    setSaving(true);
    try {
      const item = await createPunchItem(projectId, {
        description: form.description,
        location: form.location || null,
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
        priority: form.priority,
        notes: form.notes || null,
      });
      setItems((prev) => [
        JSON.parse(JSON.stringify(item, (_, v) => (v instanceof Date ? v.toISOString() : v))),
        ...prev,
      ]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Item added.");
    } catch {
      toast.error("Failed to add item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: PunchStatus) {
    try {
      await updatePunchStatus(projectId, id, status);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePunchItem(projectId, id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item deleted.");
    } catch {
      toast.error("Failed to delete item.");
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "CLOSED", label: "Closed" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open", count: open.length, color: "text-blue-600 dark:text-blue-400" },
          { label: "In Progress", count: inProgress.length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Closed", count: closed.length, color: "text-green-600 dark:text-green-400" },
          { label: "Total", count: items.length, color: "" },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className={`text-xl font-semibold tabular ${card.color}`}>{card.count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Punch List Item</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="pl-desc">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="pl-desc"
                rows={2}
                placeholder="Describe the deficiency or item to be completed"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-loc">Location</Label>
              <Input
                id="pl-loc"
                placeholder="Room, floor, area"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-assignee">Assignee</Label>
              <Input
                id="pl-assignee"
                placeholder="Responsible party"
                value={form.assignee}
                onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-due">Due Date</Label>
              <Input
                id="pl-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as PunchPriority }))}
              >
                <SelectTrigger id="pl-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="pl-notes">Notes</Label>
              <Textarea
                id="pl-notes"
                rows={2}
                placeholder="Additional notes or context"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Add Item"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No punch list items. Add items to track pre-completion deficiencies.
        </div>
      )}

      {filtered.length === 0 && items.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No items match this filter.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isClosed = item.status === "CLOSED";
            return (
              <div
                key={item.id}
                className={`rounded-md border border-border bg-surface p-3 space-y-2 ${isClosed ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityDot[item.priority]}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={`text-sm font-medium ${isClosed ? "line-through text-muted-foreground" : ""}`}>
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {item.location && (
                          <span className="text-xs text-muted-foreground">{item.location}</span>
                        )}
                        {item.assignee && (
                          <span className="text-xs text-muted-foreground">{item.assignee}</span>
                        )}
                        {item.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due{" "}
                            {new Date(item.dueDate).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge[item.priority]}`}>
                      {item.priority}
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as PunchStatus)}
                      className={`appearance-none cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-primary ${statusBadge[item.status]}`}
                    >
                      {(["OPEN", "IN_PROGRESS", "CLOSED"] as PunchStatus[]).map((s) => (
                        <option key={s} value={s}>{statusLabel[s]}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
