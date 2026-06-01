import type { Metadata } from "next";
import { ToolsShell } from "@/components/tools/tools-shell";

export const metadata: Metadata = { title: "Engineering Tools" };

export default function ToolsPage() {
  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold">Engineering Tools</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unit converter, formula reference, and construction calculators.
        </p>
      </div>
      <ToolsShell />
    </div>
  );
}
