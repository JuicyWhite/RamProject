"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const NameSchema = z.string().min(1).max(200);

export async function updateProfile(userId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) throw new Error("Unauthorized");

  const validatedName = NameSchema.parse(name);

  await db.user.update({
    where: { id: userId },
    data: { name: validatedName },
  });

  revalidatePath("/profile");
}
