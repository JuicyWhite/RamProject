"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createFinancialEntry, deleteFinancialEntry } from "@/actions/financial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Entry {
  id: string;
  type: "ADDITION" | "SUBTRACTION";
  description: string;
  amount: number;
  date: string;
}

interface Project {
  id: string;
  name: string;
  contractAmount: number | null;
}

export function FinancialShell({
  project,
  initialEntries,
}: {
  project: Project;
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "ADDITION" as "ADDITION" | "SUBTRACTION",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const totals = useMemo(() => {
    const additions = entries
      .filter((e) => e.type === "ADDITION")
      .reduce((s, e) => s + e.amount, 0);
    const subtractions = entries
      .filter((e) => e.type === "SUBTRACTION")
      .reduce((s, e) => s + e.amount, 0);
    const contractAmount = project.contractAmount ?? 0;
    const remaining = contractAmount + additions - subtractions;
    return { contractAmount, additions, subtractions, remaining };
  }, [entries, project.contractAmount]);

  async function handleSave() {
    if (!form.description.trim() || !form.amount) {
      toast.error("Description and amount are required.");
      return;
    }
    setSaving(true);
    try {
      const entry = await createFinancialEntry(project.id, {
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
      });
      setEntries((prev) => [
        {
          ...entry,
          amount: Number(entry.amount),
          date: entry.date.toISOString(),
          createdAt: entry.createdAt.toISOString(),
        },
        ...prev,
      ]);
      setForm({ type: "ADDITION", description: "", amount: "", date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast.success("Entry added.");
    } catch {
      toast.error("Failed to add entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await deleteFinancialEntry(project.id, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Contract Amount", value: totals.contractAmount, color: "" },
          { label: "Additions", value: totals.additions, color: "text-green-600 dark:text-green-400" },
          { label: "Subtractions", value: totals.subtractions, color: "text-red-600 dark:text-red-400" },
          { label: "Remaining Balance", value: totals.remaining, color: totals.remaining >= 0 ? "text-primary" : "text-destructive" },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{card.label}</p>
            <p className={`text-sm font-semibold tabular ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Entry
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Financial Entry</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <div className="flex gap-2">
                {(["ADDITION", "SUBTRACTION"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === "ADDITION"
                          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    {t === "ADDITION" ? "+ Addition" : "− Subtraction"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fdate">Date</Label>
              <Input
                id="fdate"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="fdesc">Description</Label>
            <Input
              id="fdesc"
              placeholder="e.g. Change order #1 – additional excavation"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="famount">Amount (₱)</Label>
            <Input
              id="famount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Entry"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Entries table */}
      {entries.length > 0 && (
        <div className="rounded-md border border-border bg-surface overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5 text-sm">{entry.description}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${entry.type === "ADDITION" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {entry.type === "ADDITION" ? "+ Addition" : "− Subtraction"}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right text-sm font-medium tabular ${entry.type === "ADDITION" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {entry.type === "SUBTRACTION" ? "−" : "+"}{formatCurrency(entry.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(entry.id)}
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

      {entries.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No financial entries yet. Add an addition or subtraction to track changes to the contract amount.
        </div>
      )}
    </div>
  );
}
