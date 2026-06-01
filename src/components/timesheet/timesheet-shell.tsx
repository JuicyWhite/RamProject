"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { logHours, deleteTimesheetEntry } from "@/actions/timesheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  role: string | null;
  dailyRate: number | null;
  isActive: boolean;
}

interface Entry {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  hoursWorked: number;
  overtime: number;
  notes: string | null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatWeekLabel(monday: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(monday);
}

export function TimesheetShell({
  projectId,
  workers,
  initialEntries,
}: {
  projectId: string;
  workers: Worker[];
  initialEntries: Entry[];
}) {
  const activeWorkers = workers.filter((w) => w.isActive);

  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [selected, setSelected] = useState<{ workerId: string; date: string } | null>(null);
  const [form, setForm] = useState({ hoursWorked: "8", overtime: "0", notes: "" });
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of entries) {
      map.set(`${e.workerId}|${e.date.slice(0, 10)}`, e);
    }
    return map;
  }, [entries]);

  function getEntry(workerId: string, date: Date): Entry | undefined {
    return entryMap.get(`${workerId}|${toDateString(date)}`);
  }

  function handleCellClick(workerId: string, date: Date) {
    const dateStr = toDateString(date);
    const existing = entryMap.get(`${workerId}|${dateStr}`);
    setSelected({ workerId, date: dateStr });
    setForm({
      hoursWorked: existing ? String(existing.hoursWorked) : "8",
      overtime: existing ? String(existing.overtime) : "0",
      notes: existing?.notes ?? "",
    });
  }

  async function handleSave() {
    if (!selected) return;
    const hw = parseFloat(form.hoursWorked);
    const ot = parseFloat(form.overtime);
    if (isNaN(hw) || hw < 0 || hw > 24) {
      toast.error("Hours worked must be between 0 and 24.");
      return;
    }
    if (isNaN(ot) || ot < 0 || ot > 12) {
      toast.error("Overtime must be between 0 and 12.");
      return;
    }
    setSaving(true);
    try {
      const result = await logHours(projectId, {
        workerId: selected.workerId,
        date: selected.date,
        hoursWorked: hw,
        overtime: ot,
        notes: form.notes || null,
      });
      const worker = activeWorkers.find((w) => w.id === selected.workerId);
      const newEntry: Entry = {
        id: result.id,
        workerId: selected.workerId,
        workerName: worker?.name ?? "",
        date: result.date.toISOString(),
        hoursWorked: Number(result.hoursWorked),
        overtime: Number(result.overtime),
        notes: result.notes ?? null,
      };
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.workerId === selected.workerId && e.date.slice(0, 10) === selected.date)
        );
        return [...filtered, newEntry];
      });
      setSelected(null);
      toast.success("Hours logged.");
    } catch {
      toast.error("Failed to log hours.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: Entry) {
    try {
      await deleteTimesheetEntry(projectId, entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      if (
        selected?.workerId === entry.workerId &&
        selected?.date === entry.date.slice(0, 10)
      ) {
        setSelected(null);
      }
      toast.success("Entry deleted.");
    } catch {
      toast.error("Failed to delete entry.");
    }
  }

  const payrollRows = useMemo(() => {
    return activeWorkers.map((worker) => {
      const workerEntries = entries.filter((e) => e.workerId === worker.id);
      const regHrs = workerEntries.reduce((s, e) => s + e.hoursWorked, 0);
      const otHrs = workerEntries.reduce((s, e) => s + e.overtime, 0);
      let grossPay: number | null = null;
      if (worker.dailyRate !== null) {
        const hourlyRate = worker.dailyRate / 8;
        const regPay = regHrs * hourlyRate;
        const otPay = otHrs * hourlyRate * 1.25;
        grossPay = regPay + otPay;
      }
      return { worker, regHrs, otHrs, grossPay };
    });
  }, [activeWorkers, entries]);

  const payrollTotal = useMemo(() => {
    const regHrs = payrollRows.reduce((s, r) => s + r.regHrs, 0);
    const otHrs = payrollRows.reduce((s, r) => s + r.otHrs, 0);
    const grossPay = payrollRows.every((r) => r.grossPay !== null)
      ? payrollRows.reduce((s, r) => s + (r.grossPay ?? 0), 0)
      : null;
    return { regHrs, otHrs, grossPay };
  }, [payrollRows]);

  const selectedWorker = selected
    ? activeWorkers.find((w) => w.id === selected.workerId)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          className="rounded-md border border-border p-1.5 hover:bg-muted/40 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          Week of {formatWeekLabel(weekStart)}
        </span>
        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          className="rounded-md border border-border p-1.5 hover:bg-muted/40 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {activeWorkers.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No active workers. Add workers in the Workers &amp; Roster section first.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground min-w-[140px]">
                  Worker
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={i}
                    className="px-2 py-2.5 text-center text-xs font-medium text-muted-foreground min-w-[52px]"
                  >
                    <div>{DAY_LABELS[i]}</div>
                    <div className="text-2xs text-muted-foreground/70 font-normal">
                      {date.getDate()}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Reg Hrs
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                  OT Hrs
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Gross Pay
                </th>
              </tr>
            </thead>
            <tbody>
              {activeWorkers.map((worker) => {
                const row = payrollRows.find((r) => r.worker.id === worker.id);
                return (
                  <tr
                    key={worker.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium">{worker.name}</div>
                      {worker.role && (
                        <div className="text-xs text-muted-foreground">{worker.role}</div>
                      )}
                    </td>
                    {weekDates.map((date, i) => {
                      const entry = getEntry(worker.id, date);
                      const dateStr = toDateString(date);
                      const isSelected =
                        selected?.workerId === worker.id && selected?.date === dateStr;
                      return (
                        <td key={i} className="px-1 py-1.5 text-center">
                          <button
                            onClick={() => handleCellClick(worker.id, date)}
                            className={`w-full rounded px-1 py-1 text-xs transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold"
                                : entry
                                ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                                : "text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            {entry ? entry.hoursWorked : "—"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right text-sm tabular">
                      {row ? row.regHrs.toFixed(1) : "0.0"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm tabular">
                      {row ? row.otHrs.toFixed(1) : "0.0"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-sm tabular">
                      {row?.grossPay !== null && row?.grossPay !== undefined
                        ? formatCurrency(row.grossPay)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && selectedWorker && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3 max-w-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Log Hours — {selectedWorker.name}
            </h2>
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date(selected.date + "T00:00:00"))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="hw">Regular Hours</Label>
              <Input
                id="hw"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={form.hoursWorked}
                onChange={(e) => setForm((f) => ({ ...f, hoursWorked: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ot">Overtime Hours</Label>
              <Input
                id="ot"
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={form.overtime}
                onChange={(e) => setForm((f) => ({ ...f, overtime: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Optional notes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Cancel
            </Button>
            {(() => {
              const existingEntry = selected
                ? entryMap.get(`${selected.workerId}|${selected.date}`)
                : undefined;
              return existingEntry ? (
                <button
                  onClick={() => handleDelete(existingEntry)}
                  className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {activeWorkers.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Payroll Summary</h2>
          <div className="rounded-md border border-border bg-surface overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Worker
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Reg Hrs
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    OT Hrs
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Daily Rate
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Gross Pay
                  </th>
                </tr>
              </thead>
              <tbody>
                {payrollRows.map(({ worker, regHrs, otHrs, grossPay }) => (
                  <tr
                    key={worker.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium">{worker.name}</div>
                      {worker.role && (
                        <div className="text-xs text-muted-foreground">{worker.role}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm tabular">
                      {regHrs.toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm tabular">
                      {otHrs.toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm tabular text-muted-foreground">
                      {worker.dailyRate !== null
                        ? formatCurrency(worker.dailyRate)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-medium tabular">
                      {grossPay !== null ? formatCurrency(grossPay) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/40">
                  <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold tabular">
                    {payrollTotal.regHrs.toFixed(1)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold tabular">
                    {payrollTotal.otHrs.toFixed(1)}
                  </td>
                  <td />
                  <td className="px-4 py-2.5 text-right text-sm font-semibold tabular">
                    {payrollTotal.grossPay !== null
                      ? formatCurrency(payrollTotal.grossPay)
                      : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
