import { Link } from "@tanstack/react-router";

import { BrandBackground } from "./BrandBackground";
import { BrandImage } from "./BrandImage";
import { useBranding } from "@/hooks/useBranding";

export function TopBar() {
  const { branding } = useBranding();

  return (
    <header className="glass sticky top-0 z-30 flex items-center overflow-hidden px-4 py-2.5 lg:hidden">
      <BrandBackground image={branding.topNav} />
      <Link to="/" className="relative flex items-center gap-2.5">
        {branding.logo ? (
          <BrandImage image={branding.logo} alt="Logo" className="h-9" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[11px] font-bold tracking-tight text-black">
            PSL
          </span>
        )}
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