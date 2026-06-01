"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createChangeOrder, updateChangeOrderStatus, deleteChangeOrder } from "@/actions/change-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileSignature } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ChangeOrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "VOIDED";

interface ChangeOrder {
  id: string;
  number: string | null;
  title: string;
  description: string | null;
  requestedBy: string | null;
  submittedDate: string;
  approvedDate: string | null;
  amount: number;
  status: ChangeOrderStatus;
  notes: string | null;
}

const statusColors: Record<ChangeOrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  VOIDED: "bg-muted text-muted-foreground",
};

const emptyForm = {
  number: "",
  title: "",
  description: "",
  requestedBy: "",
  submittedDate: new Date().toISOString().split("T")[0],
  amount: "",
  notes: "",
};

export function ChangeOrdersShell({
  projectId,
  initialOrders,
}: {
  projectId: string;
  initialOrders: ChangeOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvedDateMap, setApprovedDateMap] = useState<Record<string, string>>({});

  function set(field: keyof typeof emptyForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const totals = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.amount, 0);
    const approved = orders.filter((o) => o.status === "APPROVED").reduce((s, o) => s + o.amount, 0);
    const pending = orders.filter((o) => o.status === "PENDING").reduce((s, o) => s + o.amount, 0);
    return { total, approved, pending };
  }, [orders]);

  async function handleCreate() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!form.submittedDate) {
      toast.error("Submitted date is required.");
      return;
    }
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error("Amount is required.");
      return;
    }
    setSaving(true);
    try {
      const order = await createChangeOrder(projectId, {
        number: form.number || null,
        title: form.title,
        description: form.description || null,
        requestedBy: form.requestedBy || null,
        submittedDate: form.submittedDate,
        amount: Number(form.amount),
        notes: form.notes || null,
      });
      const serialized: ChangeOrder = {
        id: order.id,
        number: order.number,
        title: order.title,
        description: order.description,
        requestedBy: order.requestedBy,
        submittedDate: order.submittedDate instanceof Date ? order.submittedDate.toISOString() : String(order.submittedDate),
        approvedDate: order.approvedDate instanceof Date ? order.approvedDate.toISOString() : (order.approvedDate ?? null),
        amount: Number(order.amount),
        status: order.status as ChangeOrderStatus,
        notes: order.notes,
      };
      setOrders((prev) => [serialized, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Change order created.");
    } catch {
      toast.error("Failed to create change order.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: ChangeOrderStatus) {
    if (status === "APPROVED") {
      setApprovingId(id);
      return;
    }
    try {
      await updateChangeOrderStatus(projectId, id, status);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status, approvedDate: null } : o));
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleApproveConfirm(id: string) {
    const approvedDate = approvedDateMap[id] ?? new Date().toISOString().split("T")[0];
    try {
      await updateChangeOrderStatus(projectId, id, "APPROVED", approvedDate);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: "APPROVED", approvedDate: new Date(approvedDate).toISOString() }
            : o
        )
      );
      setApprovingId(null);
    } catch {
      toast.error("Failed to approve change order.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteChangeOrder(projectId, id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Change order deleted.");
    } catch {
      toast.error("Failed to delete change order.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { label: "Total COs", value: orders.length.toString(), isCurrency: false },
          { label: "Total Amount", value: totals.total, isCurrency: true },
          { label: "Approved Amount", value: totals.approved, isCurrency: true, color: "text-green-600 dark:text-green-400" },
          { label: "Pending Amount", value: totals.pending, isCurrency: true, color: "text-amber-600 dark:text-amber-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className={`text-sm font-semibold tabular ${card.color ?? ""}`}>
              {card.isCurrency ? formatCurrency(card.value as number) : card.value}
            </p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Change Order
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Change Order</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="co-number">CO Number</Label>
              <Input
                id="co-number"
                placeholder="e.g. CO-001"
                value={form.number}
                onChange={(e) => set("number", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="co-submitted">Submitted Date <span className="text-destructive">*</span></Label>
              <Input
                id="co-submitted"
                type="date"
                value={form.submittedDate}
                onChange={(e) => set("submittedDate", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="co-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="co-title"
                placeholder="Change order title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="co-requested-by">Requested By</Label>
              <Input
                id="co-requested-by"
                placeholder="Name or company"
                value={form.requestedBy}
                onChange={(e) => set("requestedBy", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="co-amount">Amount (₱) <span className="text-destructive">*</span></Label>
              <Input
                id="co-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="co-description">Description</Label>
              <Textarea
                id="co-description"
                rows={2}
                placeholder="Scope of change..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="co-notes">Notes</Label>
              <Textarea
                id="co-notes"
                rows={2}
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Create Change Order"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {orders.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <FileSignature className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No change orders yet. Create one to track contract changes.
        </div>
      )}

      {orders.length > 0 && (
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">CO #</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Requested By</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Submitted</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                    {o.number ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-sm font-medium">{o.title}</p>
                    {o.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{o.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                    {o.requestedBy ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                    {new Date(o.submittedDate).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-medium tabular">
                    {formatCurrency(o.amount)}
                  </td>
                  <td className="px-4 py-2.5">
                    {approvingId === o.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="date"
                          className="h-6 text-xs px-1.5 w-32"
                          value={approvedDateMap[o.id] ?? new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setApprovedDateMap((prev) => ({ ...prev, [o.id]: e.target.value }))
                          }
                        />
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleApproveConfirm(o.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => setApprovingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as ChangeOrderStatus)}
                        className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${statusColors[o.status]}`}
                      >
                        {(["PENDING", "APPROVED", "REJECTED", "VOIDED"] as ChangeOrderStatus[]).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(o.id)}
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
