"use client";

import React, { useState, useCallback } from "react";
import type { RateItem, WbsItem, WbsVariable, EstimateLineItem } from "@prisma/client";
import type { WbsItemWithChildren } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateWbsItem } from "@/actions/wbs";
import { toast } from "sonner";
import { AddLineItemDialog } from "./add-line-item-dialog";

type RawWbsItem = WbsItem & {
  variables: WbsVariable[];
  lineItems: (EstimateLineItem & { rateItem: RateItem })[];
};

interface WbsTreeProps {
  items: WbsItemWithChildren[];
  rateItems: RateItem[];
  rateOverrides: Map<string, number>;
  projectId: string;
  depth?: number;
  onAddItem: (parentId: string | null, isGroup?: boolean) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (item: RawWbsItem) => void;
  onAddLineItem: (wbsItemId: string, rateItemId: string) => void;
  onDeleteLineItem: (wbsItemId: string, lineItemId: string) => void;
}

export function WbsTree({
  items,
  rateItems,
  rateOverrides,
  projectId,
  depth = 0,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onAddLineItem,
  onDeleteLineItem,
}: WbsTreeProps) {
  if (items.length === 0 && depth === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <FolderOpen className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        <div>
          <p className="text-sm font-medium">No scope items yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add items or groups to build your WBS
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => onAddItem(null, true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add First Group
        </Button>
      </div>
    );
  }

  return (
    <table className="w-full min-w-[800px] border-collapse" role="treegrid">
      {depth === 0 && (
        <thead>
          <tr className="bg-muted/40 border-b border-border">
            <th scope="col" className="w-8 px-2" />
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-12">
              #
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Description
            </th>
            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-20">
              Qty
            </th>
            <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-16">
              Unit
            </th>
            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-28 tabular">
              Unit Rate (₱)
            </th>
            <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground w-32 tabular">
              Amount (₱)
            </th>
            <th scope="col" className="w-20 px-2" />
          </tr>
        </thead>
      )}
      <tbody>
        {items.map((item) => (
          <WbsRow
            key={item.id}
            item={item}
            rateItems={rateItems}
            rateOverrides={rateOverrides}
            projectId={projectId}
            depth={depth}
            onAddItem={onAddItem}
            onDeleteItem={onDeleteItem}
            onUpdateItem={onUpdateItem}
            onAddLineItem={onAddLineItem}
            onDeleteLineItem={onDeleteLineItem}
          />
        ))}
      </tbody>
    </table>
  );
}

interface WbsRowProps {
  item: WbsItemWithChildren;
  rateItems: RateItem[];
  rateOverrides: Map<string, number>;
  projectId: string;
  depth: number;
  onAddItem: (parentId: string | null, isGroup?: boolean) => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (item: RawWbsItem) => void;
  onAddLineItem: (wbsItemId: string, rateItemId: string) => void;
  onDeleteLineItem: (wbsItemId: string, lineItemId: string) => void;
}

