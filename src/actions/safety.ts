"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const IncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  incidentDate: z.string(),
  location: z.string().max(200).optional().nullable(),
  injuredPerson: z.string().max(200).optional().nullable(),
  correctiveAction: z.string().max(2000).optional().nullable(),
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

export async function createIncident(projectId: string, input: z.infer<typeof IncidentSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = IncidentSchema.parse(input);
  const incident = await db.safetyIncident.create({
    data: { ...data, incidentDate: new Date(data.incidentDate), projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/safety`);
  return incident;
}

export async function closeIncident(projectId: string, id: string, correctiveAction?: string) {
  await requireAccess(projectId);
  await db.safetyIncident.updateMany({
    where: { id, projectId },
    data: { status: "CLOSED", closedAt: new Date(), ...(correctiveAction ? { correctiveAction } : {}) },
  });
  revalidatePath(`/projects/${projectId}/safety`);
}

export async function deleteIncident(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.safetyIncident.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/safety`);
}
