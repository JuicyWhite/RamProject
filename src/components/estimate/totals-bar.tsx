"use client";

import { formatCurrency } from "@/lib/utils";
import type { EstimateTotals } from "@/types";

interface TotalsBarProps {
  totals: EstimateTotals;
}

export function TotalsBar({ totals }: TotalsBarProps) {
  const rows = [
    { label: "Direct Cost", value: totals.directCost },
    { label: "Overhead", value: totals.overhead },
    { label: "Profit", value: totals.profit },
    { label: "VAT (12%)", value: totals.vat },
  ];

  return (
    <div
      className="border-t border-border bg-surface px-4 py-2.5 flex items-center gap-6 overflow-x-auto shrink-0"
      aria-label="Estimate totals"
      role="status"
      aria-live="polite"
    >
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col items-end shrink-0">
          <span className="text-2xs text-muted-foreground uppercase tracking-wide">
            {row.label}
          </span>
          <span className="text-sm font-medium tabular">
            {formatCurrency(row.value)}
          </span>
        </div>
      ))}

      <div className="ml-auto flex flex-col items-end shrink-0 border-l border-border pl-6">
        <span className="text-2xs text-muted-foreground uppercase tracking-wide font-semibold">
          Grand Total
        </span>
        <span className="text-base font-semibold tabular text-primary">
          {formatCurrency(totals.grandTotal)}
        </span>
      </div>
    </div>
  );
}
