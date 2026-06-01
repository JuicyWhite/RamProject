import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft } from "lucide-react";
import { DeliveriesShell } from "@/components/deliveries/deliveries-shell";

export const metadata: Metadata = { title: "Material Delivery Log" };

export default async function DeliveriesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const [project, deliveries] = await Promise.all([
    db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } }),
    db.materialDelivery.findMany({
      where: { projectId, project: { orgId } },
      orderBy: { deliveryDate: "desc" },
    }),
  ]);

  if (!project) notFound();

  const serialized = deliveries.map((d) => ({
    id: d.id,
    supplier: d.supplier,
    material: d.material,
    quantity: Number(d.quantity),
    unit: d.unit,
    deliveryDate: d.deliveryDate.toISOString(),
    receivedBy: d.receivedBy,
    drNumber: d.drNumber,
    notes: d.notes,
  }));

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Material Delivery Log</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Material Delivery Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track all material deliveries received on site.</p>
      </div>
      <DeliveriesShell projectId={project.id} initialDeliveries={serialized} />
    </div>
  );
}
