import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = { title: "New Project" };

export default function NewProjectPage() {
  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Projects
        </Link>
      </div>

      <div>
        <h1 className="text-lg font-semibold">New Project</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fill in the project details to get started.
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
