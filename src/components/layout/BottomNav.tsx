import { Link } from "@tanstack/react-router";

import { BrandBackground } from "./BrandBackground";
import { NAV_ITEMS } from "./navItems";
import { useBranding } from "@/hooks/useBranding";

export function BottomNav() {
  const { branding } = useBranding();
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 glass overflow-hidden pb-[env(safe-area-inset-bottom)] lg:hidden">
      <BrandBackground image={branding.bottomNav} />
      <ul className="relative mx-auto flex max-w-xl items-stretch justify-between px-2">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <Link
              to={item.to as never}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-[11px] font-medium"
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label === "Match Center" ? "Matches" : item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}