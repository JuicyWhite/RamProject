"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getNotifications(): Promise<
  { id: string; title: string; message: string | null; link: string | null; type: string; createdAt: string }[]
> {
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return [];

  const rows = await db.notification.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, title: true, message: true, link: true, type: true, createdAt: true },
  });

  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    link: n.link,
    type: n.type,
    createdAt: n.createdAt.toISOString(),
  }));
}
