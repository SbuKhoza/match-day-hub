import { useState } from "react";

import { EditorDialog, Field, RowActions, inputClass } from "@/components/admin/AdminForm";
import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, LoadingState } from "@/components/common/DataState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdminAction, useAdminNews } from "@/hooks/useAdmin";
import { useFirestore } from "@/hooks/useMasterData";
import { deleteNews, saveNews } from "@/services/adminService";
import type { Article, ArticleCategory } from "@/types";

const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: "team", label: "Club news" },
  { value: "league", label: "Around the league" },
  { value: "fantasy", label: "Fantasy" },
];

const blank = (): Article => ({
  id: "",
  headline: "",
  description: "",
  image: "",
  source: "Kickoff",
  publishedAt: new Date().toISOString(),
  category: "league",
});

export function AdminNewsScreen() {
  const { db } = useFirestore();
  const news = useAdminNews();
  const [draft, setDraft] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = useAdminAction((a: Article) => saveNews(db!, a), [["news"]]);
  const remove = useAdminAction((id: string) => deleteNews(db!, id), [["news"]]);
  const set = <K extends keyof Article>(key: K, value: Article[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  function submit() {
    if (!draft) return;
    if (!draft.headline.trim()) return setError("Headline is required.");
    setError(null);
    save.mutate(
      { ...draft, id: draft.id || `n-${Date.now().toString(36)}`, headline: draft.headline.trim() },
      { onSuccess: () => setDraft(null), onError: () => setError("Could not save. Try again.") },
    );
  }

  const list = news.data ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="News" subtitle="Articles published here appear on Home and the News page." />
        <Button onClick={() => { setError(null); setDraft(blank()); }}>Add article</Button>
      </div>
      {news.isLoading ? <LoadingState label="Loading news…" /> : null}
      {!news.isLoading && list.length === 0 ? <EmptyMessage title="No articles published yet." /> : null}
      {list.length > 0 ? (
        <Card>
          <CardBody className="divide-y divide-border p-2">
            {list.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.headline}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {CATEGORIES.find((c) => c.value === a.category)?.label} · {new Date(a.publishedAt).toLocaleDateString()}
                  </p>
                </div>
                <RowActions onEdit={() => { setError(null); setDraft(a); }} onDelete={() => remove.mutate(a.id)} />
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <EditorDialog
        open={draft !== null}
        title={draft?.id ? "Edit article" : "Add article"}
        onClose={() => setDraft(null)}
        onSave={submit}
        saving={save.isPending}
        error={error}
      >
        {draft ? (
          <>
            <Field label="Headline *">
              <input className={inputClass} value={draft.headline} onChange={(e) => set("headline", e.target.value)} />
            </Field>
            <Field label="Summary">
              <textarea
                rows={4}
                className={`${inputClass} h-auto py-2`}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field label="Image URL">
              <input className={inputClass} value={draft.image} onChange={(e) => set("image", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value as ArticleCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Source">
                <input className={inputClass} value={draft.source} onChange={(e) => set("source", e.target.value)} />
              </Field>
            </div>
          </>
        ) : null}
      </EditorDialog>
    </div>
  );
}
