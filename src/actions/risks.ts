"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const RiskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  probability: z.enum(["HIGH", "MEDIUM", "LOW"]),
  impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
  mitigation: z.string().max(2000).optional().nullable(),
  owner: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

async function requireAccess(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  const project = await db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
  if (!project) throw new Error("Project not found");
  return { userId: session.user.id, orgId };
}

const scoreMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export async function createRisk(projectId: string, input: z.infer<typeof RiskSchema>) {
  const { userId, orgId } = await requireAccess(projectId);
  const data = RiskSchema.parse(input);
  const risk = await db.riskItem.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      createdById: userId,
    },
  });
  const score = scoreMap[data.probability] * scoreMap[data.impact];
  if (score === 9) {
    await db.notification.create({
      data: {
        orgId,
        projectId,
        title: "Critical Risk Identified",
        message: data.title,
        link: `/projects/${projectId}/risks`,
        type: "RISK",
      },
    });
  }
  revalidatePath(`/projects/${projectId}/risks`);
  return risk;
}

export async function updateRiskStatus(
  projectId: string,
  id: string,
  status: "OPEN" | "MITIGATED" | "CLOSED"
) {
  await requireAccess(projectId);
  await db.riskItem.updateMany({
    where: { id, projectId },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath(`/projects/${projectId}/risks`);
}

export async function deleteRisk(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.riskItem.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/risks`);
}
