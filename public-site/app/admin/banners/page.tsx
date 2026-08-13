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
  Spinner,
  Toggle,
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  startDate: string | null;
  endDate: string | null;
  isPublished: boolean;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/banners");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setBanners(data.banners);
    } catch {
      setError("Couldn't load banners.");
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

  if (banners === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Banners"
        subtitle="Hero banners on the homepage. The first published one drives the hero section."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Banner"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <BannerForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {banners.length === 0 ? (
        <EmptyState title="No banners yet">Create a hero banner for the homepage.</EmptyState>
      ) : (
        <div className="space-y-4">
          {banners.map((b) => (
            <Card key={b.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {b.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt={b.title} className="h-20 w-32 rounded-md border border-white/10 object-cover" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                    {b.title}
                  </h3>
                  <Badge tone={b.isPublished ? "green" : "red"}>
                    {b.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {b.subtitle && <p className="mt-1 text-sm text-white/60">{b.subtitle}</p>}
                <p className="mt-1 text-xs text-white/40">
                  {b.startDate ? `${formatDate(b.startDate)} → ${b.endDate ? formatDate(b.endDate) : "ongoing"}` : "No date window"}
                  {b.buttonText ? ` · CTA: ${b.buttonText}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setEditing(b);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() =>
                    action(() =>
                      fetch(`/api/admin/banners/${b.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPublished: !b.isPublished }),
                      })
                    )
                  }
                >
                  {b.isPublished ? "Draft" : "Publish"}
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (confirm(`Delete banner "${b.title}"?`)) {
                      action(() => fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" }));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function BannerForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Banner | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    subtitle: editing?.subtitle ?? "",
    imageUrl: editing?.imageUrl ?? "",
    buttonText: editing?.buttonText ?? "",
    buttonLink: editing?.buttonLink ?? "",
    startDate: toDateInput(editing?.startDate),
    endDate: toDateInput(editing?.endDate),
    isPublished: editing?.isPublished ?? true,
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.title}` : "Add a banner"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            title: f.title,
            subtitle: f.subtitle || null,
            imageUrl: f.imageUrl || null,
            buttonText: f.buttonText || null,
            buttonLink: f.buttonLink || null,
            startDate: f.startDate || null,
            endDate: f.endDate || null,
            isPublished: f.isPublished,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <div className="sm:col-span-2">
          <Field label="Banner image (optional)">
            <ImageUpload value={f.imageUrl} onChange={(url) => setF((p) => ({ ...p, imageUrl: url }))} folder="banners" />
          </Field>
        </div>
        <Field label="Headline">
          <Input required value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Subtitle">
          <Input value={f.subtitle} onChange={(e) => setF((p) => ({ ...p, subtitle: e.target.value }))} />
        </Field>
        <Field label="Button text (optional)">
          <Input value={f.buttonText} onChange={(e) => setF((p) => ({ ...p, buttonText: e.target.value }))} />
        </Field>
        <Field label="Button link (optional)">
          <Input value={f.buttonLink} onChange={(e) => setF((p) => ({ ...p, buttonLink: e.target.value }))} />
        </Field>
        <Field label="Start date">
          <Input type="date" value={f.startDate} onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))} />
        </Field>
        <Field label="End date">
          <Input type="date" value={f.endDate} onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle
            checked={f.isPublished}
            onChange={(v) => setF((p) => ({ ...p, isPublished: v }))}
            label="Published (visible on homepage)"
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Banner"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
