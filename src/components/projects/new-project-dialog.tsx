"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROJECT_TEMPLATES } from "@/lib/templates";
import { createProjectFromTemplate } from "@/actions/projects";
import { FileText, Check } from "lucide-react";

type Step = "template" | "details";

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", client: "", location: "" });
  const [saving, setSaving] = useState(false);

  const filtered = PROJECT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("template");
      setSelectedTemplate("blank");
      setSearch("");
      setForm({ name: "", client: "", location: "" });
    }, 200);
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setSaving(true);
    try {
      const project = await createProjectFromTemplate(
        { name: form.name, client: form.client || undefined, location: form.location || undefined },
        selectedTemplate
      );
      toast.success("Project created.");
      handleClose();
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to create project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "template" ? "Create a New Project" : "Project Details"}
          </DialogTitle>
        </DialogHeader>

        {step === "template" && (
          <div className="space-y-3">
            <Input
              placeholder="Search templates by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`w-full flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selectedTemplate === t.id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                  }`}>
                    {selectedTemplate === t.id ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button size="sm" onClick={() => setStep("details")}>Next: Project Details</Button>
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Template: <span className="font-medium text-foreground">{PROJECT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}</span>
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="pname">Project Name <span className="text-destructive">*</span></Label>
                <Input
                  id="pname"
                  placeholder="e.g. DPWH Road Widening — Marikina"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pclient">Client</Label>
                <Input
                  id="pclient"
                  placeholder="Client name"
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plocation">Location</Label>
                <Input
                  id="plocation"
                  placeholder="City / Province"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep("template")}>Back</Button>
              <Button size="sm" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Project"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
