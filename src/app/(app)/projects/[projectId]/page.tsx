import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText, Settings, Calendar, MapPin, User2 } from "lucide-react";
import type { ProjectStatus } from "@prisma/client";

const statusVariant: Record<ProjectStatus, string> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ON_HOLD: "on-hold",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};
const statusLabel: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) return {};
  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    select: { name: true },
  });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const project = await db.project.findFirst({
    where: { id: projectId, orgId },
    include: {
      _count: { select: { wbsItems: true } },
    },
  });

  if (!project) notFound();

  const meta: { label: string; value: string | null; icon: React.ElementType }[] = [
    { label: "Client", value: project.client, icon: User2 },
    { label: "Location", value: project.location, icon: MapPin },
    { label: "Region", value: project.region, icon: MapPin },
    {
      label: "Start",
      value: project.startDate
        ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
            project.startDate
          )
        : null,
      icon: Calendar,
    },
    {
      label: "End",
      value: project.endDate
        ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
            project.endDate
          )
        : null,
      icon: Calendar,
    },
  ].filter((m) => m.value);

  return (
    <div className="p-6 max-w-5xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            {project.code && (
              <span className="text-xs text-muted-foreground font-mono border border-border rounded px-1.5 py-0.5">
                {project.code}
              </span>
            )}
            <Badge variant={statusVariant[project.status] as never}>
              {statusLabel[project.status]}
            </Badge>
            <Badge variant="outline">
              {project.contractType === "GOVERNMENT" ? "Gov't" : "Private"}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          {meta.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {meta.map((m) => (
                <span key={m.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <m.icon className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="font-medium text-foreground">{m.label}:</span> {m.value}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="outline">
            <Link href={`/projects/${project.id}/settings`}>
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/projects/${project.id}/estimate`}>
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Estimate
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Budget", value: project.budget, primary: false },
          { label: "Contract Amount", value: project.contractAmount, primary: true },
          { label: "Overhead", value: `${project.overheadPct}%`, raw: true },
          { label: "VAT", value: `${project.vatPct}%`, raw: true },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-md border border-border bg-surface p-3 space-y-1"
          >
            <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-sm font-semibold tabular ${card.primary ? "text-primary" : ""}`}>
              {"raw" in card && card.raw
                ? card.value
                : card.value
                ? formatCurrency(Number(card.value))
                : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-md border border-border bg-surface divide-y divide-border">
        {[
          {
            href: `/projects/${project.id}/estimate`,
            label: "Estimate",
            desc: `${project._count.wbsItems} scope items`,
            icon: FileText,
          },
          {
            href: `/projects/${project.id}/settings`,
            label: "Project Settings",
            desc: "Edit metadata, financials, and overrides",
            icon: Settings,
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
          >
            <item.icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
