import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RatesShell } from "@/components/rates/rates-shell";

export const metadata: Metadata = { title: "Rate Library" };

export default async function RatesPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return null;

  const rateItems = await db.rateItem.findMany({
    where: { orgId },
    orderBy: [{ category: "asc" }, { description: "asc" }],
  });

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold">Rate Library</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage labor, material, equipment, and subcontract rates. {rateItems.length} items.
        </p>
      </div>
      <RatesShell initialItems={rateItems} />
    </div>
  );
}
