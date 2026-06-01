"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createChecklistItem, toggleChecklistItem, deleteChecklistItem } from "@/actions/checklist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, CheckSquare } from "lucide-react";

interface Item {
  id: string;
  description: string;
  category: string | null;
  isCompleted: boolean;
  sortOrder: number;
}

export function ChecklistShell({ projectId, initialItems }: { projectId: string; initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ description: "", category: "" });

  const { completed, total, pct, byCategory } = useMemo(() => {
    const completed = items.filter((i) => i.isCompleted).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const byCategory = items.reduce<Record<string, Item[]>>((acc, item) => {
      const cat = item.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return { completed, total, pct, byCategory };
  }, [items]);

  async function handleAdd() {
    if (!form.description.trim()) { toast.error("Description is required."); return; }
    setSaving(true);
    try {
      const item = await createChecklistItem(projectId, { description: form.description, category: form.category || null });
      setItems((p) => [...p, { ...item, completedAt: null } as unknown as Item]);
      setForm({ description: "", category: "" });
      setShowForm(false);
      toast.success("Item added.");
    } catch { toast.error("Failed."); }
    finally { setSaving(false); }
  }

  async function handleToggle(id: string, current: boolean) {
    setItems((p) => p.map((i) => i.id === id ? { ...i, isCompleted: !current } : i));
    try {
      await toggleChecklistItem(projectId, id, !current);
    } catch {
      setItems((p) => p.map((i) => i.id === id ? { ...i, isCompleted: current } : i));
      toast.error("Failed.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteChecklistItem(projectId, id);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch { toast.error("Failed."); }
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-md border border-border bg-surface p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{pct}% Complete</span>
          <span className="text-muted-foreground">{completed} / {total} items</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="cdesc">Description <span className="text-destructive">*</span></Label>
              <Input id="cdesc" placeholder="e.g. Submit building permit" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ccat">Category</Label>
              <Input id="ccat" placeholder="e.g. Permits, Structural, MEP" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No checklist items yet. Add your first activity.
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(byCategory).map(([category, catItems]) => (
          <div key={category} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">{category}</p>
            <div className="rounded-md border border-border bg-surface overflow-hidden divide-y divide-border">
              {catItems.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${item.isCompleted ? "bg-muted/20" : "hover:bg-muted/10"}`}>
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => handleToggle(item.id, item.isCompleted)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <span className={`flex-1 text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {item.description}
                  </span>
                  <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
