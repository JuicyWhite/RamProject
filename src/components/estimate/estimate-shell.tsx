"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { Project, RateItem, WbsItem, WbsVariable, EstimateLineItem } from "@prisma/client";
import type { WbsItemWithChildren } from "@/types";
import { computeEstimateTotals } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { createWbsItem, deleteWbsItem, reorderWbsItems } from "@/actions/wbs";
import { addEstimateLineItem, deleteEstimateLineItem } from "@/actions/rates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WbsTree } from "./wbs-tree";
import { TotalsBar } from "./totals-bar";
import { Plus, Download, FileText, Sheet } from "lucide-react";

type RawWbsItem = WbsItem & {
  variables: WbsVariable[];
  lineItems: (EstimateLineItem & { rateItem: RateItem })[];
};

interface EstimateShellProps {
  project: Project & { rateOverrides: { rateItemId: string; unitRate: string | number }[] };
  initialWbsItems: RawWbsItem[];
  rateItems: RateItem[];
}

function buildTree(
  items: RawWbsItem[],
  parentId: string | null = null
): WbsItemWithChildren[] {
  return items
    .filter((i) => i.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => ({
      ...(i as unknown as WbsItemWithChildren),
      children: buildTree(items, i.id),
    }));
}

export function EstimateShell({
  project,
  initialWbsItems,
  rateItems,
}: EstimateShellProps) {
  const [items, setItems] = useState<RawWbsItem[]>(initialWbsItems);
  const [isPending, startTransition] = useTransition();

  const rateOverrideMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of project.rateOverrides) {
      map.set(o.rateItemId, Number(o.unitRate));
    }
    return map;
  }, [project.rateOverrides]);

  const tree = useMemo(() => buildTree(items), [items]);

  const totals = useMemo(
    () =>
      computeEstimateTotals(
        tree,
        Number(project.overheadPct),
        Number(project.profitPct),
        Number(project.vatPct),
        rateOverrideMap
      ),
    [tree, project.overheadPct, project.profitPct, project.vatPct, rateOverrideMap]
  );

  // Optimistic add WBS item
  const handleAddItem = useCallback(
    async (parentId: string | null, isGroup = false) => {
      const tempId = `temp-${Date.now()}`;
      const newItem: RawWbsItem = {
        id: tempId,
        projectId: project.id,
        parentId,
        wbsCode: null,
        description: "New item",
        unit: null,
        formula: null,
        quantity: null,
        remarks: null,
        isGroup,
        isLocked: false,
        sortOrder: items.filter((i) => i.parentId === parentId).length,
        createdAt: new Date(),
        updatedAt: new Date(),
        variables: [],
        lineItems: [],
      };

      setItems((prev) => [...prev, newItem]);

      startTransition(async () => {
        try {
          const created = await createWbsItem({
            projectId: project.id,
            parentId,
            description: isGroup ? "New group" : "New item",
            isGroup,
            sortOrder: newItem.sortOrder,
          });
          setItems((prev) =>
            prev.map((i) =>
              i.id === tempId
                ? { ...created, variables: [], lineItems: [] }
                : i
            )
          );
        } catch (e) {
          toast.error((e as Error).message);
          setItems((prev) => prev.filter((i) => i.id !== tempId));
        }
      });
    },
    [items, project.id]
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      const toDelete = new Set<string>();
      function collectDescendants(itemId: string) {
        toDelete.add(itemId);
        items
          .filter((i) => i.parentId === itemId)
          .forEach((child) => collectDescendants(child.id));
      }
      collectDescendants(id);

      setItems((prev) => prev.filter((i) => !toDelete.has(i.id)));

      startTransition(async () => {
        try {
          await deleteWbsItem(id, project.id);
        } catch (e) {
          toast.error((e as Error).message);
        }
      });
    },
    [items, project.id]
  );

  const handleUpdateItem = useCallback((updated: RawWbsItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleAddLineItem = useCallback(
    async (wbsItemId: string, rateItemId: string) => {
      try {
        const created = await addEstimateLineItem({ wbsItemId, rateItemId });
        const rateItem = rateItems.find((r) => r.id === rateItemId)!;
        setItems((prev) =>
          prev.map((i) =>
            i.id === wbsItemId
              ? {
                  ...i,
                  lineItems: [
                    ...i.lineItems,
                    { ...created, rateItem },
                  ],
                }
              : i
          )
        );
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    [rateItems]
  );

  const handleDeleteLineItem = useCallback(
    async (wbsItemId: string, lineItemId: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === wbsItemId
            ? { ...i, lineItems: i.lineItems.filter((li) => li.id !== lineItemId) }
            : i
        )
      );
      try {
        await deleteEstimateLineItem(lineItemId);
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
    []
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAddItem(null, false)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add Item
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddItem(null, true)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add Group
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  const { exportEstimateToPdf } = await import("@/lib/export/pdf");
                  await exportEstimateToPdf(project as never, tree, totals, rateOverrideMap);
                } catch {
                  toast.error("Failed to export PDF.");
                }
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                try {
                  const { exportEstimateToXlsx } = await import("@/lib/export/xlsx");
                  await exportEstimateToXlsx(project as never, tree, totals, rateOverrideMap);
                } catch {
                  toast.error("Failed to export XLSX.");
                }
              }}
            >
              <Sheet className="h-3.5 w-3.5 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <WbsTree
          items={tree}
          rateItems={rateItems}
          rateOverrides={rateOverrideMap}
          projectId={project.id}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
          onAddLineItem={handleAddLineItem}
          onDeleteLineItem={handleDeleteLineItem}
        />
      </div>

      {/* Totals */}
      <TotalsBar totals={totals} />
    </div>
  );
}
