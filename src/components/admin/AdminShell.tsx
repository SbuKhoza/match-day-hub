import { Link } from "@tanstack/react-router";
import {
  FileUp,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Play,
  Settings,
  Shield,
  Shirt,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/teams", label: "Clubs", icon: Shield },
  { to: "/admin/players", label: "Players", icon: Shirt },
  { to: "/admin/import", label: "CSV import", icon: FileUp },
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/videos", label: "Videos", icon: Play },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Fantasy settings", icon: Settings },
] as const;

/** Separate management shell — administrators never see the fan navigation. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();

  const links = ADMIN_NAV.map((item) => (
    <Link
      key={item.to}
      to={item.to}
      activeOptions={{ exact: item.to === "/admin" }}
      activeProps={{ className: "bg-secondary text-foreground" }}
      inactiveProps={{ className: "text-muted-foreground" }}
      className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground"
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
            KO
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">Kickoff</span>
            <span className="block text-xs text-muted-foreground">Admin</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">{links}</nav>
        <div className="mt-6 space-y-3">
          <ThemeToggle withLabel />
          <p className="truncate px-2 text-xs text-muted-foreground">{user?.email}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-base font-semibold tracking-tight">Kickoff Admin</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Sign out"
                onClick={() => void logout()}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">{links}</nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
