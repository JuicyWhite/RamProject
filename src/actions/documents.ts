"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const DocSchema = z.object({
  type: z.enum(["SUBMITTAL", "RFI", "TRANSMITTAL"]),
  number: z.string().max(50).optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  from: z.string().max(200).optional().nullable(),
  to: z.string().max(200).optional().nullable(),
  date: z.string(),
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

export async function createDocument(projectId: string, input: z.infer<typeof DocSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = DocSchema.parse(input);
  const doc = await db.projectDocument.create({
    data: { ...data, date: new Date(data.date), projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/documents`);
  return doc;
}

export async function updateDocumentStatus(
  projectId: string,
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "CLOSED",
  response?: string
) {
  await requireAccess(projectId);
  await db.projectDocument.updateMany({
    where: { id, projectId },
    data: { status, ...(response !== undefined ? { response } : {}) },
  });
  revalidatePath(`/projects/${projectId}/documents`);
}

export async function deleteDocument(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.projectDocument.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/documents`);
}
