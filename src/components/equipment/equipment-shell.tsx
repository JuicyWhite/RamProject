"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  createEquipment,
  updateEquipmentStatus,
  deleteEquipment,
  logEquipmentUsage,
  deleteEquipmentLog,
} from "@/actions/equipment";
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
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface EquipmentLog {
  id: string;
  date: string;
  hoursUsed: number | null;
  fuelConsumed: number | null;
  operator: string | null;
  notes: string | null;
}

interface EquipmentItem {
  id: string;
  name: string;
  type: string | null;
  plateOrSerial: string | null;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";
  dailyRate: number | null;
  fuelType: string | null;
  lastMaintenanceDate: string | null;
  notes: string | null;
  logs: EquipmentLog[];
}

type StatusFilter = "ALL" | "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED";

const statusLabel: Record<EquipmentItem["status"], string> = {
  AVAILABLE: "Available",
  IN_USE: "In Use",
  MAINTENANCE: "Maintenance",
  RETIRED: "Retired",
};

const statusBadgeClass: Record<EquipmentItem["status"], string> = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  IN_USE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  MAINTENANCE: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  RETIRED: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
];

const emptyAddForm = {
  name: "",
  type: "",
  plateOrSerial: "",
  status: "AVAILABLE" as EquipmentItem["status"],
  dailyRate: "",
  fuelType: "",
  notes: "",
};

const emptyLogForm = {
  date: new Date().toISOString().split("T")[0],
  hoursUsed: "",
  fuelConsumed: "",
  operator: "",
  notes: "",
};

