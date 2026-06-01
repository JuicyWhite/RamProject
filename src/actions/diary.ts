"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const DiarySchema = z.object({
  date: z.string(),
  weather: z.string().max(100).optional().nullable(),
  manpowerCount: z.coerce.number().int().min(0).optional().nullable(),
  progress: z.string().min(1).max(5000),
  challenges: z.string().max(2000).optional().nullable(),
  nextDayPlan: z.string().max(2000).optional().nullable(),
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
  return { userId: session.user.id, orgId };
}

export async function getDiaryEntries(projectId: string) {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) throw new Error("Unauthorized");

  return db.dailyDiary.findMany({
    where: { projectId, project: { orgId } },
    orderBy: { date: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });
}

export async function upsertDiaryEntry(
  projectId: string,
  input: z.infer<typeof DiarySchema>
) {
  const { userId } = await requireProjectAccess(projectId);
  const data = DiarySchema.parse(input);

  const date = new Date(data.date);

  const entry = await db.dailyDiary.upsert({
    where: { projectId_date: { projectId, date } },
    create: {
      projectId,
      date,
      weather: data.weather,
      manpowerCount: data.manpowerCount,
      progress: data.progress,
      challenges: data.challenges,
      nextDayPlan: data.nextDayPlan,
      createdById: userId,
    },
    update: {
      weather: data.weather,
      manpowerCount: data.manpowerCount,
      progress: data.progress,
      challenges: data.challenges,
      nextDayPlan: data.nextDayPlan,
    },
  });

  revalidatePath(`/projects/${projectId}/diary`);
  revalidatePath(`/projects/${projectId}`);
  return entry;
}

export async function deleteDiaryEntry(projectId: string, entryId: string) {
  await requireProjectAccess(projectId);
  await db.dailyDiary.deleteMany({ where: { id: entryId, projectId } });
  revalidatePath(`/projects/${projectId}/diary`);
}
