"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createDocument, updateDocumentStatus, deleteDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FileText } from "lucide-react";

type DocType = "SUBMITTAL" | "RFI" | "TRANSMITTAL";
type DocStatus = "PENDING" | "APPROVED" | "REJECTED" | "CLOSED";

interface Doc {
  id: string;
  type: DocType;
  number: string | null;
  title: string;
  description: string | null;
  from: string | null;
  to: string | null;
  date: string;
  status: DocStatus;
  response: string | null;
}

const statusColors: Record<DocStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  CLOSED: "bg-muted text-muted-foreground",
};

const typeLabel: Record<DocType, string> = {
  SUBMITTAL: "Submittal", RFI: "RFI", TRANSMITTAL: "Transmittal",
};

export function DocumentsShell({ projectId, initialDocuments }: { projectId: string; initialDocuments: Doc[] }) {
  const [docs, setDocs] = useState(initialDocuments);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DocType>("SUBMITTAL");
  const [form, setForm] = useState({
    type: "SUBMITTAL" as DocType, number: "", title: "",
    description: "", from: "", to: "", date: new Date().toISOString().split("T")[0],
  });

  const counts = useMemo(() => ({
    SUBMITTAL: docs.filter((d) => d.type === "SUBMITTAL").length,
    RFI: docs.filter((d) => d.type === "RFI").length,
    TRANSMITTAL: docs.filter((d) => d.type === "TRANSMITTAL").length,
  }), [docs]);

  const filtered = docs.filter((d) => d.type === activeTab);

  async function handleCreate() {
    if (!form.title.trim()) { toast.error("Title is required."); return; }
    setSaving(true);
    try {
      const doc = await createDocument(projectId, {
        type: form.type, number: form.number || null, title: form.title,
        description: form.description || null, from: form.from || null,
        to: form.to || null, date: form.date,
      });
      setDocs((p) => [JSON.parse(JSON.stringify(doc, (_, v) => v instanceof Date ? v.toISOString() : v)), ...p]);
      setForm({ type: activeTab, number: "", title: "", description: "", from: "", to: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast.success(`${typeLabel[form.type]} created.`);
    } catch { toast.error("Failed."); }
    finally { setSaving(false); }
  }

  async function handleStatus(id: string, status: DocStatus) {
    try {
      await updateDocumentStatus(projectId, id, status);
      setDocs((p) => p.map((d) => d.id === id ? { ...d, status } : d));
    } catch { toast.error("Failed."); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(projectId, id);
      setDocs((p) => p.filter((d) => d.id !== id));
      toast.success("Deleted.");
    } catch { toast.error("Failed."); }
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["SUBMITTAL", "RFI", "TRANSMITTAL"] as DocType[]).map((t) => (
          <div key={t} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{typeLabel[t]}s</p>
            <p className="text-xl font-semibold tabular">{counts[t]}</p>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as DocType); setShowForm(false); setForm((f) => ({ ...f, type: v as DocType })); }}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="SUBMITTAL">Submittals ({counts.SUBMITTAL})</TabsTrigger>
            <TabsTrigger value="RFI">RFIs ({counts.RFI})</TabsTrigger>
            <TabsTrigger value="TRANSMITTAL">Transmittals ({counts.TRANSMITTAL})</TabsTrigger>
          </TabsList>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> New {typeLabel[activeTab]}
            </Button>
          )}
        </div>

        {(["SUBMITTAL", "RFI", "TRANSMITTAL"] as DocType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-3 mt-3">
            {showForm && activeTab === type && (
              <div className="rounded-md border border-border bg-surface p-4 space-y-3">
                <h2 className="text-sm font-semibold">New {typeLabel[type]}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="dnum">Number</Label>
                    <Input id="dnum" placeholder={`e.g. ${type.slice(0,3)}-001`} value={form.number}
                      onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ddate">Date</Label>
                    <Input id="ddate" type="date" value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="dtitle">Title <span className="text-destructive">*</span></Label>
                    <Input id="dtitle" placeholder="Document title" value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dfrom">From</Label>
                    <Input id="dfrom" placeholder="Sender" value={form.from}
                      onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dto">To</Label>
                    <Input id="dto" placeholder="Recipient" value={form.to}
                      onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="ddesc">Description</Label>
                    <Textarea id="ddesc" rows={2} placeholder="Details..." value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {filtered.length === 0 && !showForm && (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No {typeLabel[type]}s yet.
              </div>
            )}

            {filtered.length > 0 && (
              <div className="rounded-md border border-border bg-surface overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">No.</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">From → To</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => (
                      <tr key={doc.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{doc.number ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium">{doc.title}</p>
                          {doc.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{doc.description}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">
                          {[doc.from, doc.to].filter(Boolean).join(" → ") || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                          {new Date(doc.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={doc.status}
                            onChange={(e) => handleStatus(doc.id, e.target.value as DocStatus)}
                            className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${statusColors[doc.status]}`}
                          >
                            {(["PENDING", "APPROVED", "REJECTED", "CLOSED"] as DocStatus[]).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => handleDelete(doc.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
