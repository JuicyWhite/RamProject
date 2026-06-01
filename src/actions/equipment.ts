"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function requireOrgAccess() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  return { userId: session.user.id, orgId };
}

const EquipmentSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().max(100).optional().nullable(),
  plateOrSerial: z.string().max(100).optional().nullable(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]).optional(),
  dailyRate: z.coerce.number().nonnegative().optional().nullable(),
  fuelType: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const LogSchema = z.object({
  projectId: z.string().optional().nullable(),
  date: z.string().min(1),
  hoursUsed: z.coerce.number().nonnegative().optional().nullable(),
  fuelConsumed: z.coerce.number().nonnegative().optional().nullable(),
  operator: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function createEquipment(
  input: z.infer<typeof EquipmentSchema>
) {
  const { userId, orgId } = await requireOrgAccess();
  const data = EquipmentSchema.parse(input);
  const equipment = await db.equipment.create({
    data: {
      ...data,
      orgId,
      createdById: userId,
    },
  });
  revalidatePath("/equipment");
  return equipment;
}

export async function updateEquipmentStatus(
  id: string,
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "RETIRED"
) {
  const { orgId } = await requireOrgAccess();
  const existing = await db.equipment.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Equipment not found");
  const equipment = await db.equipment.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/equipment");
  return equipment;
}

export async function deleteEquipment(id: string) {
  const { orgId } = await requireOrgAccess();
  const existing = await db.equipment.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Equipment not found");
  await db.equipment.delete({ where: { id } });
  revalidatePath("/equipment");
}

export async function logEquipmentUsage(
  equipmentId: string,
  input: z.infer<typeof LogSchema>
) {
  const { userId, orgId } = await requireOrgAccess();
  const data = LogSchema.parse(input);
  const existing = await db.equipment.findFirst({ where: { id: equipmentId, orgId } });
  if (!existing) throw new Error("Equipment not found");
  const log = await db.equipmentLog.create({
    data: {
      equipmentId,
      projectId: data.projectId ?? null,
      date: new Date(data.date),
      hoursUsed: data.hoursUsed ?? null,
      fuelConsumed: data.fuelConsumed ?? null,
      operator: data.operator ?? null,
      notes: data.notes ?? null,
      createdById: userId,
    },
  });
  revalidatePath("/equipment");
  return log;
}

export async function deleteEquipmentLog(equipmentId: string, logId: string) {
  const { orgId } = await requireOrgAccess();
  const existing = await db.equipment.findFirst({ where: { id: equipmentId, orgId } });
  if (!existing) throw new Error("Equipment not found");
  await db.equipmentLog.deleteMany({ where: { id: logId, equipmentId } });
  revalidatePath("/equipment");
}