function WbsRow({
  item,
  rateItems,
  rateOverrides,
  projectId,
  depth,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
  onAddLineItem,
  onDeleteLineItem,
}: WbsRowProps) {
  const [expanded, setExpanded] = useState(true);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(item.description);
  const [addLineItemOpen, setAddLineItemOpen] = useState(false);

  const itemSubtotal = (() => {
    if (item.isGroup) {
      function sumChildren(i: WbsItemWithChildren): number {
        if (i.isGroup) return i.children.reduce((s, c) => s + sumChildren(c), 0);
        const qty = i.quantity ? Number(i.quantity) : 0;
        return i.lineItems.reduce((s, li) => {
          const lineQty = li.quantity != null ? Number(li.quantity) : qty;
          const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
          return s + lineQty * rate;
        }, 0);
      }
      return sumChildren(item);
    }
    const qty = item.quantity ? Number(item.quantity) : 0;
    return item.lineItems.reduce((s, li) => {
      const lineQty = li.quantity != null ? Number(li.quantity) : qty;
      const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
      return s + lineQty * rate;
    }, 0);
  })();

  const hasChildren = item.isGroup && item.children.length > 0;

  async function saveDescription() {
    setEditingDesc(false);
    if (descValue === item.description) return;
    try {
      const updated = await updateWbsItem(item.id, projectId, {
        description: descValue,
      });
      onUpdateItem({ ...updated, variables: item.variables, lineItems: item.lineItems });
    } catch (e) {
      toast.error((e as Error).message);
      setDescValue(item.description);
    }
  }

  const indentPx = depth * 20;

  return (
    <>
      {/* Main row */}
      <tr
        className={cn(
          "border-b border-border/50 group",
          item.isGroup
            ? "bg-muted/20 hover:bg-muted/40"
            : "hover:bg-muted/20"
        )}
        role="row"
        aria-expanded={item.isGroup ? expanded : undefined}
      >
        {/* Drag handle */}
        <td className="w-8 px-1 text-center">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity mx-auto" aria-hidden />
        </td>

        {/* WBS code */}
        <td className="px-3 py-1.5 text-xs text-muted-foreground tabular align-middle">
          {item.wbsCode ?? "—"}
        </td>

        {/* Description */}
        <td
          className="px-3 py-1.5 align-middle"
          style={{ paddingLeft: `${12 + indentPx}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {item.isGroup && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={expanded ? "Collapse group" : "Expand group"}
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            {!item.isGroup && <span className="w-4 shrink-0" aria-hidden />}

            {editingDesc ? (
              <Input
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={saveDescription}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveDescription();
                  if (e.key === "Escape") {
                    setDescValue(item.description);
                    setEditingDesc(false);
                  }
                }}
                className="h-6 text-sm py-0 px-1.5"
                autoFocus
              />
            ) : (
              <button
                className={cn(
                  "text-left text-sm truncate hover:text-primary transition-colors",
                  item.isGroup ? "font-medium" : ""
                )}
                onDoubleClick={() => setEditingDesc(true)}
                title="Double-click to edit"
              >
                {item.description}
              </button>
            )}
          </div>
        </td>

        {/* Quantity */}
        <td className="px-3 py-1.5 text-right text-sm tabular text-muted-foreground align-middle">
          {item.isGroup
            ? null
            : item.quantity != null
            ? formatNumber(Number(item.quantity))
            : "—"}
        </td>

        {/* Unit */}
        <td className="px-3 py-1.5 text-sm text-muted-foreground align-middle">
          {item.unit ?? "—"}
        </td>

        {/* Unit rate — blank for groups */}
        <td className="px-3 py-1.5 text-right text-sm tabular text-muted-foreground align-middle">
          {item.isGroup ? null : item.lineItems.length > 0 ? (
            <span className="text-xs text-muted-foreground/60">composite</span>
          ) : "—"}
        </td>

        {/* Amount */}
        <td className="px-3 py-1.5 text-right text-sm tabular font-medium align-middle">
          {itemSubtotal > 0 ? formatCurrency(itemSubtotal) : <span className="text-muted-foreground font-normal">—</span>}
        </td>

        {/* Actions */}
        <td className="px-2 py-1.5 align-middle">
          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.isGroup && (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onAddItem(item.id, false)}
                  title="Add sub-item"
                  aria-label="Add sub-item"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
            {!item.isGroup && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setAddLineItemOpen(true)}
                title="Add rate line"
                aria-label="Add cost line"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDeleteItem(item.id)}
              title="Delete"
              aria-label={`Delete ${item.description}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Line items (cost rows) */}
      {!item.isGroup &&
        item.lineItems.map((li) => {
          const qty = li.quantity != null ? Number(li.quantity) : Number(item.quantity ?? 0);
          const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
          const amount = qty * rate;
          return (
            <tr
              key={li.id}
              className="border-b border-border/30 bg-muted/5 group/li text-xs"
            >
              <td />
              <td />
              <td
                className="px-3 py-1 text-muted-foreground"
                style={{ paddingLeft: `${36 + indentPx}px` }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn(
                    "text-2xs font-medium uppercase tracking-wide rounded px-1 py-0.5",
                    li.rateItem.category === "LABOR" && "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
                    li.rateItem.category === "MATERIAL" && "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
                    li.rateItem.category === "EQUIPMENT" && "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
                    li.rateItem.category === "SUBCONTRACT" && "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
                    li.rateItem.category === "OTHER" && "bg-neutral-100 text-neutral-500",
                  )}>
                    {li.rateItem.category.slice(0, 3)}
                  </span>
                  {li.rateItem.description}
                  {li.rateItem.code && (
                    <span className="text-muted-foreground/60">[{li.rateItem.code}]</span>
                  )}
                </span>
              </td>
              <td className="px-3 py-1 text-right tabular text-muted-foreground">
                {formatNumber(qty)}
              </td>
              <td className="px-3 py-1 text-muted-foreground">
                {li.rateItem.unit}
              </td>
              <td className="px-3 py-1 text-right tabular text-muted-foreground">
                {formatCurrency(rate)}
              </td>
              <td className="px-3 py-1 text-right tabular font-medium">
                {formatCurrency(amount)}
              </td>
              <td className="px-2 py-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive opacity-0 group-hover/li:opacity-100 transition-opacity"
                  onClick={() => onDeleteLineItem(item.id, li.id)}
                  aria-label={`Remove ${li.rateItem.description}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </td>
            </tr>
          );
        })}

      {/* Children */}
      {item.isGroup && expanded && item.children.length > 0 && (
        <WbsTreeRows
          items={item.children}
          rateItems={rateItems}
          rateOverrides={rateOverrides}
          projectId={projectId}
          depth={depth + 1}
          onAddItem={onAddItem}
          onDeleteItem={onDeleteItem}
          onUpdateItem={onUpdateItem}
          onAddLineItem={onAddLineItem}
          onDeleteLineItem={onDeleteLineItem}
        />
      )}

      {addLineItemOpen && (
        <AddLineItemDialog
          open={addLineItemOpen}
          onClose={() => setAddLineItemOpen(false)}
          rateItems={rateItems}
          onAdd={(rateItemId) => {
            onAddLineItem(item.id, rateItemId);
            setAddLineItemOpen(false);
          }}
        />
      )}
    </>
  );
}

// Flat <tr> rows — can't nest <tbody> inside <tbody>
function WbsTreeRows(props: WbsTreeProps) {
  return (
    <>
      {props.items.map((item) => (
        <WbsRow key={item.id} item={item} {...props} depth={props.depth ?? 0} />
      ))}
    </>
  );
}
