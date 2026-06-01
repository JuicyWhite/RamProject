"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const MeetingSchema = z.object({
  title: z.string().min(1).max(200),
  date: z.string(),
  location: z.string().max(200).optional().nullable(),
  facilitator: z.string().max(200).optional().nullable(),
  attendees: z.string().max(2000).optional().nullable(),
  agenda: z.string().max(5000).optional().nullable(),
  minutes: z.string().max(10000).optional().nullable(),
  decisions: z.string().max(5000).optional().nullable(),
});

const ActionItemSchema = z.object({
  description: z.string().min(1).max(500),
  assignee: z.string().max(200).optional().nullable(),
  dueDate: z.string().optional().nullable(),
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

export async function createMeeting(projectId: string, input: z.infer<typeof MeetingSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = MeetingSchema.parse(input);
  const meeting = await db.meeting.create({
    data: { ...data, date: new Date(data.date), projectId, createdById: userId },
    include: { actionItems: true },
  });
  revalidatePath(`/projects/${projectId}/meetings`);
  return meeting;
}

export async function updateMeeting(projectId: string, id: string, input: z.infer<typeof MeetingSchema>) {
  await requireAccess(projectId);
  const data = MeetingSchema.parse(input);
  await db.meeting.updateMany({
    where: { id, projectId },
    data: { ...data, date: new Date(data.date) },
  });
  revalidatePath(`/projects/${projectId}/meetings`);
}

export async function deleteMeeting(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.meeting.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/meetings`);
}

export async function addActionItem(
  projectId: string,
  meetingId: string,
  input: z.infer<typeof ActionItemSchema>
) {
  await requireAccess(projectId);
  const data = ActionItemSchema.parse(input);
  const item = await db.meetingActionItem.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      meetingId,
    },
  });
  revalidatePath(`/projects/${projectId}/meetings`);
  return item;
}

export async function toggleActionItem(projectId: string, meetingId: string, itemId: string) {
  await requireAccess(projectId);
  const item = await db.meetingActionItem.findFirst({ where: { id: itemId, meetingId } });
  if (!item) throw new Error("Not found");
  await db.meetingActionItem.update({
    where: { id: itemId },
    data: {
      isCompleted: !item.isCompleted,
      completedAt: !item.isCompleted ? new Date() : null,
    },
  });
  revalidatePath(`/projects/${projectId}/meetings`);
}

export async function deleteActionItem(projectId: string, meetingId: string, itemId: string) {
  await requireAccess(projectId);
  await db.meetingActionItem.deleteMany({ where: { id: itemId, meetingId } });
  revalidatePath(`/projects/${projectId}/meetings`);
}
