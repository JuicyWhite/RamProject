"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const DeliverySchema = z.object({
  supplier: z.string().min(1).max(200),
  material: z.string().min(1).max(200),
  quantity: z.coerce.number().positive(),
  unit: z.string().max(50).optional().nullable(),
  deliveryDate: z.string(),
  receivedBy: z.string().max(200).optional().nullable(),
  drNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

async function requireAccess(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  const project = await db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
  if (!project) throw new Error("Project not found");
  return { userId: session.user.id };
}

export async function createDelivery(projectId: string, input: z.infer<typeof DeliverySchema>) {
  const { userId } = await requireAccess(projectId);
  const data = DeliverySchema.parse(input);
  const delivery = await db.materialDelivery.create({
    data: {
      projectId,
      supplier: data.supplier,
      material: data.material,
      quantity: data.quantity,
      unit: data.unit ?? null,
      deliveryDate: new Date(data.deliveryDate),
      receivedBy: data.receivedBy ?? null,
      drNumber: data.drNumber ?? null,
      notes: data.notes ?? null,
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/deliveries`);
  return delivery;
}

export async function deleteDelivery(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.materialDelivery.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/deliveries`);
}
