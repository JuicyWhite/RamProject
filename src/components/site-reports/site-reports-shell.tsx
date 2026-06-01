"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createSiteReport, deleteSiteReport } from "@/actions/site-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ClipboardList } from "lucide-react";

interface SiteReport {
  id: string;
  date: string;
  weather: string | null;
  temperature: string | null;
  manpower: number | null;
  equipment: string | null;
  workDone: string;
  materials: string | null;
  visitors: string | null;
  issues: string | null;
  notes: string | null;
}

const emptyForm = {
  date: new Date().toISOString().split("T")[0],
  weather: "",
  temperature: "",
  manpower: "",
  equipment: "",
  workDone: "",
  materials: "",
  visitors: "",
  issues: "",
  notes: "",
};

export function SiteReportsShell({
  projectId,
  initialReports,
}: {
  projectId: string;
  initialReports: SiteReport[];
}) {
  const [reports, setReports] = useState(initialReports);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate() {
    if (!form.workDone.trim()) {
      toast.error("Work done is required.");
      return;
    }
    setSaving(true);
    try {
      const report = await createSiteReport(projectId, {
        date: form.date,
        weather: form.weather || null,
        temperature: form.temperature || null,
        manpower: form.manpower ? Number(form.manpower) : null,
        equipment: form.equipment || null,
        workDone: form.workDone,
        materials: form.materials || null,
        visitors: form.visitors || null,
        issues: form.issues || null,
        notes: form.notes || null,
      });
      const serialized: SiteReport = {
        ...report,
        date: report.date instanceof Date ? report.date.toISOString() : String(report.date),
        manpower: report.manpower ?? null,
      };
      setReports((prev) => [serialized, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Site report created.");
    } catch {
      toast.error("Failed to create report.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSiteReport(projectId, id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted.");
    } catch {
      toast.error("Failed to delete report.");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Report
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Site Report</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sr-date">Date</Label>
              <Input
                id="sr-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sr-weather">Weather</Label>
              <Input
                id="sr-weather"
                placeholder="e.g. Sunny, Partly cloudy"
                value={form.weather}
                onChange={(e) => set("weather", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sr-temp">Temperature</Label>
              <Input
                id="sr-temp"
                placeholder="e.g. 32°C"
                value={form.temperature}
                onChange={(e) => set("temperature", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sr-manpower">Manpower Count</Label>
              <Input
                id="sr-manpower"
                type="number"
                min="0"
                placeholder="0"
                value={form.manpower}
                onChange={(e) => set("manpower", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sr-work">Work Done <span className="text-destructive">*</span></Label>
              <Textarea
                id="sr-work"
                rows={3}
                placeholder="Describe work completed today..."
                value={form.workDone}
                onChange={(e) => set("workDone", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sr-equipment">Equipment</Label>
              <Textarea
                id="sr-equipment"
                rows={2}
                placeholder="Equipment used on site..."
                value={form.equipment}
                onChange={(e) => set("equipment", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sr-materials">Materials</Label>
              <Textarea
                id="sr-materials"
                rows={2}
                placeholder="Materials used or delivered..."
                value={form.materials}
                onChange={(e) => set("materials", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sr-visitors">Visitors</Label>
              <Input
                id="sr-visitors"
                placeholder="e.g. Client representative"
                value={form.visitors}
                onChange={(e) => set("visitors", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sr-issues">Issues</Label>
              <Textarea
                id="sr-issues"
                rows={2}
                placeholder="Any issues or concerns encountered..."
                value={form.issues}
                onChange={(e) => set("issues", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sr-notes">Notes</Label>
              <Textarea
                id="sr-notes"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Create Report"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {reports.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No site reports yet. Create one to start logging daily site activity.
        </div>
      )}

      {reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-md border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold tabular">
                      {new Date(report.date).toLocaleDateString("en-PH", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {report.weather && (
                      <span className="text-xs text-muted-foreground">{report.weather}</span>
                    )}
                    {report.manpower != null && (
                      <span className="text-xs text-muted-foreground">
                        {report.manpower} worker{report.manpower !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.workDone}</p>
                  {report.issues && (
                    <p className="text-xs text-destructive/80 line-clamp-1">Issues: {report.issues}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
