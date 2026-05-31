import type {
  Project,
  WbsItem,
  WbsVariable,
  RateItem,
  EstimateLineItem,
  ProjectRateOverride,
  OrgMembership,
  User,
  Organization,
  OrgRole,
  ProjectStatus,
  RateCategory,
  ContractType,
} from "@prisma/client";

export type {
  Project,
  WbsItem,
  WbsVariable,
  RateItem,
  EstimateLineItem,
  ProjectRateOverride,
  OrgMembership,
  User,
  Organization,
  OrgRole,
  ProjectStatus,
  RateCategory,
  ContractType,
};

// Enriched types used in the client
export type WbsItemWithChildren = WbsItem & {
  children: WbsItemWithChildren[];
  variables: WbsVariable[];
  lineItems: EstimateLineItemWithRate[];
};

export type EstimateLineItemWithRate = EstimateLineItem & {
  rateItem: RateItem;
};

export type ProjectWithStats = Project & {
  _count: { wbsItems: number };
  estimateTotal?: number;
};

export type RateItemWithOverride = RateItem & {
  effectiveRate?: number;
};

// Compute helpers
export interface EstimateTotals {
  directCost: number;
  overhead: number;
  profit: number;
  vat: number;
  grandTotal: number;
}

export function computeEstimateTotals(
  items: WbsItemWithChildren[],
  overheadPct: number,
  profitPct: number,
  vatPct: number,
  rateOverrides: Map<string, number>
): EstimateTotals {
  function itemCost(item: WbsItemWithChildren): number {
    if (item.isGroup) {
      return item.children.reduce((sum, c) => sum + itemCost(c), 0);
    }
    const qty = item.quantity ? Number(item.quantity) : 0;
    return item.lineItems.reduce((sum, li) => {
      const lineQty = li.quantity != null ? Number(li.quantity) : qty;
      const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
      return sum + lineQty * rate;
    }, 0);
  }

  const directCost = items.reduce((sum, item) => sum + itemCost(item), 0);
  const overhead = directCost * (overheadPct / 100);
  const profit = (directCost + overhead) * (profitPct / 100);
  const vat = (directCost + overhead + profit) * (vatPct / 100);
  const grandTotal = directCost + overhead + profit + vat;

  return { directCost, overhead, profit, vat, grandTotal };
}
