import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
          KO
        </span>
        <span className="text-base font-semibold tracking-tight">Kickoff</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}