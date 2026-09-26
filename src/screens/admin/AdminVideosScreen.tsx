import { useState } from "react";

import { EditorDialog, Field, RowActions, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction, useAdminVideos } from "@/hooks/useAdmin";
import { useFirestore } from "@/hooks/useMasterData";
import { deleteVideo, saveVideo } from "@/services/adminService";
import type { Video } from "@/types";

const blank = (): Video => ({
  id: "",
  title: "",
  thumbnail: "",
  duration: "",
  views: "",
  url: "",
  publishedAt: new Date().toISOString(),
});

export function AdminVideosScreen() {
  const { db } = useFirestore();
  const videos = useAdminVideos();
  const [draft, setDraft] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = useAdminAction((v: Video) => saveVideo(db!, v), [["videos"]]);
  const remove = useAdminAction((id: string) => deleteVideo(db!, id), [["videos"]]);
  const set = <K extends keyof Video>(key: K, value: Video[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  function submit() {
    if (!draft) return;
    if (!draft.title.trim()) return setError("Title is required.");
    if (!draft.url?.trim()) return setError("Video link is required.");
    setError(null);
    save.mutate(
      { ...draft, id: draft.id || `v-${Date.now().toString(36)}`, title: draft.title.trim() },
      { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") },
    );
  }

  const list = videos.data ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Videos" subtitle="Videos published here appear on Home and the Videos page." />
        <Button onClick={() => { setError(null); setDraft(blank()); }}>Add video</Button>
      </div>
      {videos.isLoading ? <LoadingState label="Loading videos…" /> : null}
      {!videos.isLoading && list.length === 0 ? <EmptyMessage title="No videos published yet." /> : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-2 py-2.5">
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt="" className="h-10 w-16 rounded-lg object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.duration || "—"} · {v.url}</p>
                </div>
                <RowActions onEdit={() => { setError(null); setDraft(v); }} onDelete={() => remove.mutate(v.id)} />
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <EditorDialog
        open={draft !== null}
        title={draft?.id ? "Edit video" : "Add video"}
        onClose={() => setDraft(null)}
        onSave={submit}
        saving={save.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Title *">
              <input className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Video link *">
              <input className={inputClass} value={draft.url ?? ""} onChange={(e) => set("url", e.target.value)} />
            </Field>
            <Field label="Thumbnail image URL">
              <input className={inputClass} value={draft.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} />
            </Field>
            <Field label="Duration (e.g. 3:45)">
              <input className={inputClass} value={draft.duration} onChange={(e) => set("duration", e.target.value)} />
            </Field>
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}
