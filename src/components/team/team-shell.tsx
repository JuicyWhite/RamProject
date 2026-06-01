"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createTeamMember, toggleTeamMemberActive, deleteTeamMember } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";

type TeamRole = "PROJECT_MANAGER" | "ENGINEER" | "FOREMAN" | "SUPERVISOR" | "SAFETY_OFFICER" | "INSPECTOR" | "OTHER";

interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string | null;
  phone: string | null;
  company: string | null;
  isActive: boolean;
}

const roleLabels: Record<TeamRole, string> = {
  PROJECT_MANAGER: "Project Manager",
  ENGINEER: "Engineer",
  FOREMAN: "Foreman",
  SUPERVISOR: "Supervisor",
  SAFETY_OFFICER: "Safety Officer",
  INSPECTOR: "Inspector",
  OTHER: "Other",
};

const roleColors: Record<TeamRole, string> = {
  PROJECT_MANAGER: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ENGINEER: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  FOREMAN: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  SUPERVISOR: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  SAFETY_OFFICER: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  INSPECTOR: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
  OTHER: "bg-muted text-muted-foreground",
};

export function TeamShell({
  projectId,
  initialMembers,
}: {
  projectId: string;
  initialMembers: TeamMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "OTHER" as TeamRole,
    company: "",
    email: "",
    phone: "",
  });

  const active = members.filter((m) => m.isActive);
  const inactive = members.filter((m) => !m.isActive);
  const sorted = [...active, ...inactive];

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      const m = await createTeamMember(projectId, {
        name: form.name,
        role: form.role,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
      });
      const serialized: TeamMember = {
        id: m.id,
        name: m.name,
        role: m.role as TeamRole,
        email: m.email,
        phone: m.phone,
        company: m.company,
        isActive: m.isActive,
      };
      setMembers((prev) => [serialized, ...prev]);
      setForm({ name: "", role: "OTHER", company: "", email: "", phone: "" });
      setShowForm(false);
      toast.success("Team member added.");
    } catch {
      toast.error("Failed to add team member.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    try {
      await toggleTeamMemberActive(projectId, id);
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, isActive: !m.isActive } : m));
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTeamMember(projectId, id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Member
        </Button>
      )}

      {showForm && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <h2 className="text-sm font-semibold">Add Team Member</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="t-name">Name <span className="text-destructive">*</span></Label>
              <Input id="t-name" placeholder="Full name" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-role">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as TeamRole }))}>
                <SelectTrigger id="t-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(roleLabels) as TeamRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-company">Company</Label>
              <Input id="t-company" placeholder="Company or firm" value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-email">Email</Label>
              <Input id="t-email" type="email" placeholder="email@example.com" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-phone">Phone</Label>
              <Input id="t-phone" type="tel" placeholder="Contact number" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Add Member"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {members.length === 0 && !showForm && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No team members added yet.
        </div>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((m) => (
            <div
              key={m.id}
              className={`rounded-md border border-border bg-surface p-4 space-y-2 ${!m.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-tight truncate">{m.name}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[m.role]}`}>
                    {roleLabels[m.role]}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {m.company && (
                <p className="text-xs text-muted-foreground truncate">{m.company}</p>
              )}

              <div className="space-y-0.5">
                {m.email && (
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                )}
                {m.phone && (
                  <p className="text-xs text-muted-foreground">{m.phone}</p>
                )}
              </div>

              <div className="pt-1">
                <button
                  onClick={() => handleToggle(m.id)}
                  disabled={togglingId === m.id}
                  className="text-xs font-medium transition-colors"
                >
                  {m.isActive ? (
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted/40">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted/60">Inactive</Badge>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
