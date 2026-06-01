"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PunchItemSchema = z.object({
  description: z.string().min(1).max(1000),
  location: z.string().max(200).optional().nullable(),
  assignee: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
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

export async function createPunchItem(projectId: string, input: z.infer<typeof PunchItemSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = PunchItemSchema.parse(input);
  const item = await db.punchListItem.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/punch-list`);
  return item;
}

export async function updatePunchStatus(
  projectId: string,
  id: string,
  status: "OPEN" | "IN_PROGRESS" | "CLOSED"
) {
  await requireAccess(projectId);
  await db.punchListItem.updateMany({
    where: { id, projectId },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath(`/projects/${projectId}/punch-list`);
}

export async function deletePunchItem(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.punchListItem.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/punch-list`);
}
