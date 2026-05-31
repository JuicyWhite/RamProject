import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center space-y-2">
        <p className="text-5xl font-bold tabular">404</p>
        <p className="text-base font-medium">Page not found</p>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
