"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const SiteReportSchema = z.object({
  date: z.string(),
  weather: z.string().max(100).optional().nullable(),
  temperature: z.string().max(50).optional().nullable(),
  manpower: z.coerce.number().int().min(0).optional().nullable(),
  equipment: z.string().max(2000).optional().nullable(),
  workDone: z.string().min(1).max(5000),
  materials: z.string().max(2000).optional().nullable(),
  visitors: z.string().max(200).optional().nullable(),
  issues: z.string().max(2000).optional().nullable(),
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

export async function createSiteReport(projectId: string, input: z.infer<typeof SiteReportSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = SiteReportSchema.parse(input);
  const report = await db.siteReport.create({
    data: {
      projectId,
      date: new Date(data.date),
      weather: data.weather ?? null,
      temperature: data.temperature ?? null,
      manpower: data.manpower ?? null,
      equipment: data.equipment ?? null,
      workDone: data.workDone,
      materials: data.materials ?? null,
      visitors: data.visitors ?? null,
      issues: data.issues ?? null,
      notes: data.notes ?? null,
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/site-reports`);
  return report;
}

export async function updateSiteReport(projectId: string, id: string, input: z.infer<typeof SiteReportSchema>) {
  await requireAccess(projectId);
  const data = SiteReportSchema.parse(input);
  const report = await db.siteReport.updateMany({
    where: { id, projectId },
    data: {
      date: new Date(data.date),
      weather: data.weather ?? null,
      temperature: data.temperature ?? null,
      manpower: data.manpower ?? null,
      equipment: data.equipment ?? null,
      workDone: data.workDone,
      materials: data.materials ?? null,
      visitors: data.visitors ?? null,
      issues: data.issues ?? null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath(`/projects/${projectId}/site-reports`);
  return report;
}

export async function deleteSiteReport(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.siteReport.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/site-reports`);
}
