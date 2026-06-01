"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createBillingStatement, updateBillingStatus, deleteBillingStatement } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ReceiptText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type BillingStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

interface BillingStatement {
  id: string;
  number: string | null;
  date: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: number;
  paidAmount: number;
  status: BillingStatus;
  notes: string | null;
}

const statusColors: Record<BillingStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const emptyForm = {
  number: "",
  date: new Date().toISOString().split("T")[0],
  periodStart: "",
  periodEnd: "",
  amount: "",
  notes: "",
};

export function BillingShell({
  projectId,
  initialStatements,
}: {
  projectId: string;
  initialStatements: BillingStatement[];
}) {
  const [statements, setStatements] = useState(initialStatements);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const totals = useMemo(() => {
    const totalBilled = statements.reduce((s, st) => s + st.amount, 0);
    const totalPaid = statements.reduce((s, st) => s + st.paidAmount, 0);
    const outstanding = totalBilled - totalPaid;
    return { totalBilled, totalPaid, outstanding };
  }, [statements]);

  async function handleCreate() {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Amount is required.");
      return;
    }
    setSaving(true);
    try {
      const statement = await createBillingStatement(projectId, {
        number: form.number || null,
        date: form.date,
        periodStart: form.periodStart || null,
        periodEnd: form.periodEnd || null,
        amount: Number(form.amount),
        notes: form.notes || null,
      });
      const serialized: BillingStatement = {
        ...statement,
        date: statement.date instanceof Date ? statement.date.toISOString() : String(statement.date),
        periodStart: statement.periodStart instanceof Date ? statement.periodStart.toISOString() : (statement.periodStart ?? null),
        periodEnd: statement.periodEnd instanceof Date ? statement.periodEnd.toISOString() : (statement.periodEnd ?? null),
        amount: Number(statement.amount),
        paidAmount: Number(statement.paidAmount),
      };
      setStatements((prev) => [serialized, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Billing statement created.");
    } catch {
      toast.error("Failed to create statement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: BillingStatus) {
    try {
      await updateBillingStatus(projectId, id, status);
      setStatements((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBillingStatement(projectId, id);
      setStatements((prev) => prev.filter((s) => s.id !== id));
      toast.success("Statement deleted.");
    } catch {
      toast.error("Failed to delete statement.");
    }
  }

  function formatPeriod(start: string | null, end: string | null) {
    if (!start && !end) return "—";
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `From ${fmt(start)}`;
    if (end) return `Until ${fmt(end)}`;
    return "—";
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Billed", value: totals.totalBilled, color: "" },
          { label: "Total Paid", value: totals.totalPaid, color: "text-green-600 dark:text-green-400" },
          {
            label: "Outstanding",
            value: totals.outstanding,
            color: totals.outstanding > 0 ? "text-destructive" : "text-muted-foreground",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-sm font-semibold tabular ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Statement
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Billing Statement</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="bs-number">Statement Number</Label>
              <Input
                id="bs-number"
                placeholder="e.g. BS-001"
                value={form.number}
                onChange={(e) => set("number", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-date">Date <span className="text-destructive">*</span></Label>
              <Input
                id="bs-date"
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-period-start">Period Start</Label>
              <Input
                id="bs-period-start"
                type="date"
                value={form.periodStart}
                onChange={(e) => set("periodStart", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bs-period-end">Period End</Label>
              <Input
                id="bs-period-end"
                type="date"
                value={form.periodEnd}
                onChange={(e) => set("periodEnd", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bs-amount">Amount (₱) <span className="text-destructive">*</span></Label>
              <Input
                id="bs-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="bs-notes">Notes</Label>
              <Textarea
                id="bs-notes"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Create Statement"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {statements.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ReceiptText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No billing statements yet. Create one to start tracking progress billing.
        </div>
      )}

      {statements.length > 0 && (
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">No. / Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Period</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Paid</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {statements.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <p className="text-sm font-medium">{s.number ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {formatPeriod(s.periodStart, s.periodEnd)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium tabular">
                    {formatCurrency(s.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular text-muted-foreground hidden sm:table-cell">
                    {formatCurrency(s.paidAmount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value as BillingStatus)}
                      className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${statusColors[s.status]}`}
                    >
                      {(["DRAFT", "SENT", "PAID", "CANCELLED"] as BillingStatus[]).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