export function EquipmentShell({
  initialEquipment,
}: {
  initialEquipment: EquipmentItem[];
}) {
  const [equipment, setEquipment] = useState<EquipmentItem[]>(initialEquipment);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logForms, setLogForms] = useState<Record<string, typeof emptyLogForm>>({});
  const [logSaving, setLogSaving] = useState<Record<string, boolean>>({});
  const [showLogForm, setShowLogForm] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => {
    return {
      total: equipment.length,
      available: equipment.filter((e) => e.status === "AVAILABLE").length,
      inUse: equipment.filter((e) => e.status === "IN_USE").length,
      maintenance: equipment.filter((e) => e.status === "MAINTENANCE").length,
    };
  }, [equipment]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return equipment;
    return equipment.filter((e) => e.status === filter);
  }, [equipment, filter]);

  function getLogForm(id: string) {
    return logForms[id] ?? { ...emptyLogForm };
  }

  function setLogFormField(
    id: string,
    field: keyof typeof emptyLogForm,
    value: string
  ) {
    setLogForms((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { ...emptyLogForm }), [field]: value },
    }));
  }

  async function handleAddEquipment() {
    if (!addForm.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setAddSaving(true);
    try {
      const created = await createEquipment({
        name: addForm.name.trim(),
        type: addForm.type.trim() || null,
        plateOrSerial: addForm.plateOrSerial.trim() || null,
        status: addForm.status,
        dailyRate: addForm.dailyRate ? Number(addForm.dailyRate) : null,
        fuelType: addForm.fuelType.trim() || null,
        notes: addForm.notes.trim() || null,
      });
      setEquipment((prev) => [
        {
          id: created.id,
          name: created.name,
          type: created.type,
          plateOrSerial: created.plateOrSerial,
          status: created.status as EquipmentItem["status"],
          dailyRate: created.dailyRate != null ? Number(created.dailyRate) : null,
          fuelType: created.fuelType,
          lastMaintenanceDate: created.lastMaintenanceDate
            ? new Date(created.lastMaintenanceDate).toISOString()
            : null,
          notes: created.notes,
          logs: [],
        },
        ...prev,
      ]);
      setAddForm(emptyAddForm);
      setShowAddForm(false);
      toast.success("Equipment added.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAddSaving(false);
    }
  }

  async function handleStatusChange(
    id: string,
    status: EquipmentItem["status"]
  ) {
    setEquipment((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
    try {
      await updateEquipmentStatus(id, status);
      toast.success("Status updated.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    try {
      await deleteEquipment(id);
      toast.success("Equipment deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleLogUsage(equipmentId: string) {
    const form = getLogForm(equipmentId);
    if (!form.date) {
      toast.error("Date is required.");
      return;
    }
    setLogSaving((prev) => ({ ...prev, [equipmentId]: true }));
    try {
      const log = await logEquipmentUsage(equipmentId, {
        date: form.date,
        hoursUsed: form.hoursUsed ? Number(form.hoursUsed) : null,
        fuelConsumed: form.fuelConsumed ? Number(form.fuelConsumed) : null,
        operator: form.operator.trim() || null,
        notes: form.notes.trim() || null,
      });
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === equipmentId
            ? {
                ...e,
                logs: [
                  {
                    id: log.id,
                    date: new Date(log.date).toISOString(),
                    hoursUsed: log.hoursUsed != null ? Number(log.hoursUsed) : null,
                    fuelConsumed:
                      log.fuelConsumed != null ? Number(log.fuelConsumed) : null,
                    operator: log.operator,
                    notes: log.notes,
                  },
                  ...e.logs,
                ],
              }
            : e
        )
      );
      setLogForms((prev) => ({ ...prev, [equipmentId]: { ...emptyLogForm } }));
      setShowLogForm((prev) => ({ ...prev, [equipmentId]: false }));
      toast.success("Usage logged.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLogSaving((prev) => ({ ...prev, [equipmentId]: false }));
    }
  }

  async function handleDeleteLog(equipmentId: string, logId: string) {
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === equipmentId
          ? { ...e, logs: e.logs.filter((l) => l.id !== logId) }
          : e
      )
    );
    try {
      await deleteEquipmentLog(equipmentId, logId);
      toast.success("Log deleted.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total },
          { label: "Available", value: counts.available },
          { label: "In Use", value: counts.inUse },
          { label: "In Maintenance", value: counts.maintenance },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-md border border-border bg-surface p-3 space-y-1"
          >
            <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="text-xl font-semibold tabular">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {!showAddForm && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Equipment
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Equipment</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="eq-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="eq-name"
                placeholder="e.g. Backhoe Loader"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eq-type">Type</Label>
              <Input
                id="eq-type"
                placeholder="e.g. Excavator"
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, type: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eq-plate">Plate / Serial No.</Label>
              <Input
                id="eq-plate"
                placeholder="e.g. ABC-1234"
                value={addForm.plateOrSerial}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, plateOrSerial: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eq-status">Status</Label>
              <Select
                value={addForm.status}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    status: v as EquipmentItem["status"],
                  }))
                }
              >
                <SelectTrigger id="eq-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="eq-rate">Daily Rate (₱)</Label>
              <Input
                id="eq-rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={addForm.dailyRate}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, dailyRate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eq-fuel">Fuel Type</Label>
              <Input
                id="eq-fuel"
                placeholder="e.g. Diesel"
                value={addForm.fuelType}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, fuelType: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="eq-notes">Notes</Label>
              <Textarea
                id="eq-notes"
                rows={2}
                placeholder="Any additional notes"
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddEquipment} disabled={addSaving}>
              {addSaving ? "Saving…" : "Add Equipment"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setAddForm(emptyAddForm);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {equipment.length === 0
            ? "No equipment yet. Add your first item."
            : "No equipment matches this filter."}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const lf = getLogForm(item.id);
            const showLf = showLogForm[item.id] ?? false;
            const lSaving = logSaving[item.id] ?? false;

            return (
              <div
                key={item.id}
                className="rounded-md border border-border bg-surface overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() =>
                    setExpandedId((prev) =>
                      prev === item.id ? null : item.id
                    )
                  }
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 gap-0.5 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3 sm:items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {item.name}
                      </span>
                      {item.type && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.type}
                        </span>
                      )}
                    </div>
                    {item.plateOrSerial && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {item.plateOrSerial}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium w-fit ${statusBadgeClass[item.status]}`}
                    >
                      {statusLabel[item.status]}
                    </span>
                    {item.dailyRate != null && (
                      <span className="text-xs text-muted-foreground tabular">
                        {formatCurrency(item.dailyRate)}/day
                      </span>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        handleStatusChange(item.id, v as EquipmentItem["status"])
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="IN_USE">In Use</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10">
                    {item.logs.length > 0 && (
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/40">
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                                Date
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                                Hours
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                                Fuel (L)
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                                Operator
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                                Notes
                              </th>
                              <th className="w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {item.logs.map((log) => (
                              <tr
                                key={log.id}
                                className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                              >
                                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(log.date).toLocaleDateString(
                                    "en-PH",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-right tabular">
                                  {log.hoursUsed != null
                                    ? log.hoursUsed
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-xs text-right tabular">
                                  {log.fuelConsumed != null
                                    ? log.fuelConsumed
                                    : "—"}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                                  {log.operator ?? "—"}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate">
                                  {log.notes ?? "—"}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() =>
                                      handleDeleteLog(item.id, log.id)
                                    }
                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                    aria-label="Delete log"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {item.logs.length === 0 && !showLf && (
                      <p className="text-xs text-muted-foreground">
                        No usage logs yet.
                      </p>
                    )}

                    {!showLf && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowLogForm((prev) => ({
                            ...prev,
                            [item.id]: true,
                          }))
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Log Usage
                      </Button>
                    )}

                    {showLf && (
                      <div className="rounded-md border border-border p-3 space-y-3 bg-surface">
                        <p className="text-xs font-semibold">Log Usage</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`ldate-${item.id}`}>
                              Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`ldate-${item.id}`}
                              type="date"
                              value={lf.date}
                              onChange={(e) =>
                                setLogFormField(
                                  item.id,
                                  "date",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lhours-${item.id}`}>
                              Hours Used
                            </Label>
                            <Input
                              id={`lhours-${item.id}`}
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              value={lf.hoursUsed}
                              onChange={(e) =>
                                setLogFormField(
                                  item.id,
                                  "hoursUsed",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lfuel-${item.id}`}>
                              Fuel Consumed (L)
                            </Label>
                            <Input
                              id={`lfuel-${item.id}`}
                              type="number"
                              min="0"
                              step="0.1"
                              placeholder="0"
                              value={lf.fuelConsumed}
                              onChange={(e) =>
                                setLogFormField(
                                  item.id,
                                  "fuelConsumed",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`lop-${item.id}`}>Operator</Label>
                            <Input
                              id={`lop-${item.id}`}
                              placeholder="Operator name"
                              value={lf.operator}
                              onChange={(e) =>
                                setLogFormField(
                                  item.id,
                                  "operator",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor={`lnotes-${item.id}`}>Notes</Label>
                            <Input
                              id={`lnotes-${item.id}`}
                              placeholder="Any remarks"
                              value={lf.notes}
                              onChange={(e) =>
                                setLogFormField(
                                  item.id,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLogUsage(item.id)}
                            disabled={lSaving}
                          >
                            {lSaving ? "Saving…" : "Save Log"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowLogForm((prev) => ({
                                ...prev,
                                [item.id]: false,
                              }));
                              setLogForms((prev) => ({
                                ...prev,
                                [item.id]: { ...emptyLogForm },
                              }));
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
