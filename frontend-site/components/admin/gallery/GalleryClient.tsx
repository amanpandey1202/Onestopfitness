"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  TextArea,
  Toggle,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export type GalleryImage = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  posterUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export default function GalleryClient({ initial }: { initial: GalleryImage[] | null }) {
  const [images, setImages] = useState<GalleryImage[] | null>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setImages(data.images);
    } catch {
      setError("Couldn't load gallery.");
    }
  }, []);

  useEffect(() => {
    if (images === null) reload();
  }, [images, reload]);

  async function action(fn: () => Promise<Response>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      await reload();
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (images === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Photos and videos shown on the public gallery. Published ones are visible to visitors."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Photo/Video"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <GalleryForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/gallery/${editing.id}` : "/api/admin/gallery";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {images.length === 0 ? (
        <EmptyState title="No media yet">Upload your first gym photo or video.</EmptyState>
      ) : (
        <div className="g-auto">
          {images.map((img) => (
            <Card key={img.id} className="oc">
              {img.mediaType === "VIDEO" ? (
                <video
                  src={img.imageUrl}
                  poster={img.posterUrl ?? undefined}
                  muted
                  playsInline
                  controls
                  preload="metadata"
                  className="aspect-[4/3] w-full bg-black object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="obdy">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="otn">{img.title}</h3>
                  <Badge tone={img.mediaType === "VIDEO" ? "neutral" : "green"}>
                    {img.mediaType === "VIDEO" ? "Video" : "Photo"}
                  </Badge>
                </div>
                {img.description && <p className="ods">{img.description}</p>}
                <p className="odt">
                  Added {formatDate(img.createdAt)} ·{" "}
                  <span className={img.isPublished ? "tlm" : "trd"}>
                    {img.isPublished ? "Published" : "Draft"}
                  </span>
                </p>
                <div className="of">
                  <button
                    className="ab l"
                    onClick={() =>
                      action(() =>
                        fetch(`/api/admin/gallery/${img.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isPublished: !img.isPublished }),
                        })
                      )
                    }
                  >
                    {img.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="ab"
                      onClick={() => {
                        setEditing(img);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="ab d"
                      onClick={() => {
                        if (confirm(`Delete "${img.title}"? This can't be undone.`)) {
                          action(() => fetch(`/api/admin/gallery/${img.id}`, { method: "DELETE" }));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function GalleryForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: GalleryImage | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    imageUrl: editing?.imageUrl ?? "",
    mediaType: editing?.mediaType ?? ("IMAGE" as "IMAGE" | "VIDEO"),
    posterUrl: editing?.posterUrl ?? null,
    isPublished: editing?.isPublished ?? true,
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? "Edit media" : "Add photo or video"}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.imageUrl) return;
          const body: Record<string, unknown> = {
            title: f.title,
            description: f.description || null,
            imageUrl: f.imageUrl,
            mediaType: f.mediaType,
            posterUrl: f.posterUrl || null,
            isPublished: f.isPublished,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Media type">
            <Select
              value={f.mediaType}
              onChange={(e) =>
                setF((p) => ({ ...p, mediaType: e.target.value as "IMAGE" | "VIDEO" }))
              }
            >
              <option value="IMAGE">Photo</option>
              <option value="VIDEO">Video</option>
            </Select>
          </Field>
          <Field label="Media">
            <ImageUpload
              value={f.imageUrl}
              onChange={(url) => setF((p) => ({ ...p, imageUrl: url }))}
              onTypeChange={(type) => setF((p) => ({ ...p, mediaType: type }))}
              onPosterChange={(posterUrl) => setF((p) => ({ ...p, posterUrl }))}
              folder="gallery"
              allowVideo
              mediaType={f.mediaType}
            />
          </Field>
        </div>
        <Field label="Title">
          <Input required value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Description (optional)">
          <TextArea rows={2} value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} />
        </Field>
        <Toggle
          checked={f.isPublished}
          onChange={(v) => setF((p) => ({ ...p, isPublished: v }))}
          label="Publish to public gallery"
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={busy || !f.imageUrl}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Add Media"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
