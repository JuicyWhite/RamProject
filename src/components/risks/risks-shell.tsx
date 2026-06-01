"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createRisk, updateRiskStatus, deleteRisk } from "@/actions/risks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ShieldAlert } from "lucide-react";

type RiskProbability = "HIGH" | "MEDIUM" | "LOW";
type RiskImpact = "HIGH" | "MEDIUM" | "LOW";
type RiskStatus = "OPEN" | "MITIGATED" | "CLOSED";

interface Risk {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  probability: RiskProbability;
  impact: RiskImpact;
  mitigation: string | null;
  owner: string | null;
  dueDate: string | null;
  status: RiskStatus;
  createdAt: string;
}

const scoreMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function getRiskScore(probability: RiskProbability, impact: RiskImpact) {
  return scoreMap[probability] * scoreMap[impact];
}

function getScoreLabel(score: number): string {
  if (score === 9) return "Critical";
  if (score === 6) return "High";
  if (score >= 3) return "Medium";
  return "Low";
}

function getScoreBadgeClass(score: number): string {
  if (score === 9) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
  if (score === 6) return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
  if (score >= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
}

function getMatrixCellClass(prob: RiskProbability, impact: RiskImpact): string {
  const score = getRiskScore(prob, impact);
  if (score === 9) return "bg-red-500 dark:bg-red-700";
  if (score === 6) return "bg-orange-400 dark:bg-orange-600";
  if (score >= 3) return "bg-amber-300 dark:bg-amber-600";
  return "bg-green-300 dark:bg-green-700";
}

const statusBadge: Record<RiskStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  MITIGATED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  CLOSED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const statusLabel: Record<RiskStatus, string> = {
  OPEN: "Open",
  MITIGATED: "Mitigated",
  CLOSED: "Closed",
};

type FilterTab = "ALL" | RiskStatus;

const emptyForm = {
  title: "",
  category: "",
  probability: "MEDIUM" as RiskProbability,
  impact: "MEDIUM" as RiskImpact,
  description: "",
  mitigation: "",
  owner: "",
  dueDate: "",
};

const probabilities: RiskProbability[] = ["HIGH", "MEDIUM", "LOW"];
const impacts: RiskImpact[] = ["LOW", "MEDIUM", "HIGH"];

export function RisksShell({
  projectId,
  initialRisks,
}: {
  projectId: string;
  initialRisks: Risk[];
}) {
  const [risks, setRisks] = useState(initialRisks);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [form, setForm] = useState(emptyForm);

  const openRisks = risks.filter((r) => r.status === "OPEN");
  const mitigated = risks.filter((r) => r.status === "MITIGATED");
  const closed = risks.filter((r) => r.status === "CLOSED");
  const critical = risks.filter((r) => getRiskScore(r.probability, r.impact) === 9);

  const filtered =
    filter === "ALL"
      ? risks
      : filter === "OPEN"
      ? openRisks
      : filter === "MITIGATED"
      ? mitigated
      : closed;

  async function handleCreate() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const risk = await createRisk(projectId, {
        title: form.title,
        category: form.category || null,
        probability: form.probability,
        impact: form.impact,
        description: form.description || null,
        mitigation: form.mitigation || null,
        owner: form.owner || null,
        dueDate: form.dueDate || null,
      });
      setRisks((prev) => [
        JSON.parse(JSON.stringify(risk, (_, v) => (v instanceof Date ? v.toISOString() : v))),
        ...prev,
      ]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("Risk added.");
    } catch {
      toast.error("Failed to add risk.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: RiskStatus) {
    try {
      await updateRiskStatus(projectId, id, status);
      setRisks((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRisk(projectId, id);
      setRisks((prev) => prev.filter((r) => r.id !== id));
      toast.success("Risk deleted.");
    } catch {
      toast.error("Failed to delete risk.");
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "MITIGATED", label: "Mitigated" },
    { key: "CLOSED", label: "Closed" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-surface p-4 space-y-3">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Risk Matrix — Open Risks
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 280 }}>
            <thead>
              <tr>
                <th className="w-16 text-left pb-1 text-muted-foreground font-medium" />
                {impacts.map((imp) => (
                  <th key={imp} className="pb-1 text-center text-muted-foreground font-medium px-1">
                    {imp === "HIGH" ? "High" : imp === "MEDIUM" ? "Med" : "Low"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {probabilities.map((prob) => (
                <tr key={prob}>
                  <td className="pr-2 py-0.5 text-muted-foreground font-medium text-right text-xs whitespace-nowrap">
                    {prob === "HIGH" ? "High" : prob === "MEDIUM" ? "Med" : "Low"}
                  </td>
                  {impacts.map((imp) => {
                    const count = openRisks.filter(
                      (r) => r.probability === prob && r.impact === imp
                    ).length;
                    return (
                      <td key={imp} className="p-0.5 text-center">
                        <div
                          className={`rounded flex items-center justify-center h-9 w-full font-semibold text-white text-sm ${getMatrixCellClass(prob, imp)}`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {[
              { label: "Critical", cls: "bg-red-500" },
              { label: "High", cls: "bg-orange-400" },
              { label: "Medium", cls: "bg-amber-300" },
              { label: "Low", cls: "bg-green-300" },
            ].map((item) => (
              <span key={item.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-sm ${item.cls}`} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Risks", count: risks.length, color: "" },
          { label: "Critical", count: critical.length, color: "text-red-600 dark:text-red-400" },
          { label: "Open", count: openRisks.length, color: "text-blue-600 dark:text-blue-400" },
          {
            label: "Mitigated / Closed",
            count: mitigated.length + closed.length,
            color: "text-green-600 dark:text-green-400",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className={`text-xl font-semibold tabular ${card.color}`}>{card.count}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Risk
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Risk</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="risk-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="risk-title"
                placeholder="Briefly describe the risk"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="risk-category">Category</Label>
              <Input
                id="risk-category"
                placeholder="e.g. Schedule, Cost, Safety"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="risk-probability">Probability</Label>
              <Select
                value={form.probability}
                onValueChange={(v) => setForm((f) => ({ ...f, probability: v as RiskProbability }))}
              >
                <SelectTrigger id="risk-probability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="risk-impact">Impact</Label>
              <Select
                value={form.impact}
                onValueChange={(v) => setForm((f) => ({ ...f, impact: v as RiskImpact }))}
              >
                <SelectTrigger id="risk-impact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="risk-owner">Owner</Label>
              <Input
                id="risk-owner"
                placeholder="Responsible person"
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="risk-due">Due Date</Label>
              <Input
                id="risk-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="risk-description">Description</Label>
              <Textarea
                id="risk-description"
                rows={2}
                placeholder="Detailed description of the risk"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="risk-mitigation">Mitigation Plan</Label>
              <Textarea
                id="risk-mitigation"
                rows={2}
                placeholder="Describe steps to reduce or eliminate this risk"
                value={form.mitigation}
                onChange={(e) => setForm((f) => ({ ...f, mitigation: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Add Risk"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {risks.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No risks logged. Add risks to track and mitigate project threats.
        </div>
      )}

      {filtered.length === 0 && risks.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No risks match this filter.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((risk) => {
            const score = getRiskScore(risk.probability, risk.impact);
            const scoreLabel = getScoreLabel(score);
            const scoreBadgeClass = getScoreBadgeClass(score);
            const isClosed = risk.status === "CLOSED";
            return (
              <div
                key={risk.id}
                className={`rounded-md border border-border bg-surface p-3 space-y-2 ${isClosed ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${scoreBadgeClass}`}
                    >
                      {scoreLabel}
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={`text-sm font-medium ${isClosed ? "line-through text-muted-foreground" : ""}`}>
                        {risk.title}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {risk.category && (
                          <span className="text-xs text-muted-foreground">{risk.category}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          P: {risk.probability} / I: {risk.impact}
                        </span>
                        {risk.owner && (
                          <span className="text-xs text-muted-foreground">{risk.owner}</span>
                        )}
                        {risk.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due{" "}
                            {new Date(risk.dueDate).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      {risk.description && (
                        <p className="text-xs text-muted-foreground">{risk.description}</p>
                      )}
                      {risk.mitigation && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Mitigation:</span> {risk.mitigation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={risk.status}
                      onChange={(e) => handleStatusChange(risk.id, e.target.value as RiskStatus)}
                      className={`appearance-none cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium border-0 focus:outline-none focus:ring-1 focus:ring-primary ${statusBadge[risk.status]}`}
                    >
                      {(["OPEN", "MITIGATED", "CLOSED"] as RiskStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(risk.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Delete risk"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
