import { Link } from "@tanstack/react-router";

import { NAV_ITEMS } from "./navItems";

export function BottomNav() {
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2">
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