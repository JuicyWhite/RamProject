"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createDelivery, deleteDelivery } from "@/actions/deliveries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, PackageCheck } from "lucide-react";

interface Delivery {
  id: string;
  supplier: string;
  material: string;
  quantity: string | number;
  unit: string | null;
  deliveryDate: string;
  receivedBy: string | null;
  drNumber: string | null;
  notes: string | null;
}

export function DeliveriesShell({
  projectId,
  initialDeliveries,
}: {
  projectId: string;
  initialDeliveries: Delivery[];
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier: "",
    material: "",
    quantity: "",
    unit: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    receivedBy: "",
    drNumber: "",
    notes: "",
  });

  const uniqueSuppliers = new Set(deliveries.map((d) => d.supplier)).size;
  const uniqueMaterials = new Set(deliveries.map((d) => d.material)).size;

  async function handleCreate() {
    if (!form.supplier.trim()) { toast.error("Supplier is required."); return; }
    if (!form.material.trim()) { toast.error("Material is required."); return; }
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) {
      toast.error("A valid quantity is required.");
      return;
    }
    setSaving(true);
    try {
      const d = await createDelivery(projectId, {
        supplier: form.supplier,
        material: form.material,
        quantity: Number(form.quantity),
        unit: form.unit || null,
        deliveryDate: form.deliveryDate,
        receivedBy: form.receivedBy || null,
        drNumber: form.drNumber || null,
        notes: form.notes || null,
      });
      const serialized: Delivery = {
        ...d,
        quantity: Number(d.quantity),
        deliveryDate: d.deliveryDate instanceof Date ? d.deliveryDate.toISOString() : String(d.deliveryDate),
      };
      setDeliveries((prev) => [serialized, ...prev]);
      setForm({
        supplier: "", material: "", quantity: "", unit: "",
        deliveryDate: new Date().toISOString().split("T")[0],
        receivedBy: "", drNumber: "", notes: "",
      });
      setShowForm(false);
      toast.success("Delivery logged.");
    } catch {
      toast.error("Failed to log delivery.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDelivery(projectId, id);
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-surface p-3 space-y-1">
          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Total Deliveries</p>
          <p className="text-xl font-semibold tabular">{deliveries.length}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-3 space-y-1">
          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Unique Suppliers</p>
          <p className="text-xl font-semibold tabular">{uniqueSuppliers}</p>
        </div>
        <div className="rounded-md border border-border bg-surface p-3 space-y-1">
          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Unique Materials</p>
          <p className="text-xl font-semibold tabular">{uniqueMaterials}</p>
        </div>
      </div>

      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Log Delivery
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Log Delivery</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="d-supplier">Supplier <span className="text-destructive">*</span></Label>
              <Input id="d-supplier" placeholder="Supplier name" value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-material">Material <span className="text-destructive">*</span></Label>
              <Input id="d-material" placeholder="Material name" value={form.material}
                onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-qty">Quantity <span className="text-destructive">*</span></Label>
              <Input id="d-qty" type="number" min="0" step="any" placeholder="0" value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-unit">Unit</Label>
              <Input id="d-unit" placeholder="e.g. bags, pcs, m3" value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-date">Delivery Date <span className="text-destructive">*</span></Label>
              <Input id="d-date" type="date" value={form.deliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-dr">DR Number</Label>
              <Input id="d-dr" placeholder="Delivery receipt #" value={form.drNumber}
                onChange={(e) => setForm((f) => ({ ...f, drNumber: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="d-recv">Received By</Label>
              <Input id="d-recv" placeholder="Name of receiver" value={form.receivedBy}
                onChange={(e) => setForm((f) => ({ ...f, receivedBy: e.target.value }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="d-notes">Notes</Label>
              <Textarea id="d-notes" rows={2} placeholder="Additional notes" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Log Delivery"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {deliveries.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No deliveries logged yet.
        </div>
      )}

      {deliveries.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">DR #</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Supplier</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Material</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Quantity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Received By</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d, i) => (
                <tr key={d.id} className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                  <td className="px-3 py-2 text-xs text-muted-foreground tabular whitespace-nowrap">
                    {new Date(d.deliveryDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{d.drNumber ?? "-"}</td>
                  <td className="px-3 py-2 text-sm font-medium">{d.supplier}</td>
                  <td className="px-3 py-2 text-sm">{d.material}</td>
                  <td className="px-3 py-2 text-sm text-right tabular whitespace-nowrap">
                    {Number(d.quantity).toLocaleString()}{d.unit ? ` ${d.unit}` : ""}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{d.receivedBy ?? "-"}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
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
