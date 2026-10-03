import { useRef, useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useFirestore } from "@/hooks/useMasterData";
import {
  BRAND_SLOTS,
  removeBrandImage,
  uploadBrandImage,
  validateBrandFile,
  type BrandSlot,
} from "@/services/brandingService";
import { useQueryClient } from "@tanstack/react-query";

export function BrandingCard() {
  const { db } = useFirestore();
  const { services } = useAuth();
  const { branding } = useBranding();
  const client = useQueryClient();
  const [busy, setBusy] = useState<BrandSlot | null>(null);
  const [message, setMessage] = useState<{ slot: BrandSlot; text: string; error: boolean } | null>(null);
  const inputs = useRef<Partial<Record<BrandSlot, HTMLInputElement | null>>>({});

  async function refresh() {
    await client.invalidateQueries({ queryKey: ["settings", "branding"] });
  }

  async function onPick(slot: BrandSlot, file: File | undefined) {
    if (!file || !db || !services) return;
    const problem = validateBrandFile(file);
    if (problem) return setMessage({ slot, text: problem, error: true });
    setBusy(slot);
    setMessage(null);
    try {
      await uploadBrandImage(db, services.storage, slot, file, branding[slot]);
      await refresh();
      setMessage({ slot, text: "Saved. The app now shows this image.", error: false });
    } catch {
      setMessage({ slot, text: "Upload failed. Check your connection and admin access, then try again.", error: true });
    } finally {
      setBusy(null);
      const input = inputs.current[slot];
      if (input) input.value = "";
    }
  }

  async function onRemove(slot: BrandSlot) {
    if (!db || !services) return;
    setBusy(slot);
    setMessage(null);
    try {
      await removeBrandImage(db, services.storage, slot, branding[slot]);
      await refresh();
      setMessage({ slot, text: "Image removed.", error: false });
    } catch {
      setMessage({ slot, text: "Could not remove the image. Try again.", error: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5 p-4">
        <div>
          <h2 className="text-base font-semibold">Branding</h2>
          <p className="text-sm text-muted-foreground">
            Each image has its own place in the app. PNG, JPG, WebP, SVG or GIF, up to 2 MB. Use a transparent PNG or SVG
            for the logo and a wide image for the navigation bars.
          </p>
        </div>

        {BRAND_SLOTS.map(({ slot, label, hint }) => {
          const image = branding[slot];
          const working = busy === slot;
          return (
            <div key={slot} className="flex flex-wrap items-center gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                {image ? (
                  <img src={image.url} alt={label} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={(node) => {
                      inputs.current[slot] = node;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(event) => void onPick(slot, event.target.files?.[0])}
                  />
                  <Button size="sm" disabled={working || !services} onClick={() => inputs.current[slot]?.click()}>
                    {working ? "Working…" : image ? "Replace" : "Upload"}
                  </Button>
                  {image ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={working}
                      onClick={() => void onRemove(slot)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {message?.slot === slot ? (
                  <p className={`text-sm font-medium ${message.error ? "text-destructive" : ""}`}>{message.text}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>
  );
}