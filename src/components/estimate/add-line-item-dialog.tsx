"use client";

import { useState, useMemo } from "react";
import type { RateItem } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Search } from "lucide-react";

interface AddLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  rateItems: RateItem[];
  onAdd: (rateItemId: string) => void;
}

const categoryLabel: Record<string, string> = {
  LABOR: "Labor",
  MATERIAL: "Material",
  EQUIPMENT: "Equipment",
  SUBCONTRACT: "Subcontract",
  OTHER: "Other",
};

export function AddLineItemDialog({
  open,
  onClose,
  rateItems,
  onAdd,
}: AddLineItemDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rateItems;
    return rateItems.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [rateItems, search]);

  function handleAdd() {
    if (!selected) return;
    onAdd(selected);
    setSelected(null);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Cost Line</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search rates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border border-border">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No rates match your search.
            </p>
          ) : (
            <table className="w-full" aria-label="Rate items">
              <thead>
                <tr className="border-b border-border bg-muted/40 sticky top-0">
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground tabular">
                    Unit Rate
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-12">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    role="option"
                    aria-selected={selected === r.id}
                    onClick={() => setSelected(r.id)}
                    onDoubleClick={() => {
                      setSelected(r.id);
                      onAdd(r.id);
                      onClose();
                    }}
                    className={`border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
                      selected === r.id
                        ? "bg-accent"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-3 py-2 text-sm">
                      {r.description}
                      {r.code && (
                        <span className="ml-1 text-2xs text-muted-foreground">
                          [{r.code}]
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-2xs text-muted-foreground">
                        {categoryLabel[r.category] ?? r.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular">
                      {formatCurrency(Number(r.unitRate))}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected}>
            Add Line
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
