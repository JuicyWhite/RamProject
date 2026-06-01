"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const BillingSchema = z.object({
  number: z.string().max(100).optional().nullable(),
  date: z.string(),
  periodStart: z.string().optional().nullable(),
  periodEnd: z.string().optional().nullable(),
  amount: z.coerce.number().min(0),
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

export async function createBillingStatement(projectId: string, input: z.infer<typeof BillingSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = BillingSchema.parse(input);
  const statement = await db.billingStatement.create({
    data: {
      projectId,
      number: data.number ?? null,
      date: new Date(data.date),
      periodStart: data.periodStart ? new Date(data.periodStart) : null,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
      amount: data.amount,
      notes: data.notes ?? null,
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/billing`);
  return statement;
}

export async function updateBillingStatus(
  projectId: string,
  id: string,
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED"
) {
  await requireAccess(projectId);
  await db.billingStatement.updateMany({
    where: { id, projectId },
    data: { status },
  });
  revalidatePath(`/projects/${projectId}/billing`);
}

export async function deleteBillingStatement(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.billingStatement.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/billing`);
}
