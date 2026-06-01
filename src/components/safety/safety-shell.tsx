"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createIncident, closeIncident, deleteIncident } from "@/actions/safety";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShieldAlert } from "lucide-react";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Status = "OPEN" | "CLOSED";

interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: Status;
  incidentDate: string;
  location: string | null;
  injuredPerson: string | null;
  correctiveAction: string | null;
}

const severityColors: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

export function SafetyShell({ projectId, initialIncidents }: { projectId: string; initialIncidents: Incident[] }) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", severity: "MEDIUM" as Severity,
    incidentDate: new Date().toISOString().split("T")[0],
    location: "", injuredPerson: "", correctiveAction: "",
  });

  const open = incidents.filter((i) => i.status === "OPEN");
  const closed = incidents.filter((i) => i.status === "CLOSED");

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  open.forEach((i) => counts[i.severity]++);

  async function handleCreate() {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const inc = await createIncident(projectId, {
        title: form.title, description: form.description || null,
        severity: form.severity, incidentDate: form.incidentDate,
        location: form.location || null, injuredPerson: form.injuredPerson || null,
        correctiveAction: form.correctiveAction || null,
      });
      setIncidents((p) => [JSON.parse(JSON.stringify(inc, (_, v) => v instanceof Date ? v.toISOString() : v)), ...p]);
      setForm({ title: "", description: "", severity: "MEDIUM", incidentDate: new Date().toISOString().split("T")[0], location: "", injuredPerson: "", correctiveAction: "" });
      setShowForm(false);
      toast.success("Incident logged.");
    } catch { toast.error("Failed to log incident."); }
    finally { setSaving(false); }
  }

  async function handleClose(id: string) {
    try {
      await closeIncident(projectId, id);
      setIncidents((p) => p.map((i) => i.id === id ? { ...i, status: "CLOSED" as Status } : i));
      toast.success("Incident closed.");
    } catch { toast.error("Failed."); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIncident(projectId, id);
      setIncidents((p) => p.filter((i) => i.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Failed."); }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((s) => (
          <div key={s} className={`rounded-md border p-3 space-y-1 ${counts[s] > 0 && s === "CRITICAL" ? "border-red-300" : "border-border"}`}>
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{s}</p>
            <p className={`text-xl font-semibold tabular ${counts[s] > 0 ? severityColors[s].split(" ")[1] : ""}`}>{counts[s]}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Log Incident
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Log Safety Incident</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="stitle">Title <span className="text-destructive">*</span></Label>
              <Input id="stitle" placeholder="Brief description of incident" value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sdate">Date</Label>
              <Input id="sdate" type="date" value={form.incidentDate}
                onChange={(e) => setForm((f) => ({ ...f, incidentDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sloc">Location</Label>
              <Input id="sloc" placeholder="Where did it happen?" value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sinj">Injured Person</Label>
              <Input id="sinj" placeholder="Name (if any)" value={form.injuredPerson}
                onChange={(e) => setForm((f) => ({ ...f, injuredPerson: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Severity</Label>
              <div className="flex gap-2 flex-wrap">
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((s) => (
                  <button key={s} onClick={() => setForm((f) => ({ ...f, severity: s }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.severity === s ? severityColors[s] + " border-current" : "border-border hover:bg-muted/40"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="sdesc">Description</Label>
              <Textarea id="sdesc" rows={2} placeholder="What happened?" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="scorr">Corrective Action</Label>
              <Textarea id="scorr" rows={2} placeholder="What was done to address it?" value={form.correctiveAction}
                onChange={(e) => setForm((f) => ({ ...f, correctiveAction: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Log Incident"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {incidents.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No incidents logged. Stay safe on site.
        </div>
      )}

      {open.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Incidents</p>
          {open.map((inc) => (
            <div key={inc.id} className="rounded-md border border-border bg-surface p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[inc.severity]}`}>{inc.severity}</span>
                  <p className="text-sm font-medium">{inc.title}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleClose(inc.id)}>Close</Button>
                  <button onClick={() => handleDelete(inc.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground">{new Date(inc.incidentDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                {inc.location && <span className="text-xs text-muted-foreground">{inc.location}</span>}
                {inc.injuredPerson && <span className="text-xs text-muted-foreground">Injured: {inc.injuredPerson}</span>}
              </div>
              {inc.description && <p className="text-xs text-muted-foreground">{inc.description}</p>}
            </div>
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Closed</p>
          {closed.map((inc) => (
            <div key={inc.id} className="rounded-md border border-border/50 bg-surface/50 p-3 flex items-center justify-between gap-2 opacity-60">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[inc.severity]}`}>{inc.severity}</span>
                <p className="text-sm line-through">{inc.title}</p>
              </div>
              <button onClick={() => handleDelete(inc.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
