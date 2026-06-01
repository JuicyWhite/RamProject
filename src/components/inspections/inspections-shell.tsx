"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createInspection, updateInspectionStatus, deleteInspection,
  createIssue, resolveIssue, deleteIssue,
} from "@/actions/inspections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, ClipboardCheck, AlertTriangle } from "lucide-react";

type InspectionStatus = "OPEN" | "PASSED" | "FAILED";
type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type IssueStatus = "OPEN" | "RESOLVED";

interface Inspection {
  id: string;
  title: string;
  location: string | null;
  inspector: string | null;
  date: string;
  status: InspectionStatus;
  notes: string | null;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  resolvedAt: string | null;
  inspectionId: string | null;
}

const severityColors: Record<IssueSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  LOW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const inspectionStatusColors: Record<InspectionStatus, string> = {
  OPEN: "bg-muted text-muted-foreground",
  PASSED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export function InspectionsShell({
  projectId,
  initialInspections,
  initialIssues,
}: {
  projectId: string;
  initialInspections: Inspection[];
  initialIssues: Issue[];
}) {
  const [inspections, setInspections] = useState(initialInspections);
  const [issues, setIssues] = useState(initialIssues);
  const [showInspForm, setShowInspForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [inspForm, setInspForm] = useState({
    title: "", location: "", inspector: "",
    date: new Date().toISOString().split("T")[0], notes: "",
  });

  const [issueForm, setIssueForm] = useState({
    title: "", description: "", severity: "MEDIUM" as IssueSeverity,
  });

  const openIssues = issues.filter((i) => i.status === "OPEN");
  const resolvedIssues = issues.filter((i) => i.status === "RESOLVED");

  async function handleCreateInspection() {
    if (!inspForm.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const insp = await createInspection(projectId, {
        title: inspForm.title, location: inspForm.location || null,
        inspector: inspForm.inspector || null, date: inspForm.date,
        notes: inspForm.notes || null,
      });
      setInspections((p) => [{ ...insp, date: insp.date.toString(), updatedAt: insp.updatedAt.toString(), createdAt: insp.createdAt.toString() } as unknown as Inspection, ...p]);
      setInspForm({ title: "", location: "", inspector: "", date: new Date().toISOString().split("T")[0], notes: "" });
      setShowInspForm(false);
      toast.success("Inspection logged.");
    } catch { toast.error("Failed to log inspection."); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(inspId: string, status: InspectionStatus) {
    try {
      await updateInspectionStatus(projectId, inspId, status);
      setInspections((p) => p.map((i) => i.id === inspId ? { ...i, status } : i));
    } catch { toast.error("Failed to update status."); }
  }

  async function handleDeleteInspection(inspId: string) {
    try {
      await deleteInspection(projectId, inspId);
      setInspections((p) => p.filter((i) => i.id !== inspId));
      toast.success("Inspection deleted.");
    } catch { toast.error("Failed to delete."); }
  }

  async function handleCreateIssue() {
    if (!issueForm.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const issue = await createIssue(projectId, {
        title: issueForm.title, description: issueForm.description || null,
        severity: issueForm.severity,
      });
      setIssues((p) => [{ ...issue, createdAt: issue.createdAt.toString(), updatedAt: issue.updatedAt.toString(), resolvedAt: null } as unknown as Issue, ...p]);
      setIssueForm({ title: "", description: "", severity: "MEDIUM" });
      setShowIssueForm(false);
      toast.success("Issue logged.");
    } catch { toast.error("Failed to log issue."); }
    finally { setSaving(false); }
  }

  async function handleResolve(issueId: string) {
    try {
      await resolveIssue(projectId, issueId);
      setIssues((p) => p.map((i) => i.id === issueId ? { ...i, status: "RESOLVED" as IssueStatus, resolvedAt: new Date().toISOString() } : i));
      toast.success("Issue resolved.");
    } catch { toast.error("Failed to resolve issue."); }
  }

  async function handleDeleteIssue(issueId: string) {
    try {
      await deleteIssue(projectId, issueId);
      setIssues((p) => p.filter((i) => i.id !== issueId));
      toast.success("Issue deleted.");
    } catch { toast.error("Failed to delete."); }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Inspections", value: inspections.length, icon: ClipboardCheck },
          { label: "Open Issues", value: openIssues.length, icon: AlertTriangle, highlight: openIssues.length > 0 },
          { label: "Resolved", value: resolvedIssues.length, icon: CheckCircle },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 flex items-center gap-3">
            <card.icon className={`h-5 w-5 shrink-0 ${card.highlight ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="text-xl font-semibold tabular">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues ({openIssues.length} open)</TabsTrigger>
          <TabsTrigger value="inspections">Inspections ({inspections.length})</TabsTrigger>
        </TabsList>

        {/* Issues tab */}
        <TabsContent value="issues" className="space-y-3 mt-3">
          {!showIssueForm && (
            <Button size="sm" onClick={() => setShowIssueForm(true)}>
              <Plus className="h-3.5 w-3.5" /> New Issue
            </Button>
          )}
          {showIssueForm && (
            <div className="rounded-md border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold">Log New Issue</h2>
              <div className="space-y-1">
                <Label htmlFor="ititle">Title <span className="text-destructive">*</span></Label>
                <Input id="ititle" placeholder="Describe the issue..." value={issueForm.title}
                  onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="idesc">Details</Label>
                <Textarea id="idesc" rows={2} placeholder="Additional details..." value={issueForm.description}
                  onChange={(e) => setIssueForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Severity</Label>
                <div className="flex gap-2 flex-wrap">
                  {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as IssueSeverity[]).map((s) => (
                    <button key={s} onClick={() => setIssueForm((f) => ({ ...f, severity: s }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        issueForm.severity === s ? severityColors[s] + " border-current" : "border-border hover:bg-muted/40"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateIssue} disabled={saving}>{saving ? "Saving…" : "Log Issue"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowIssueForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {issues.length === 0 && !showIssueForm && (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No issues logged yet.
            </div>
          )}

          {openIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open</p>
              {openIssues.map((issue) => (
                <div key={issue.id} className="rounded-md border border-border bg-surface p-3 flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${severityColors[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{issue.title}</p>
                    {issue.description && <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleResolve(issue.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                    <button onClick={() => handleDeleteIssue(issue.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolvedIssues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resolved</p>
              {resolvedIssues.map((issue) => (
                <div key={issue.id} className="rounded-md border border-border/50 bg-surface/50 p-3 flex items-start gap-3 opacity-60">
                  <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${severityColors[issue.severity]}`}>
                    {issue.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-through">{issue.title}</p>
                  </div>
                  <button onClick={() => handleDeleteIssue(issue.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inspections tab */}
        <TabsContent value="inspections" className="space-y-3 mt-3">
          {!showInspForm && (
            <Button size="sm" onClick={() => setShowInspForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Log Inspection
            </Button>
          )}
          {showInspForm && (
            <div className="rounded-md border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold">Log Inspection</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="intitle">Title <span className="text-destructive">*</span></Label>
                  <Input id="intitle" placeholder="e.g. Foundation rebar inspection" value={inspForm.title}
                    onChange={(e) => setInspForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="indate">Date</Label>
                  <Input id="indate" type="date" value={inspForm.date}
                    onChange={(e) => setInspForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inloc">Location</Label>
                  <Input id="inloc" placeholder="e.g. Grid A-B / Level 1" value={inspForm.location}
                    onChange={(e) => setInspForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ininsp">Inspector</Label>
                  <Input id="ininsp" placeholder="Inspector name" value={inspForm.inspector}
                    onChange={(e) => setInspForm((f) => ({ ...f, inspector: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="innotes">Notes</Label>
                <Textarea id="innotes" rows={2} placeholder="Inspection findings..." value={inspForm.notes}
                  onChange={(e) => setInspForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateInspection} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowInspForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {inspections.length === 0 && !showInspForm && (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No inspections logged yet.
            </div>
          )}

          <div className="space-y-2">
            {inspections.map((insp) => (
              <div key={insp.id} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{insp.title}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inspectionStatusColors[insp.status]}`}>
                        {insp.status}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {insp.location && <span className="text-xs text-muted-foreground">{insp.location}</span>}
                      {insp.inspector && <span className="text-xs text-muted-foreground">By: {insp.inspector}</span>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(insp.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {insp.notes && <p className="text-xs text-muted-foreground mt-1">{insp.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {insp.status !== "PASSED" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600"
                        onClick={() => handleStatusChange(insp.id, "PASSED")}>Pass</Button>
                    )}
                    {insp.status !== "FAILED" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive"
                        onClick={() => handleStatusChange(insp.id, "FAILED")}>Fail</Button>
                    )}
                    <button onClick={() => handleDeleteInspection(insp.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
