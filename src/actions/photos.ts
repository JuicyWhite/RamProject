"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const PhotoSchema = z.object({
  url: z.string().min(1).max(2000),
  caption: z.string().max(500).optional().nullable(),
  category: z.enum(["PROGRESS", "DEFECT", "AS_BUILT", "SAFETY", "OTHER"]).default("PROGRESS"),
  location: z.string().max(200).optional().nullable(),
  takenAt: z.string(),
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

export async function createSitePhoto(projectId: string, input: z.infer<typeof PhotoSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = PhotoSchema.parse(input);
  const photo = await db.sitePhoto.create({
    data: { ...data, takenAt: new Date(data.takenAt), projectId, createdById: userId },
  });
  revalidatePath(`/projects/${projectId}/photos`);
  return photo;
}

export async function deleteSitePhoto(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.sitePhoto.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/photos`);
}
