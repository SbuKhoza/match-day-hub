import { Link } from "@tanstack/react-router";

import { BrandBackground } from "./BrandBackground";
import { BrandImage } from "./BrandImage";
import { NAV_ITEMS } from "./navItems";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { initials } from "@/utils/format";

export function Sidebar() {
  const { profile, user } = useAuth();
  const { branding } = useBranding();
  const name = profile?.name ?? user?.displayName ?? "Guest";

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col glass px-4 py-6 lg:flex">
      <div className="relative mb-8 overflow-hidden rounded-2xl">
        <BrandBackground image={branding.topNav} />
        <Link to="/" className="relative flex items-center gap-3 px-2 py-2">
          {branding.logo ? (
            <BrandImage image={branding.logo} alt="Logo" className="h-10" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-black">
              PSL
            </span>
          )}
          <span className="text-base font-semibold tracking-tight">Premier Soccer League</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to as never}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "bg-primary/20 text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-3">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-xs font-semibold">
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