import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "@/components/projects/print-button";

export const metadata: Metadata = { title: "Project Report" };

export default async function ReportPage({
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
      _count: {
        select: {
          wbsItems: true,
          safetyIncidents: true,
          inspections: true,
          workers: true,
          documents: true,
        },
      },
    },
  });
  if (!project) notFound();

  const [openIssues, openIncidents, pendingDocs, tasks, billingStatements, subcontractors, teamMembers] =
    await Promise.all([
      db.projectIssue.count({ where: { projectId, status: "OPEN" } }),
      db.safetyIncident.count({ where: { projectId, status: "OPEN" } }),
      db.projectDocument.count({ where: { projectId, status: "PENDING" } }),
      db.projectTask.findMany({
        where: { projectId },
        orderBy: { dueDate: "asc" },
        take: 10,
        select: { title: true, status: true, assignee: true, dueDate: true },
      }),
      db.billingStatement.findMany({
        where: { projectId },
        orderBy: { date: "desc" },
        select: { number: true, date: true, amount: true, paidAmount: true, status: true },
      }),
      db.subcontractor.findMany({
        where: { projectId, status: { not: "TERMINATED" } },
        orderBy: { company: "asc" },
        select: { company: true, trade: true, contractValue: true, paidAmount: true, status: true },
      }),
      db.projectTeamMember.findMany({
        where: { projectId, isActive: true },
        orderBy: { name: "asc" },
        select: { name: true, role: true, company: true, email: true },
      }),
    ]);

  const totalBilled = billingStatements.reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = billingStatements.reduce((s, b) => s + Number(b.paidAmount), 0);
  const totalSubValue = subcontractors.reduce((s, b) => s + Number(b.contractValue ?? 0), 0);

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft", ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed", ARCHIVED: "Archived",
  };
  const taskStatusLabel: Record<string, string> = {
    TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done", OVERDUE: "Overdue",
  };
  const roleLabel: Record<string, string> = {
    PROJECT_MANAGER: "Project Manager", ENGINEER: "Engineer", FOREMAN: "Foreman",
    SUPERVISOR: "Supervisor", SAFETY_OFFICER: "Safety Officer", INSPECTOR: "Inspector", OTHER: "Other",
  };

  const fmt = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(d) : "—";

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors">
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Report</span>
        </div>
        <PrintButton />
      </div>

      <div id="print-report" className="space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 space-y-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.code && <p className="text-sm text-muted-foreground font-mono">{project.code}</p>}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mt-2">
            {project.client && <span><span className="font-medium">Client:</span> {project.client}</span>}
            {project.location && <span><span className="font-medium">Location:</span> {project.location}</span>}
            {project.startDate && <span><span className="font-medium">Start:</span> {fmt(project.startDate)}</span>}
            {project.endDate && <span><span className="font-medium">End:</span> {fmt(project.endDate)}</span>}
            <span><span className="font-medium">Status:</span> {statusLabel[project.status] ?? project.status}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Report generated: {new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
          </p>
        </div>

        {/* Financial Summary */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Financial Summary</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Budget", value: project.budget ? formatCurrency(Number(project.budget)) : "—" },
              { label: "Contract Amount", value: project.contractAmount ? formatCurrency(Number(project.contractAmount)) : "—" },
              { label: "Total Billed", value: formatCurrency(totalBilled) },
              { label: "Total Paid", value: formatCurrency(totalPaid) },
            ].map((c) => (
              <div key={c.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
                <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
                <p className="text-sm font-semibold tabular">{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Project Status */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project Status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Scope Items", value: project._count.wbsItems },
              { label: "Open Issues", value: openIssues },
              { label: "Open Incidents", value: openIncidents },
              { label: "Pending Docs", value: pendingDocs },
            ].map((c) => (
              <div key={c.label} className="rounded-md border border-border bg-surface p-3 space-y-1">
                <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">{c.label}</p>
                <p className="text-sm font-semibold tabular">{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Schedule / Tasks */}
        {tasks.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Schedule Tasks</h2>
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Task</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Assignee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Due</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 text-sm">{t.title}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{t.assignee ?? "—"}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{t.dueDate ? fmt(t.dueDate) : "—"}</td>
                      <td className="px-4 py-2 text-sm">{taskStatusLabel[t.status] ?? t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Billing */}
        {billingStatements.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Progress Billing</h2>
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Statement</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingStatements.map((b, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 text-sm">{b.number ?? `#${i + 1}`}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{fmt(b.date)}</td>
                      <td className="px-4 py-2 text-sm text-right tabular">{formatCurrency(Number(b.amount))}</td>
                      <td className="px-4 py-2 text-sm text-right tabular">{formatCurrency(Number(b.paidAmount))}</td>
                      <td className="px-4 py-2 text-sm">{b.status}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/20">
                    <td className="px-4 py-2 text-sm font-semibold" colSpan={2}>Total</td>
                    <td className="px-4 py-2 text-sm text-right tabular font-semibold">{formatCurrency(totalBilled)}</td>
                    <td className="px-4 py-2 text-sm text-right tabular font-semibold">{formatCurrency(totalPaid)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Subcontractors */}
        {subcontractors.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subcontractors</h2>
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Company</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Trade</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Contract</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subcontractors.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 text-sm font-medium">{s.company}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{s.trade ?? "—"}</td>
                      <td className="px-4 py-2 text-sm text-right tabular">{s.contractValue ? formatCurrency(Number(s.contractValue)) : "—"}</td>
                      <td className="px-4 py-2 text-sm text-right tabular">{formatCurrency(Number(s.paidAmount))}</td>
                      <td className="px-4 py-2 text-sm">{s.status}</td>
                    </tr>
                  ))}
                  {totalSubValue > 0 && (
                    <tr className="border-t border-border bg-muted/20">
                      <td className="px-4 py-2 text-sm font-semibold" colSpan={2}>Total</td>
                      <td className="px-4 py-2 text-sm text-right tabular font-semibold">{formatCurrency(totalSubValue)}</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Team */}
        {teamMembers.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Project Team</h2>
            <div className="rounded-md border border-border bg-surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Company</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2 text-sm font-medium">{m.name}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{roleLabel[m.role] ?? m.role}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{m.company ?? "—"}</td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{m.email ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
