import { Link } from "@tanstack/react-router";

import { NAV_ITEMS } from "./navItems";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/format";

export function Sidebar() {
  const { profile, user } = useAuth();
  const name = profile?.name ?? user?.displayName ?? "Guest";

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <Link to="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
          KO
        </span>
        <span className="text-lg font-semibold tracking-tight">Kickoff</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to as never}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        <ThemeToggle withLabel />
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-secondary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {initials(name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile?.email ?? user?.email ?? "Not signed in"}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}