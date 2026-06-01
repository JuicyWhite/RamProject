import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChevronLeft, BookOpen, StickyNote, ClipboardCheck, ShieldAlert, TrendingUp, CheckSquare, Calendar, FileText } from "lucide-react";

export const metadata: Metadata = { title: "Recent Activity" };

export default async function ActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await auth();
  const orgId = (session?.user as { orgId?: string })?.orgId;
  if (!orgId) notFound();

  const project = await db.project.findFirst({ where: { id: projectId, orgId }, select: { id: true, name: true } });
  if (!project) notFound();

  const [diary, notes, issues, inspections, incidents, financial, tasks, documents] = await Promise.all([
    db.dailyDiary.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, date: true, progress: true, createdAt: true } }),
    db.projectNote.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, createdAt: true } }),
    db.projectIssue.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, severity: true, status: true, createdAt: true } }),
    db.inspection.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
    db.safetyIncident.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, severity: true, createdAt: true } }),
    db.financialEntry.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, description: true, type: true, amount: true, createdAt: true } }),
    db.projectTask.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, status: true, createdAt: true } }),
    db.projectDocument.findMany({ where: { projectId }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, type: true, status: true, createdAt: true } }),
  ]);

  type ActivityItem = {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: React.ElementType;
    color: string;
    createdAt: Date;
  };

  const activities: ActivityItem[] = [
    ...diary.map((d) => ({ id: `diary-${d.id}`, label: "Daily Diary", description: d.progress.slice(0, 80) + (d.progress.length > 80 ? "…" : ""), href: `/projects/${projectId}/diary`, icon: BookOpen, color: "text-amber-500", createdAt: d.createdAt })),
    ...notes.map((n) => ({ id: `note-${n.id}`, label: "Note", description: n.title, href: `/projects/${projectId}/notes`, icon: StickyNote, color: "text-blue-500", createdAt: n.createdAt })),
    ...issues.map((i) => ({ id: `issue-${i.id}`, label: `Issue — ${i.severity}`, description: i.title, href: `/projects/${projectId}/inspections`, icon: ClipboardCheck, color: i.severity === "CRITICAL" || i.severity === "HIGH" ? "text-red-500" : "text-orange-500", createdAt: i.createdAt })),
    ...inspections.map((i) => ({ id: `insp-${i.id}`, label: `Inspection — ${i.status}`, description: i.title, href: `/projects/${projectId}/inspections`, icon: ClipboardCheck, color: "text-purple-500", createdAt: i.createdAt })),
    ...incidents.map((i) => ({ id: `inc-${i.id}`, label: `Safety Incident — ${i.severity}`, description: i.title, href: `/projects/${projectId}/safety`, icon: ShieldAlert, color: "text-red-500", createdAt: i.createdAt })),
    ...financial.map((f) => ({ id: `fin-${f.id}`, label: `Financial — ${f.type}`, description: `${f.description} (₱${Number(f.amount).toLocaleString()})`, href: `/projects/${projectId}/financial`, icon: TrendingUp, color: f.type === "ADDITION" ? "text-green-500" : "text-red-500", createdAt: f.createdAt })),
    ...tasks.map((t) => ({ id: `task-${t.id}`, label: `Task — ${t.status}`, description: t.title, href: `/projects/${projectId}/schedule`, icon: Calendar, color: "text-sky-500", createdAt: t.createdAt })),
    ...documents.map((d) => ({ id: `doc-${d.id}`, label: `${d.type} — ${d.status}`, description: d.title, href: `/projects/${projectId}/documents`, icon: FileText, color: "text-indigo-500", createdAt: d.createdAt })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" />{project.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Recent Activity</span>
      </div>
      <div>
        <h1 className="text-lg font-semibold">Recent Activity</h1>
        <p className="text-sm text-muted-foreground mt-0.5">A log of all recent actions across this project.</p>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No activity yet. Start by adding diary entries, notes, or tasks.
        </div>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          {activities.map((item) => (
            <div key={item.id} className="relative flex gap-4 pb-4">
              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <Link href={item.href} className="flex-1 rounded-md border border-border bg-surface p-3 hover:bg-muted/30 transition-colors min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="text-sm mt-0.5 truncate">{item.description}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
