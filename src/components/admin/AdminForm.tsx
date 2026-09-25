import type { ReactNode } from "react";

import { Button } from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const inputClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function EditorDialog({
  open,
  title,
  onClose,
  onSave,
  saving,
  error,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Changes are saved to the live app immediately.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          {children}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="outline" onClick={onEdit}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => {
          if (window.confirm("Delete this permanently? This cannot be undone.")) onDelete();
        }}
      >
        Delete
      </Button>
    </div>
  );
}

export const slugId = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
