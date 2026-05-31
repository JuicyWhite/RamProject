import { HardHat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <HardHat className="h-4.5 w-4.5 text-primary-foreground" aria-hidden />
        </div>
        <span className="text-lg font-semibold tracking-tight">Ascend</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
