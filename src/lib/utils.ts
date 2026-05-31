import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number | string | null | undefined,
  opts: { currency?: string; compact?: boolean } = {}
): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "₱0.00";

  const { currency = "PHP", compact = false } = opts;

  if (compact && Math.abs(num) >= 1_000_000) {
    return (
      "₱" +
      new Intl.NumberFormat("en-PH", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(num)
    );
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(
  value: number | string | null | undefined,
  decimals = 4
): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateWbsCode(
  parentCode: string | null,
  siblingCount: number
): string {
  const num = siblingCount + 1;
  return parentCode ? `${parentCode}.${num}` : `${num}`;
}

export function truncate(str: string, maxLen = 60): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export const DPWH_REGIONS = [
  "NCR",
  "CAR",
  "Region I",
  "Region II",
  "Region III",
  "Region IV-A (CALABARZON)",
  "Region IV-B (MIMAROPA)",
  "Region V",
  "Region VI",
  "Region VII",
  "Region VIII",
  "Region IX",
  "Region X",
  "Region XI",
  "Region XII",
  "Region XIII",
  "BARMM",
] as const;

export const QUANTITY_UNITS = [
  { value: "m", label: "m (meter)" },
  { value: "m2", label: "m² (sq. meter)" },
  { value: "m3", label: "m³ (cu. meter)" },
  { value: "kg", label: "kg (kilogram)" },
  { value: "ton", label: "ton (metric ton)" },
  { value: "pcs", label: "pcs (pieces)" },
  { value: "set", label: "set" },
  { value: "ls", label: "l.s. (lump sum)" },
  { value: "lot", label: "lot" },
  { value: "bag", label: "bag" },
  { value: "sheet", label: "sheet" },
  { value: "length", label: "length" },
  { value: "day", label: "day" },
  { value: "hr", label: "hr (hour)" },
  { value: "mo", label: "mo (month)" },
] as const;
