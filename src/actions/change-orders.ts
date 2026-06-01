"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const ChangeOrderSchema = z.object({
  number: z.string().max(50).optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  requestedBy: z.string().max(200).optional().nullable(),
  submittedDate: z.string(),
  amount: z.coerce.number(),
  notes: z.string().max(2000).optional().nullable(),
});

async function requireAccess(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orgId = (session.user as { orgId?: string }).orgId;
  if (!orgId) throw new Error("No organization");
  const project = await db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true } });
  if (!project) throw new Error("Project not found");
  return { userId: session.user.id, orgId };
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}

export async function createChangeOrder(projectId: string, input: z.infer<typeof ChangeOrderSchema>) {
  const { userId, orgId } = await requireAccess(projectId);
  const data = ChangeOrderSchema.parse(input);
  const order = await db.changeOrder.create({
    data: {
      projectId,
      number: data.number ?? null,
      title: data.title,
      description: data.description ?? null,
      requestedBy: data.requestedBy ?? null,
      submittedDate: new Date(data.submittedDate),
      amount: data.amount,
      notes: data.notes ?? null,
      createdById: userId,
    },
  });
  await db.notification.create({
    data: {
      orgId,
      projectId,
      title: "New Change Order Submitted",
      message: `CO #${data.number ?? ""}: ${data.title} — ${formatAmount(data.amount)}`,
      link: `/projects/${projectId}/change-orders`,
      type: "CHANGE_ORDER",
    },
  });
  revalidatePath(`/projects/${projectId}/change-orders`);
  return order;
}

export async function updateChangeOrderStatus(
  projectId: string,
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "VOIDED",
  approvedDate?: string
) {
  const { orgId } = await requireAccess(projectId);
  const order = await db.changeOrder.findFirst({ where: { id, projectId }, select: { title: true, number: true, amount: true } });
  await db.changeOrder.updateMany({
    where: { id, projectId },
    data: {
      status,
      ...(status === "APPROVED" && approvedDate ? { approvedDate: new Date(approvedDate) } : {}),
    },
  });
  if (order && (status === "APPROVED" || status === "REJECTED")) {
    await db.notification.create({
      data: {
        orgId,
        projectId,
        title: `Change Order ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message: `CO #${order.number ?? ""}: ${order.title} — ${formatAmount(Number(order.amount))}`,
        link: `/projects/${projectId}/change-orders`,
        type: "CHANGE_ORDER",
      },
    });
  }
  revalidatePath(`/projects/${projectId}/change-orders`);
}

export async function deleteChangeOrder(projectId: string, id: string) {
  await requireAccess(projectId);
  await db.changeOrder.deleteMany({ where: { id, projectId } });
  revalidatePath(`/projects/${projectId}/change-orders`);
}
