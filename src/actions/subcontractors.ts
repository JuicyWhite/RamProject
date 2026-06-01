"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const SubcontractorSchema = z.object({
  company: z.string().min(1).max(200),
  trade: z.string().max(200).optional().nullable(),
  contactName: z.string().max(200).optional().nullable(),
  contactEmail: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  contractValue: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD", "TERMINATED"]).default("ACTIVE"),
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

export async function createSubcontractor(projectId: string, input: z.infer<typeof SubcontractorSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = SubcontractorSchema.parse(input);
  const sub = await db.subcontractor.create({
    data: { ...data, projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/subcontractors`);
  return sub;
}

export async function updateSubcontractorStatus(
  projectId: string,
  id: string,
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "TERMINATED"
) {
  await requireAccess(projectId);
  await db.subcontractor.updateMany({ where: { id, projectId }, data: { status } });
  revalidatePath(`/projects/${projectId}/subcontractors`);
}

export async function updatePaidAmount(projectId: string, id: string, paidAmount: number) {
  await requireAccess(projectId);
  await db.subcontractor.updateMany({ where: { id, projectId }, data: { paidAmount } });
  revalidatePath(`/projects/${projectId}/subcontractors`);
}

export async function deleteSubcontractor(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.subcontractor.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/subcontractors`);
}
