"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  CreateRateItemSchema,
  UpdateRateItemSchema,
  CreateRateOverrideSchema,
  CreateEstimateLineItemSchema,
  UpdateEstimateLineItemSchema,
} from "@/validations/rate";
import type {
  CreateRateItemInput,
  UpdateRateItemInput,
  CreateEstimateLineItemInput,
} from "@/validations/rate";

async function requireOrgAccess(minRole?: "ESTIMATOR") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");

  if (minRole) {
    const membership = await db.orgMembership.findUnique({
      where: { userId_orgId: { userId: session.user.id, orgId } },
    });
    if (membership?.role === "VIEWER") throw new Error("Read-only access");
  }

  return { orgId };
}

// ── Rate Library ──────────────────────────────────────────────────────────────

export async function getRateItems(category?: string) {
  const { orgId } = await requireOrgAccess();
  return db.rateItem.findMany({
    where: {
      orgId,
      isActive: true,
      ...(category ? { category: category as never } : {}),
    },
    orderBy: [{ category: "asc" }, { description: "asc" }],
  });
}

export async function createRateItem(input: CreateRateItemInput) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = CreateRateItemSchema.parse(input);

  const item = await db.rateItem.create({ data: { ...data, orgId } });
  revalidatePath("/rates");
  return item;
}

export async function updateRateItem(id: string, input: UpdateRateItemInput) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = UpdateRateItemSchema.parse(input);

  const existing = await db.rateItem.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Rate item not found");

  const item = await db.rateItem.update({ where: { id }, data });
  revalidatePath("/rates");
  return item;
}

export async function deleteRateItem(id: string) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const existing = await db.rateItem.findFirst({ where: { id, orgId } });
  if (!existing) throw new Error("Rate item not found");

  await db.rateItem.delete({ where: { id } });
  revalidatePath("/rates");
}

// ── Project Rate Overrides ─────────────────────────────────────────────────────

export async function upsertRateOverride(input: {
  projectId: string;
  rateItemId: string;
  unitRate: number;
}) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = CreateRateOverrideSchema.parse(input);

  const project = await db.project.findFirst({
    where: { id: data.projectId, orgId },
  });
  if (!project) throw new Error("Project not found");

  const override = await db.projectRateOverride.upsert({
    where: {
      projectId_rateItemId: {
        projectId: data.projectId,
        rateItemId: data.rateItemId,
      },
    },
    create: data,
    update: { unitRate: data.unitRate },
  });

  revalidatePath(`/projects/${data.projectId}/estimate`);
  return override;
}

// ── Estimate Line Items ───────────────────────────────────────────────────────

export async function addEstimateLineItem(input: CreateEstimateLineItemInput) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = CreateEstimateLineItemSchema.parse(input);

  const wbsItem = await db.wbsItem.findUnique({
    where: { id: data.wbsItemId },
    select: { projectId: true },
  });
  if (!wbsItem) throw new Error("WBS item not found");

  const project = await db.project.findFirst({
    where: { id: wbsItem.projectId, orgId },
  });
  if (!project) throw new Error("Project not found");

  const lineItem = await db.estimateLineItem.create({
    data,
    include: { rateItem: true },
  });

  revalidatePath(`/projects/${wbsItem.projectId}/estimate`);
  return lineItem;
}

export async function updateEstimateLineItem(
  id: string,
  input: { quantity?: number | null; notes?: string | null }
) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");
  const data = UpdateEstimateLineItemSchema.parse(input);

  const existing = await db.estimateLineItem.findUnique({
    where: { id },
    include: { wbsItem: { select: { projectId: true } } },
  });
  if (!existing) throw new Error("Line item not found");

  const project = await db.project.findFirst({
    where: { id: existing.wbsItem.projectId, orgId },
  });
  if (!project) throw new Error("Not authorized");

  const lineItem = await db.estimateLineItem.update({ where: { id }, data });
  revalidatePath(`/projects/${existing.wbsItem.projectId}/estimate`);
  return lineItem;
}

export async function deleteEstimateLineItem(id: string) {
  const { orgId } = await requireOrgAccess("ESTIMATOR");

  const existing = await db.estimateLineItem.findUnique({
    where: { id },
    include: { wbsItem: { select: { projectId: true } } },
  });
  if (!existing) throw new Error("Line item not found");

  const project = await db.project.findFirst({
    where: { id: existing.wbsItem.projectId, orgId },
  });
  if (!project) throw new Error("Not authorized");

  await db.estimateLineItem.delete({ where: { id } });
  revalidatePath(`/projects/${existing.wbsItem.projectId}/estimate`);
}
