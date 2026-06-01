import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EquipmentShell } from "@/components/equipment/equipment-shell";

export const metadata: Metadata = { title: "Equipment" };

export default async function EquipmentPage() {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return null;

  const equipment = await db.equipment.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  const serialized = equipment.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    plateOrSerial: item.plateOrSerial,
    status: item.status as "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED",
    dailyRate: item.dailyRate != null ? Number(item.dailyRate) : null,
    fuelType: item.fuelType,
    lastMaintenanceDate: item.lastMaintenanceDate
      ? item.lastMaintenanceDate.toISOString()
      : null,
    notes: item.notes,
    logs: item.logs.map((log) => ({
      id: log.id,
      date: log.date.toISOString(),
      hoursUsed: log.hoursUsed != null ? Number(log.hoursUsed) : null,
      fuelConsumed: log.fuelConsumed != null ? Number(log.fuelConsumed) : null,
      operator: log.operator,
      notes: log.notes,
    })),
  }));

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold">Equipment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your fleet status, utilization, and fuel consumption.
        </p>
      </div>
      <EquipmentShell initialEquipment={serialized} />
    </div>
  );
}
