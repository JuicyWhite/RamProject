// XLSX export — uses ExcelJS (MIT licensed)
// Called from the estimate toolbar (coming in next iteration)

import type { WbsItemWithChildren, EstimateTotals } from "@/types";
import type { Project } from "@prisma/client";
import { formatNumber } from "@/lib/utils";

export async function exportEstimateToXlsx(
  project: Project,
  tree: WbsItemWithChildren[],
  totals: EstimateTotals,
  rateOverrides: Map<string, number>
) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Estimate");

  ws.columns = [
    { key: "code",   width: 10 },
    { key: "desc",   width: 55 },
    { key: "unit",   width: 8  },
    { key: "qty",    width: 12 },
    { key: "rate",   width: 16 },
    { key: "amount", width: 18 },
  ];

  // Header row
  const headerRow = ws.addRow(["WBS", "Description", "Unit", "Qty", "Unit Rate (₱)", "Amount (₱)"]);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FFF59E0B" },
  };

  function flattenToSheet(items: WbsItemWithChildren[], depth = 0) {
    for (const item of items) {
      if (item.isGroup) {
        const row = ws.addRow({
          code: item.wbsCode ?? "",
          desc: "  ".repeat(depth) + item.description,
          unit: "",
          qty: "",
          rate: "",
          amount: "",
        });
        row.font = { bold: true };
        row.fill = {
          type: "pattern", pattern: "solid",
          fgColor: { argb: "FFF5F5F5" },
        };
        flattenToSheet(item.children, depth + 1);
      } else {
        const qty = item.quantity ? Number(item.quantity) : 0;
        const subtotal = item.lineItems.reduce((s, li) => {
          const lineQty = li.quantity != null ? Number(li.quantity) : qty;
          const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
          return s + lineQty * rate;
        }, 0);

        ws.addRow({
          code: item.wbsCode ?? "",
          desc: "  ".repeat(depth) + item.description,
          unit: item.unit ?? "",
          qty,
          rate: "",
          amount: subtotal,
        });
      }
    }
  }

  flattenToSheet(tree);

  // Totals
  ws.addRow({});
  const summaryRows = [
    ["", "Direct Cost", "", "", "", totals.directCost],
    ["", "Overhead", "", "", "", totals.overhead],
    ["", "Profit", "", "", "", totals.profit],
    ["", "VAT (12%)", "", "", "", totals.vat],
    ["", "GRAND TOTAL", "", "", "", totals.grandTotal],
  ];
  for (const r of summaryRows) {
    const row = ws.addRow(r);
    if (r[1] === "GRAND TOTAL") row.font = { bold: true };
  }

  // PHP currency format for amount column
  ws.getColumn("amount").numFmt = '#,##0.00';
  ws.getColumn("qty").numFmt = '#,##0.####';

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.code ?? project.name}-estimate.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
