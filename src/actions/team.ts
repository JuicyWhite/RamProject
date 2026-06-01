"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const TeamMemberSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.enum(["PROJECT_MANAGER", "ENGINEER", "FOREMAN", "SUPERVISOR", "SAFETY_OFFICER", "INSPECTOR", "OTHER"]),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
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

export async function createTeamMember(projectId: string, input: z.infer<typeof TeamMemberSchema>) {
  const { userId } = await requireAccess(projectId);
  const data = TeamMemberSchema.parse(input);
  const member = await db.projectTeamMember.create({
    data: {
      projectId,
      name: data.name,
      role: data.role,
      email: data.email ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      createdById: userId,
    },
  });
  revalidatePath(`/projects/${projectId}/team`);
  return member;
}

export async function toggleTeamMemberActive(projectId: string, id: string) {
  await requireAccess(projectId);
  const member = await db.projectTeamMember.findFirst({ where: { id, projectId }, select: { isActive: true } });
  if (!member) throw new Error("Member not found");
  await db.projectTeamMember.updateMany({
    where: { id, projectId },
    data: { isActive: !member.isActive },
  });
  revalidatePath(`/projects/${projectId}/team`);
}

export async function deleteTeamMember(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.projectTeamMember.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/team`);
}
