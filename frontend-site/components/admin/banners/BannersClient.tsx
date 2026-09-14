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

export type Banner = {
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

function bannerChip(b: Banner) {
  const now = Date.now();
  if (!b.isPublished) return { label: "Draft", tone: "red" as const };
  if (b.endDate && now > new Date(b.endDate).getTime())
    return { label: "Ended", tone: "neutral" as const };
  if (b.startDate && now < new Date(b.startDate).getTime())
    return { label: "Scheduled", tone: "yellow" as const };
  return { label: "Live", tone: "green" as const };
}

export default function BannersClient({ initial }: { initial: Banner[] | null }) {
  const [banners, setBanners] = useState<Banner[] | null>(initial);
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
    if (banners === null) reload();
  }, [banners, reload]);

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
        <div className="g2">
          {banners.map((b) => {
            const chip = bannerChip(b);
            return (
              <Card key={b.id} className="oc">
                <div className="ccn-cv">
                  {b.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt={b.title} className="ccn-img" />
                  )}
                </div>
                <div className="obdy">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="otn">{b.title}</h3>
                    <Badge tone={chip.tone}>{chip.label}</Badge>
                  </div>
                  {b.subtitle && <p className="ods">{b.subtitle}</p>}
                  <p className="odt">
                    {b.startDate
                      ? `${formatDate(b.startDate)} → ${b.endDate ? formatDate(b.endDate) : "ongoing"}`
                      : "No date window"}
                    {b.buttonText ? ` · CTA: ${b.buttonText}` : ""}
                  </p>
                  <div className="of">
                    <button
                      className="ab l"
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
                    </button>
                    <div className="flex gap-2">
                      <button
                        className="ab"
                        onClick={() => {
                          setEditing(b);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="ab d"
                        onClick={() => {
                          if (confirm(`Delete banner "${b.title}"?`)) {
                            action(() => fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" }));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
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
