import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
    >
      <Icon className="h-4 w-4" />
      {withLabel ? <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span> : null}
    </button>
  );
}