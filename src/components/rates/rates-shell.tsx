"use client";

import { useState, useMemo, useTransition } from "react";
import type { RateItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  createRateItem,
  updateRateItem,
  deleteRateItem,
} from "@/actions/rates";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateRateItemSchema } from "@/validations/rate";
import type { CreateRateItemInput } from "@/validations/rate";
import type { RateCategory } from "@prisma/client";

const categoryLabel: Record<RateCategory, string> = {
  LABOR: "Labor",
  MATERIAL: "Material",
  EQUIPMENT: "Equipment",
  SUBCONTRACT: "Subcontract",
  OTHER: "Other",
};

const categoryVariant: Record<RateCategory, string> = {
  LABOR: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  MATERIAL: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  EQUIPMENT: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  SUBCONTRACT: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  OTHER: "bg-neutral-100 text-neutral-500",
};

interface RatesShellProps {
  initialItems: RateItem[];
}

export function RatesShell({ initialItems }: RatesShellProps) {
  const [items, setItems] = useState<RateItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RateItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      const matchSearch =
        !q ||
        r.description.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q);
      const matchCat = filterCat === "ALL" || r.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [items, search, filterCat]);

  function openCreate() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: RateItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      try {
        await deleteRateItem(id);
        toast.success("Rate item deleted");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  async function handleSave(data: CreateRateItemInput, id?: string) {
    try {
      if (id) {
        const updated = await updateRateItem(id, data);
        setItems((prev) => prev.map((r) => (r.id === id ? updated : r)));
        toast.success("Rate updated");
      } else {
        const created = await createRateItem(data);
        setItems((prev) => [created, ...prev]);
        toast.success("Rate created");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Search rates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search rate library"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {(Object.keys(categoryLabel) as RateCategory[]).map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add Rate
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No rates yet. Add your first rate item."
              : "No results for your search."}
          </div>
        ) : (
          <table className="w-full" aria-label="Rate library">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Description
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Code
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Category
                </th>
                <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tabular">
                  Unit Rate (₱)
                </th>
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-14">
                  Unit
                </th>
                <th scope="col" className="w-20 px-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-4 py-2.5 text-sm">
                    {r.description}
                    {!r.isActive && (
                      <span className="ml-2 text-2xs text-muted-foreground">(inactive)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono hidden sm:table-cell">
                    {r.code ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-2xs font-medium rounded px-1.5 py-0.5 ${categoryVariant[r.category]}`}
                    >
                      {categoryLabel[r.category]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm tabular font-medium">
                    {formatCurrency(Number(r.unitRate))}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {r.unit}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${r.description}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(r.id)}
                        aria-label={`Delete ${r.description}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RateItemDialog
        open={dialogOpen}
        item={editItem}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}

function RateItemDialog({
  open,
  item,
  onClose,
  onSave,
}: {
  open: boolean;
  item: RateItem | null;
  onClose: () => void;
  onSave: (data: CreateRateItemInput, id?: string) => Promise<void>;
}) {
  const form = useForm<CreateRateItemInput>({
    resolver: zodResolver(CreateRateItemSchema),
    defaultValues: {
      description: item?.description ?? "",
      code: item?.code ?? "",
      category: item?.category ?? "MATERIAL",
      unit: item?.unit ?? "",
      unitRate: item?.unitRate ? Number(item.unitRate) : 0,
      notes: item?.notes ?? "",
      isActive: item?.isActive ?? true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // reset when switching between create/edit
  useState(() => {
    reset({
      description: item?.description ?? "",
      code: item?.code ?? "",
      category: item?.category ?? "MATERIAL",
      unit: item?.unit ?? "",
      unitRate: item?.unitRate ? Number(item.unitRate) : 0,
      notes: item?.notes ?? "",
      isActive: item?.isActive ?? true,
    });
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Rate" : "Add Rate"}</DialogTitle>
        </DialogHeader>
        <form
          id="rate-form"
          onSubmit={handleSubmit((d) => onSave(d, item?.id))}
          className="space-y-3"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="r-description">Description *</Label>
            <Input
              id="r-description"
              {...register("description")}
              placeholder="e.g. Construction Worker"
              aria-invalid={!!errors.description}
              autoFocus
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-code">Code</Label>
              <Input
                id="r-code"
                {...register("code")}
                placeholder="e.g. LAB-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-category">Category *</Label>
              <Select
                defaultValue={item?.category ?? "MATERIAL"}
                onValueChange={(v) => setValue("category", v as RateCategory)}
              >
                <SelectTrigger id="r-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LABOR">Labor</SelectItem>
                  <SelectItem value="MATERIAL">Material</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                  <SelectItem value="SUBCONTRACT">Subcontract</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-unitRate">Unit Rate (₱) *</Label>
              <Input
                id="r-unitRate"
                type="number"
                step="0.01"
                min="0"
                {...register("unitRate")}
                className="tabular"
                aria-invalid={!!errors.unitRate}
              />
              {errors.unitRate && (
                <p className="text-xs text-destructive">{errors.unitRate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-unit">Unit *</Label>
              <Input
                id="r-unit"
                {...register("unit")}
                placeholder="e.g. day, m2, kg"
                aria-invalid={!!errors.unit}
              />
              {errors.unit && (
                <p className="text-xs text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="rate-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : item ? "Save changes" : "Add rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
