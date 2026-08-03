import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function AuthField({ label, id, className, ...props }: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={fieldId}
        className={cn(
          "h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring",
          className,
        )}
        {...props}
      />
    </div>
  );
}