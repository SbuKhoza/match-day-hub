/**
 * Site branding images (logo, top navigation, bottom navigation).
 * Files live in Firebase Storage under `branding/`; their URLs are kept in
 * the `settings/branding` Firestore document, which only admins may write.
 */
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  type FirebaseStorage,
} from "firebase/storage";

export type BrandSlot = "logo" | "topNav" | "bottomNav";

export interface BrandImage {
  url: string;
  /** Storage path, kept so the old file can be removed on replace. */
  path: string;
}

export interface Branding {
  logo: BrandImage | null;
  topNav: BrandImage | null;
  bottomNav: BrandImage | null;
}

export const EMPTY_BRANDING: Branding = { logo: null, topNav: null, bottomNav: null };

export const BRAND_SLOTS: { slot: BrandSlot; label: string; hint: string }[] = [
  {
    slot: "logo",
    label: "Logo",
    hint: "Replaces the PSL badge next to the app name in the top bar (mobile) and sidebar header (desktop).",
  },
  {
    slot: "topNav",
    label: "Top navigation image",
    hint: "Fills the background of the top navigation: the top bar on mobile and the header area of the sidebar on desktop.",
  },
  {
    slot: "bottomNav",
    label: "Bottom navigation image",
    hint: "Fills the background of the bottom navigation bar. Mobile only; it does not appear on desktop.",
  },
];

export const MAX_BRAND_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];

const SETTINGS_DOC = ["settings", "branding"] as const;

function readImage(data: Record<string, unknown>, slot: BrandSlot): BrandImage | null {
  const url = data[`${slot}Url`];
  const path = data[`${slot}Path`];
  return typeof url === "string" && url ? { url, path: typeof path === "string" ? path : "" } : null;
}

export async function getBranding(db: Firestore): Promise<Branding> {
  const snapshot = await getDoc(doc(db, ...SETTINGS_DOC));
  if (!snapshot.exists()) return EMPTY_BRANDING;
  const data = snapshot.data();
  return {
    logo: readImage(data, "logo"),
    topNav: readImage(data, "topNav"),
    bottomNav: readImage(data, "bottomNav"),
  };
}

/** Returns an error message when the file can't be used, otherwise null. */
export function validateBrandFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Use a PNG, JPG, WebP, SVG or GIF image.";
  if (file.size > MAX_BRAND_IMAGE_BYTES) return "The image must be 2 MB or smaller.";
  return null;
}

async function removeQuietly(storage: FirebaseStorage, path: string): Promise<void> {
  if (!path) return;
  await deleteObject(ref(storage, path)).catch(() => undefined);
}

export async function uploadBrandImage(
  db: Firestore,
  storage: FirebaseStorage,
  slot: BrandSlot,
  file: File,
  previous: BrandImage | null,
): Promise<void> {
  const error = validateBrandFile(file);
  if (error) throw new Error(error);

  const extension = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `branding/${slot}-${Date.now()}.${extension || "png"}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type, cacheControl: "public,max-age=31536000" });
  const url = await getDownloadURL(fileRef);

  await setDoc(
    doc(db, ...SETTINGS_DOC),
    { [`${slot}Url`]: url, [`${slot}Path`]: path, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  if (previous) await removeQuietly(storage, previous.path);
}

export async function removeBrandImage(
  db: Firestore,
  storage: FirebaseStorage,
  slot: BrandSlot,
  previous: BrandImage | null,
): Promise<void> {
  await setDoc(
    doc(db, ...SETTINGS_DOC),
    { [`${slot}Url`]: null, [`${slot}Path`]: null, updatedAt: new Date().toISOString() },
    { merge: true },
  );
  if (previous) await removeQuietly(storage, previous.path);
}