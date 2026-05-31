"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  CreateWbsItemSchema,
  UpdateWbsItemSchema,
  ReorderWbsSchema,
  UpsertWbsVariableSchema,
} from "@/validations/wbs";
import type {
  CreateWbsItemInput,
  UpdateWbsItemInput,
  UpsertWbsVariableInput,
} from "@/validations/wbs";
import type { WbsItemWithChildren } from "@/types";

async function requireProjectAccess(
  projectId: string,
  minRole?: "ESTIMATOR"
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");

  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
  });
  if (!project) throw new Error("Project not found");

  if (minRole) {
    const membership = await db.orgMembership.findUnique({
      where: { userId_orgId: { userId: session.user.id, orgId } },
    });
    if (membership?.role === "VIEWER") throw new Error("Read-only access");
  }

  return { orgId, project };
}

export async function getWbsTree(projectId: string): Promise<WbsItemWithChildren[]> {
  await requireProjectAccess(projectId);

  const items = await db.wbsItem.findMany({
    where: { projectId },
    include: {
      variables: true,
      lineItems: { include: { rateItem: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return buildTree(items);
}

function buildTree(
  items: Awaited<ReturnType<typeof db.wbsItem.findMany>>,
  parentId: string | null = null
): WbsItemWithChildren[] {
  return items
    .filter((i) => i.parentId === parentId)
    .map((i) => ({
      ...(i as unknown as WbsItemWithChildren),
      children: buildTree(items, i.id),
    }));
}

export async function createWbsItem(input: CreateWbsItemInput) {
  await requireProjectAccess(input.projectId, "ESTIMATOR");
  const data = CreateWbsItemSchema.parse(input);

  const item = await db.wbsItem.create({ data });
  revalidatePath(`/projects/${input.projectId}/estimate`);
  return item;
}

export async function updateWbsItem(id: string, projectId: string, input: UpdateWbsItemInput) {
  await requireProjectAccess(projectId, "ESTIMATOR");
  const data = UpdateWbsItemSchema.parse(input);

  const item = await db.wbsItem.update({ where: { id }, data });
  revalidatePath(`/projects/${projectId}/estimate`);
  return item;
}

export async function deleteWbsItem(id: string, projectId: string) {
  await requireProjectAccess(projectId, "ESTIMATOR");

  // cascade deletes children, variables, lineItems via Prisma
  await db.wbsItem.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/estimate`);
}

export async function reorderWbsItems(
  input: { projectId: string; items: { id: string; parentId: string | null; sortOrder: number }[] }
) {
  await requireProjectAccess(input.projectId, "ESTIMATOR");
  const data = ReorderWbsSchema.parse(input);

  await db.$transaction(
    data.items.map(({ id, parentId, sortOrder }) =>
      db.wbsItem.update({ where: { id }, data: { parentId, sortOrder } })
    )
  );

  revalidatePath(`/projects/${data.projectId}/estimate`);
}

export async function upsertWbsVariable(input: UpsertWbsVariableInput) {
  const data = UpsertWbsVariableSchema.parse(input);

  const item = await db.wbsItem.findUnique({
    where: { id: data.wbsItemId },
    select: { projectId: true },
  });
  if (!item) throw new Error("WBS item not found");
  await requireProjectAccess(item.projectId, "ESTIMATOR");

  const variable = await db.wbsVariable.upsert({
    where: { wbsItemId_name: { wbsItemId: data.wbsItemId, name: data.name } },
    create: data,
    update: { value: data.value, label: data.label },
  });

  revalidatePath(`/projects/${item.projectId}/estimate`);
  return variable;
}

export async function deleteWbsVariable(id: string) {
  const variable = await db.wbsVariable.findUnique({
    where: { id },
    include: { wbsItem: { select: { projectId: true } } },
  });
  if (!variable) throw new Error("Variable not found");
  await requireProjectAccess(variable.wbsItem.projectId, "ESTIMATOR");

  await db.wbsVariable.delete({ where: { id } });
  revalidatePath(`/projects/${variable.wbsItem.projectId}/estimate`);
}
