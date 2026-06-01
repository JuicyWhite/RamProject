"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ItemSchema = z.object({
  description: z.string().min(1).max(300),
  category: z.string().max(100).optional().nullable(),
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

export async function createChecklistItem(projectId: string, input: z.infer<typeof ItemSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = ItemSchema.parse(input);
  const count = await db.checklistItem.count({ where: { projectId } });
  const item = await db.checklistItem.create({
    data: { ...data, projectId, sortOrder: count, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/checklist`);
  return item;
}

export async function toggleChecklistItem(projectId: string, id: string, isCompleted: boolean) {
  await requireAccess(projectId);
  await db.checklistItem.updateMany({
    where: { id, projectId },
    data: { isCompleted, completedAt: isCompleted ? new Date() : null },
  });
  revalidatePath(`/projects/${projectId}/checklist`);
}

export async function deleteChecklistItem(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.checklistItem.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/checklist`);
}
