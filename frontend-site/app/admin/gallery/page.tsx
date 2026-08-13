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

type GalleryImage = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  isPublished: boolean;
  createdAt: string;
};

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[] | null>(null);
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
    reload();
  }, [reload]);

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden">
              {img.mediaType === "VIDEO" ? (
                <video
                  src={img.imageUrl}
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
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white">{img.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={img.mediaType === "VIDEO" ? "neutral" : "green"}>
                      {img.mediaType === "VIDEO" ? "Video" : "Photo"}
                    </Badge>
                    <Badge tone={img.isPublished ? "green" : "red"}>
                      {img.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                {img.description && (
                  <p className="mt-1 text-sm text-white/55">{img.description}</p>
                )}
                <p className="mt-2 text-xs text-white/40">Added {formatDate(img.createdAt)}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 px-3 py-1.5 text-xs"
                    onClick={() => {
                      setEditing(img);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 px-3 py-1.5 text-xs"
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
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (confirm(`Delete "${img.title}"? This can't be undone.`)) {
                        action(() => fetch(`/api/admin/gallery/${img.id}`, { method: "DELETE" }));
                      }
                    }}
                  >
                    Delete
                  </Button>
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
