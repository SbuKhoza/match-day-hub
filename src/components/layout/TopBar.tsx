import { Link } from "@tanstack/react-router";

export function TopBar() {
  return (
    <header className="glass sticky top-0 z-30 flex items-center px-4 py-2.5 lg:hidden">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[11px] font-bold tracking-tight text-black">
          PSL
        </span>
        <span className="leading-tight">
          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
            South Africa
          </span>
          <span className="block text-sm font-semibold">Premier Soccer League</span>
        </span>
      </Link>
    </header>
  );
}
