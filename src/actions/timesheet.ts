"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const LogHoursSchema = z.object({
  workerId: z.string().min(1),
  date: z.string().min(1),
  hoursWorked: z.coerce.number().min(0).max(24),
  overtime: z.coerce.number().min(0).max(12),
  notes: z.string().max(500).optional().nullable(),
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

export async function logHours(
  projectId: string,
  input: z.infer<typeof LogHoursSchema>
) {
  const { userId } = await requireAccess(projectId);
  const data = LogHoursSchema.parse(input);

  const entry = await db.timesheetEntry.upsert({
    where: {
      workerId_date: {
        workerId: data.workerId,
        date: new Date(data.date),
      },
    },
    create: {
      projectId,
      workerId: data.workerId,
      date: new Date(data.date),
      hoursWorked: data.hoursWorked,
      overtime: data.overtime,
      notes: data.notes ?? null,
      createdById: userId,
    },
    update: {
      hoursWorked: data.hoursWorked,
      overtime: data.overtime,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/projects/${projectId}/timesheet`);
  return entry;
}

export async function deleteTimesheetEntry(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.timesheetEntry.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/timesheet`);
}
