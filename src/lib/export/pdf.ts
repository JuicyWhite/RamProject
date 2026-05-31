// PDF export — uses jsPDF + jspdf-autotable
// Called from the estimate toolbar (coming in next iteration)

import type { WbsItemWithChildren, EstimateTotals } from "@/types";
import type { Project } from "@prisma/client";
import { formatCurrency, formatNumber } from "@/lib/utils";

export async function exportEstimateToPdf(
  project: Project,
  tree: WbsItemWithChildren[],
  totals: EstimateTotals,
  rateOverrides: Map<string, number>
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.text(project.name, 14, 20);
  doc.setFontSize(9);
  doc.setTextColor(100);
  if (project.client) doc.text(`Client: ${project.client}`, 14, 27);
  if (project.location) doc.text(`Location: ${project.location}`, 14, 32);

  const rows: (string | number)[][] = [];

  function flatten(items: WbsItemWithChildren[], depth = 0) {
    for (const item of items) {
      if (item.isGroup) {
        rows.push([
          item.wbsCode ?? "",
          "  ".repeat(depth) + item.description.toUpperCase(),
          "",
          "",
          "",
          "",
        ]);
        flatten(item.children, depth + 1);
      } else {
        const qty = item.quantity ? Number(item.quantity) : 0;
        const subtotal = item.lineItems.reduce((s, li) => {
          const lineQty = li.quantity != null ? Number(li.quantity) : qty;
          const rate = rateOverrides.get(li.rateItemId) ?? Number(li.rateItem.unitRate);
          return s + lineQty * rate;
        }, 0);

        rows.push([
          item.wbsCode ?? "",
          "  ".repeat(depth) + item.description,
          item.unit ?? "",
          formatNumber(qty),
          "",
          formatCurrency(subtotal),
        ]);
      }
    }
  }

  flatten(tree);

  // Summary rows
  rows.push(["", "", "", "", "Direct Cost", formatCurrency(totals.directCost)]);
  rows.push(["", "", "", "", "Overhead", formatCurrency(totals.overhead)]);
  rows.push(["", "", "", "", "Profit", formatCurrency(totals.profit)]);
  rows.push(["", "", "", "", "VAT (12%)", formatCurrency(totals.vat)]);
  rows.push(["", "", "", "", "GRAND TOTAL", formatCurrency(totals.grandTotal)]);

  autoTable(doc, {
    startY: 38,
    head: [["WBS", "Description", "Unit", "Qty", "Unit Rate", "Amount (₱)"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [245, 158, 11], textColor: 0 },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  });

  doc.save(`${project.code ?? project.name}-estimate.pdf`);
}
