"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const EntrySchema = z.object({
  type: z.enum(["ADDITION", "SUBTRACTION"]),
  description: z.string().min(1).max(300),
  amount: z.coerce.number().positive(),
  date: z.string(),
});

async function requireProjectAccess(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found");
  return { userId: session.user.id };
}

export async function getFinancialEntries(projectId: string) {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) throw new Error("Unauthorized");
  return db.financialEntry.findMany({
    where: { projectId, project: { orgId } },
    orderBy: { date: "desc" },
  });
}

export async function createFinancialEntry(
  projectId: string,
  input: z.infer<typeof EntrySchema>
) {
  const { userId } = await requireProjectAccess(projectId);
  const data = EntrySchema.parse(input);
  const entry = await db.financialEntry.create({
    data: {
      projectId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/financial`);
  revalidatePath(`/projects/${projectId}`);
  return entry;
}

export async function deleteFinancialEntry(projectId: string, entryId: string) {
  await requireProjectAccess(projectId);
  await db.financialEntry.deleteMany({ where: { id: entryId, projectId } });
  revalidatePath(`/projects/${projectId}/financial`);
  revalidatePath(`/projects/${projectId}`);
}
