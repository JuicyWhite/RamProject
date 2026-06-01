"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const NoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  isPinned: z.boolean().default(false),
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

export async function getNotes(projectId: string) {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) throw new Error("Unauthorized");

  return db.projectNote.findMany({
    where: { projectId, project: { orgId } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    include: { createdBy: { select: { name: true, email: true } } },
  });
}

export async function createNote(projectId: string, input: z.infer<typeof NoteSchema>) {
  const { userId } = await requireProjectAccess(projectId);
  const data = NoteSchema.parse(input);

  const note = await db.projectNote.create({
    data: { ...data, projectId, createdById: userId },
  });

  revalidatePath(`/projects/${projectId}/notes`);
  revalidatePath(`/projects/${projectId}`);
  return note;
}

export async function updateNote(
  projectId: string,
  noteId: string,
  input: Partial<z.infer<typeof NoteSchema>>
) {
  await requireProjectAccess(projectId);

  const note = await db.projectNote.updateMany({
    where: { id: noteId, projectId },
    data: input,
  });

  revalidatePath(`/projects/${projectId}/notes`);
  return note;
}

export async function deleteNote(projectId: string, noteId: string) {
  await requireProjectAccess(projectId);
  await db.projectNote.deleteMany({ where: { id: noteId, projectId } });
  revalidatePath(`/projects/${projectId}/notes`);
}
