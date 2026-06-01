"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function requireProjectAccess(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  const project = await db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
  if (!project) throw new Error("Project not found");
  return { userId: session.user.id };
}

const InspectionSchema = z.object({
  title: z.string().min(1).max(200),
  location: z.string().max(200).optional().nullable(),
  inspector: z.string().max(200).optional().nullable(),
  date: z.string(),
  notes: z.string().max(2000).optional().nullable(),
});

const IssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  inspectionId: z.string().optional().nullable(),
});

export async function createInspection(projectId: string, input: z.infer<typeof InspectionSchema>) {
  const { userId } = await requireProjectAccess(projectId);
  const data = InspectionSchema.parse(input);
  const inspection = await db.inspection.create({
    data: { ...data, date: new Date(data.date), projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/inspections`);
  return inspection;
}

export async function updateInspectionStatus(
  projectId: string,
  inspectionId: string,
  status: "OPEN" | "PASSED" | "FAILED"
) {
  await requireProjectAccess(projectId);
  await db.inspection.updateMany({ where: { id: inspectionId, projectId }, data: { status } });
  revalidatePath(`/projects/${projectId}/inspections`);
}

export async function deleteInspection(projectId: string, inspectionId: string) {
  await requireProjectAccess(projectId);
  await db.inspection.deleteMany({ where: { id: inspectionId, projectId } });
  revalidatePath(`/projects/${projectId}/inspections`);
}

export async function createIssue(projectId: string, input: z.infer<typeof IssueSchema>) {
  const { userId } = await requireProjectAccess(projectId);
  const data = IssueSchema.parse(input);
  const issue = await db.projectIssue.create({
    data: { ...data, projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/inspections`);
  return issue;
}

export async function resolveIssue(projectId: string, issueId: string, notes?: string) {
  await requireProjectAccess(projectId);
  await db.projectIssue.updateMany({
    where: { id: issueId, projectId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolvedNotes: notes ?? null },
  });
  revalidatePath(`/projects/${projectId}/inspections`);
}

export async function deleteIssue(projectId: string, issueId: string) {
  await requireProjectAccess(projectId);
  await db.projectIssue.deleteMany({ where: { id: issueId, projectId } });
  revalidatePath(`/projects/${projectId}/inspections`);
}
