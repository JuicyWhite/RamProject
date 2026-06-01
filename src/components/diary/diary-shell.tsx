"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertDiaryEntry, deleteDiaryEntry } from "@/actions/diary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface DiaryEntry {
  id: string;
  date: string;
  weather: string | null;
  manpowerCount: number | null;
  progress: string;
  challenges: string | null;
  nextDayPlan: string | null;
  createdBy: { name: string | null; email: string | null };
}

interface DiaryShellProps {
  projectId: string;
  initialEntries: DiaryEntry[];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DiaryShell({ projectId, initialEntries }: DiaryShellProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(entries[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: today(),
    weather: "",
    manpowerCount: "",
    progress: "",
    challenges: "",
    nextDayPlan: "",
  });

  async function handleSave() {
    if (!form.progress.trim()) {
      toast.error("Progress notes are required.");
      return;
    }
    setSaving(true);
    try {
      const entry = await upsertDiaryEntry(projectId, {
        date: form.date,
        weather: form.weather || null,
        manpowerCount: form.manpowerCount ? Number(form.manpowerCount) : null,
        progress: form.progress,
        challenges: form.challenges || null,
        nextDayPlan: form.nextDayPlan || null,
      });
      const serialized = {
        ...entry,
        date: entry.date.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        createdBy: { name: null, email: null },
      };
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = serialized;
          return next;
        }
        return [serialized, ...prev];
      });
      setExpanded(entry.id);
      setShowForm(false);
      setForm({ date: today(), weather: "", manpowerCount: "", progress: "", challenges: "", nextDayPlan: "" });
      toast.success("Diary entry saved.");
    } catch {
      toast.error("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await deleteDiaryEntry(projectId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Log Today&apos;s Entry
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-4">
          <h2 className="text-sm font-semibold">New Diary Entry</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="weather">Weather</Label>
              <Input
                id="weather"
                placeholder="e.g. Sunny, Rainy"
                value={form.weather}
                onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manpower">Manpower Count</Label>
              <Input
                id="manpower"
                type="number"
                min="0"
                placeholder="0"
                value={form.manpowerCount}
                onChange={(e) => setForm((f) => ({ ...f, manpowerCount: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="progress">Progress / Work Done <span className="text-destructive">*</span></Label>
            <Textarea
              id="progress"
              rows={4}
              placeholder="Describe today's work accomplished..."
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="challenges">Challenges / Issues</Label>
            <Textarea
              id="challenges"
              rows={2}
              placeholder="Any problems encountered..."
              value={form.challenges}
              onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nextDay">Next Day Plan</Label>
            <Textarea
              id="nextDay"
              rows={2}
              placeholder="Plan for tomorrow..."
              value={form.nextDayPlan}
              onChange={(e) => setForm((f) => ({ ...f, nextDayPlan: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Entry"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No diary entries yet. Log your first entry.
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-md border border-border bg-surface overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatDate(entry.date)}</span>
                {entry.weather && (
                  <span className="text-xs text-muted-foreground">{entry.weather}</span>
                )}
                {entry.manpowerCount != null && (
                  <span className="text-xs text-muted-foreground">{entry.manpowerCount} workers</span>
                )}
              </div>
              {expanded === entry.id ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {expanded === entry.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="pt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Progress</p>
                  <p className="text-sm whitespace-pre-wrap">{entry.progress}</p>
                </div>
                {entry.challenges && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Challenges</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.challenges}</p>
                  </div>
                )}
                {entry.nextDayPlan && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Next Day Plan</p>
                    <p className="text-sm whitespace-pre-wrap">{entry.nextDayPlan}</p>
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
