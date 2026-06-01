"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications } from "@/actions/notifications";

type Notification = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  type: string;
  createdAt: string;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  CHANGE_ORDER: "bg-blue-500",
  RISK: "bg-red-500",
  INCIDENT: "bg-orange-500",
  TASK: "bg-purple-500",
};

function typeColor(type: string): string {
  return TYPE_COLORS[type] ?? "bg-gray-400";
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readAt, setReadAt] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("notificationsReadAt");
    setReadAt(stored);
    getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(
    (n) => !readAt || new Date(n.createdAt) > new Date(readAt)
  ).length;

  const badgeLabel = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  function markAllRead() {
    const now = new Date().toISOString();
    localStorage.setItem("notificationsReadAt", now);
    setReadAt(now);
  }

  const visible = notifications.slice(0, 15);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative">
          <Bell className="h-3.5 w-3.5" />
          {badgeLabel && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold leading-none text-white">
              {badgeLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <button
            onClick={markAllRead}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            visible.map((n) => {
              const isUnread = !readAt || new Date(n.createdAt) > new Date(readAt);
              const inner = (
                <div
                  className={`flex items-start gap-2.5 px-3 py-2.5 ${isUnread ? "border-l-2 border-l-primary bg-muted/30" : "border-l-2 border-l-transparent"}`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${typeColor(n.type)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">{n.title}</p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              );

              if (n.link) {
                return (
                  <button
                    key={n.id}
                    className="w-full text-left hover:bg-muted/50 transition-colors"
                    onClick={() => { window.location.href = n.link!; }}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <div key={n.id}>
                  {inner}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-3 py-1.5">
          <p className="text-xs text-muted-foreground">Showing last 30</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
