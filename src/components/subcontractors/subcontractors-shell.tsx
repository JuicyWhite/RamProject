"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  createSubcontractor,
  updateSubcontractorStatus,
  updatePaidAmount,
  deleteSubcontractor,
} from "@/actions/subcontractors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SubcontractorStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "TERMINATED";

interface Subcontractor {
  id: string;
  company: string;
  trade: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contractValue: number | null;
  paidAmount: number;
  status: SubcontractorStatus;
  notes: string | null;
}

const statusColors: Record<SubcontractorStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusLabel: Record<SubcontractorStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  TERMINATED: "Terminated",
};

export function SubcontractorsShell({
  projectId,
  initialSubs,
}: {
  projectId: string;
  initialSubs: Subcontractor[];
}) {
  const [subs, setSubs] = useState(initialSubs);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPaid, setEditingPaid] = useState<{ id: string; value: string } | null>(null);
  const [form, setForm] = useState({
    company: "",
    trade: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contractValue: "",
    notes: "",
    status: "ACTIVE" as SubcontractorStatus,
  });

  const totals = useMemo(() => {
    const totalContract = subs.reduce((s, sub) => s + (sub.contractValue ?? 0), 0);
    const totalPaid = subs.reduce((s, sub) => s + sub.paidAmount, 0);
    const outstanding = totalContract - totalPaid;
    return { totalContract, totalPaid, outstanding };
  }, [subs]);

  async function handleCreate() {
    if (!form.company.trim()) { toast.error("Company name is required."); return; }
    setSaving(true);
    try {
      const sub = await createSubcontractor(projectId, {
        company: form.company,
        trade: form.trade || null,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        contractValue: form.contractValue ? Number(form.contractValue) : null,
        notes: form.notes || null,
        status: form.status,
      });
      setSubs((prev) => [
        JSON.parse(JSON.stringify(sub, (_, v) => v instanceof Date ? v.toISOString() : typeof v === "object" && v !== null && "toFixed" in v ? Number(v) : v)),
        ...prev,
      ]);
      setForm({ company: "", trade: "", contactName: "", contactEmail: "", contactPhone: "", contractValue: "", notes: "", status: "ACTIVE" });
      setShowForm(false);
      toast.success("Subcontractor added.");
    } catch { toast.error("Failed to add subcontractor."); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id: string, status: SubcontractorStatus) {
    try {
      await updateSubcontractorStatus(projectId, id, status);
      setSubs((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    } catch { toast.error("Failed to update status."); }
  }

  async function handlePaidSave(id: string) {
    if (!editingPaid || editingPaid.id !== id) return;
    const val = Number(editingPaid.value);
    if (isNaN(val) || val < 0) { toast.error("Invalid amount."); return; }
    try {
      await updatePaidAmount(projectId, id, val);
      setSubs((prev) => prev.map((s) => s.id === id ? { ...s, paidAmount: val } : s));
      setEditingPaid(null);
      toast.success("Paid amount updated.");
    } catch { toast.error("Failed to update paid amount."); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSubcontractor(projectId, id);
      setSubs((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subcontractor deleted.");
    } catch { toast.error("Failed to delete subcontractor."); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Subs", value: subs.length, isCurrency: false },
          { label: "Total Contract Value", value: totals.totalContract, isCurrency: true },
          { label: "Total Paid", value: totals.totalPaid, isCurrency: true },
          { label: "Outstanding", value: totals.outstanding, isCurrency: true },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
            <p className="text-sm font-semibold tabular">
              {card.isCurrency ? formatCurrency(card.value as number) : card.value}
            </p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Subcontractor
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Subcontractor</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="scompany">Company <span className="text-destructive">*</span></Label>
              <Input
                id="scompany"
                placeholder="Company name"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="strade">Trade</Label>
              <Input
                id="strade"
                placeholder="e.g. Electrical, Plumbing"
                value={form.trade}
                onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sstatus">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as SubcontractorStatus }))}>
                <SelectTrigger id="sstatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["ACTIVE", "COMPLETED", "ON_HOLD", "TERMINATED"] as SubcontractorStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="scname">Contact Name</Label>
              <Input
                id="scname"
                placeholder="Full name"
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scemail">Contact Email</Label>
              <Input
                id="scemail"
                type="email"
                placeholder="email@example.com"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scphone">Contact Phone</Label>
              <Input
                id="scphone"
                placeholder="+63 9XX XXX XXXX"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="scvalue">Contract Value (₱)</Label>
              <Input
                id="scvalue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.contractValue}
                onChange={(e) => setForm((f) => ({ ...f, contractValue: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="snotes">Notes</Label>
              <Textarea
                id="snotes"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Add Subcontractor"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {subs.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No subcontractors yet.
        </div>
      )}

      {subs.length > 0 && (
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Trade</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Contract</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Paid</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Balance</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => {
                const balance = (sub.contractValue ?? 0) - sub.paidAmount;
                return (
                  <tr key={sub.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium">{sub.company}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
                      {sub.trade ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {sub.contactName && <p className="text-sm">{sub.contactName}</p>}
                      {sub.contactPhone && <p className="text-xs text-muted-foreground">{sub.contactPhone}</p>}
                      {!sub.contactName && !sub.contactPhone && <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm tabular">
                      {sub.contractValue != null ? formatCurrency(sub.contractValue) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {editingPaid?.id === sub.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-6 w-24 text-xs text-right"
                            value={editingPaid.value}
                            onChange={(e) => setEditingPaid({ id: sub.id, value: e.target.value })}
                            onKeyDown={(e) => { if (e.key === "Enter") handlePaidSave(sub.id); if (e.key === "Escape") setEditingPaid(null); }}
                            autoFocus
                          />
                          <button onClick={() => handlePaidSave(sub.id)} className="text-xs text-primary hover:underline">Save</button>
                          <button onClick={() => setEditingPaid(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPaid({ id: sub.id, value: String(sub.paidAmount) })}
                          className="text-sm tabular hover:text-primary transition-colors"
                        >
                          {formatCurrency(sub.paidAmount)}
                        </button>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-sm tabular hidden sm:table-cell ${balance < 0 ? "text-destructive" : ""}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value as SubcontractorStatus)}
                        className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${statusColors[sub.status]}`}
                      >
                        {(["ACTIVE", "COMPLETED", "ON_HOLD", "TERMINATED"] as SubcontractorStatus[]).map((s) => (
                          <option key={s} value={s}>{statusLabel[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
