"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Library,
  Settings,
  ChevronRight,
  HardHat,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
  },
  {
    href: "/rates",
    label: "Rate Library",
    icon: Library,
  },
  {
    href: "/tools",
    label: "Eng. Tools",
    icon: Wrench,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface SidebarProps {
  orgName: string;
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname();

  function isActive(item: (typeof navItems)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside
      className="flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar"
      aria-label="Main navigation"
    >
      {/* Logo / org name */}
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
          <HardHat className="h-3.5 w-3.5 text-primary-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground">
            Ascend
          </p>
          <p className="truncate text-2xs text-muted-foreground leading-tight">
            {orgName}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Sidebar navigation">
        <ul role="list" className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "opacity-70")}
                    aria-hidden
                  />
                  {item.label}
                  {active && (
                    <ChevronRight className="ml-auto h-3 w-3 opacity-40" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
