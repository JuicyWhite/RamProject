"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateProjectSchema, UpdateProjectSchema } from "@/validations/project";
import type { CreateProjectInput, UpdateProjectInput } from "@/validations/project";
import { PROJECT_TEMPLATES, type TemplateWbsItem } from "@/lib/templates";

async function requireOrgAccess(minRole?: "OWNER" | "ESTIMATOR") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization found");

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
  });
  if (!membership) throw new Error("Not a member of this organization");

  if (minRole === "OWNER" && membership.role !== "OWNER") {
    throw new Error("Requires owner role");
  }
  if (
    minRole === "ESTIMATOR" &&
    membership.role === "VIEWER"
  ) {
    throw new Error("Requires estimator role or higher");
  }

  return { userId: session.user.id, orgId, role: membership.role };
}

export async function getProjects() {
  const { orgId } = await requireOrgAccess();
  return db.project.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { wbsItems: true } } },
  });
}

export async function getProject(projectId: string) {
  const { orgId } = await requireOrgAccess();
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    include: { rateOverrides: true },
  });
  if (!project) throw new Error("Project not found");
  return project;
}

export async function createProject(input: CreateProjectInput) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = CreateProjectSchema.parse(input);

  const project = await db.project.create({
    data: { ...data, orgId },
  });

  revalidatePath("/projects");
  return project;
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = UpdateProjectSchema.parse(input);

  const result = await db.project.updateMany({
    where: { id: projectId, orgId },
    data,
  });
  if (result.count === 0) throw new Error("Project not found");

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function deleteProject(projectId: string) {
  const { orgId } = await requireOrgAccess("OWNER");
  const result = await db.project.deleteMany({ where: { id: projectId, orgId } });
  if (result.count === 0) throw new Error("Project not found");
  revalidatePath("/projects");
}

export async function archiveProject(projectId: string) {
  return updateProject(projectId, { status: "ARCHIVED" });
}

export async function createProjectFromTemplate(
  input: { name: string; client?: string; location?: string },
  templateId: string
) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");

  const project = await db.project.create({
    data: { name: input.name, client: input.client, location: input.location, orgId },
  });

  const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
  if (template && template.items.length > 0) {
    await createTemplateItems(project.id, template.items, null, 0);
  }

  revalidatePath("/projects");
  return project;
}

async function createTemplateItems(
  projectId: string,
  items: TemplateWbsItem[],
  parentId: string | null,
  startOrder: number
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const created = await db.wbsItem.create({
      data: {
        projectId,
        parentId,
        description: item.description,
        isGroup: item.isGroup,
        sortOrder: startOrder + i,
      },
    });
    if (item.children && item.children.length > 0) {
      await createTemplateItems(projectId, item.children, created.id, 0);
    }
  }
}
