"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateProjectSchema } from "@/validations/project";
import type { CreateProjectInput } from "@/validations/project";
import { createProject, updateProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DPWH_REGIONS } from "@/lib/utils";
import type { Project } from "@prisma/client";

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: project?.name ?? "",
      code: project?.code ?? "",
      client: project?.client ?? "",
      location: project?.location ?? "",
      region: project?.region ?? "",
      contractType: project?.contractType ?? "PRIVATE",
      philgepsRef: project?.philgepsRef ?? "",
      permitNumber: project?.permitNumber ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "DRAFT",
      overheadPct: project?.overheadPct ? Number(project.overheadPct) : 0,
      profitPct: project?.profitPct ? Number(project.profitPct) : 0,
      vatPct: project?.vatPct ? Number(project.vatPct) : 12,
      budget: project?.budget ? Number(project.budget) : undefined,
      contractAmount: project?.contractAmount
        ? Number(project.contractAmount)
        : undefined,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const contractType = watch("contractType");

  async function onSubmit(data: CreateProjectInput) {
    try {
      if (project) {
        await updateProject(project.id, data);
        toast.success("Project updated");
        router.refresh();
      } else {
        const created = await createProject(data);
        toast.success("Project created");
        router.push(`/projects/${created.id}`);
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Core info */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Basic Info
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="name">Project name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. DPWH Bridge Rehab — Laguna"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Project code</Label>
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g. PRJ-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="client">Client / Owner</Label>
            <Input
              id="client"
              {...register("client")}
              placeholder="Client name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={project?.status ?? "DRAFT"}
              onValueChange={(v) => setValue("status", v as never)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="location">Location / Address</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="Barangay, Municipality, Province"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region">DPWH Region</Label>
            <Select
              defaultValue={project?.region ?? ""}
              onValueChange={(v) => setValue("region", v)}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {DPWH_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Scope of work, special conditions, etc."
            rows={3}
          />
        </div>
      </fieldset>

      {/* Contract type */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Contract
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contractType">Contract type</Label>
            <Select
              defaultValue={project?.contractType ?? "PRIVATE"}
              onValueChange={(v) => setValue("contractType", v as never)}
            >
              <SelectTrigger id="contractType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Private</SelectItem>
                <SelectItem value="GOVERNMENT">Government</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {contractType === "GOVERNMENT" && (
            <div className="space-y-1.5">
              <Label htmlFor="philgepsRef">PhilGEPS Reference No.</Label>
              <Input
                id="philgepsRef"
                {...register("philgepsRef")}
                placeholder="e.g. 3456789"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="permitNumber">Permit / Project No.</Label>
            <Input
              id="permitNumber"
              {...register("permitNumber")}
              placeholder="Building permit or project number"
            />
          </div>
        </div>
      </fieldset>

      {/* Financials */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Financials (PHP)
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              min="0"
              {...register("budget")}
              placeholder="0.00"
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contractAmount">Contract Amount</Label>
            <Input
              id="contractAmount"
              type="number"
              step="0.01"
              min="0"
              {...register("contractAmount")}
              placeholder="0.00"
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="overheadPct">Overhead %</Label>
            <Input
              id="overheadPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("overheadPct")}
              placeholder="0"
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profitPct">Profit %</Label>
            <Input
              id="profitPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("profitPct")}
              placeholder="0"
              className="tabular"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="vatPct">VAT %</Label>
            <Input
              id="vatPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register("vatPct")}
              placeholder="12"
              className="tabular"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date</Label>
            <Input
              id="endDate"
              type="date"
              {...register("endDate")}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : project
            ? "Save changes"
            : "Create project"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
