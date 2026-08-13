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
  TextArea,
  Toggle,
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

type Announcement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  expiresAt: string | null;
  isPublished: boolean;
  publishAt: string;
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setAnnouncements(data.announcements);
    } catch {
      setError("Couldn't load announcements.");
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

  if (announcements === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Short notices shown at the top of the homepage."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ New Announcement"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <AnnouncementForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/announcements/${editing.id}` : "/api/admin/announcements";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {announcements.length === 0 ? (
        <EmptyState title="No announcements yet">Post a notice for members.</EmptyState>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {a.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt={a.title} className="h-20 w-32 rounded-md border border-white/10 object-cover" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                    {a.title}
                  </h3>
                  <Badge tone={a.isPublished ? "green" : "red"}>
                    {a.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-white/65">{a.body}</p>
                <p className="mt-1 text-xs text-white/40">
                  Posted {formatDate(a.publishAt)}
                  {a.expiresAt ? ` · expires ${formatDate(a.expiresAt)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setEditing(a);
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
                      fetch(`/api/admin/announcements/${a.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPublished: !a.isPublished }),
                      })
                    )
                  }
                >
                  {a.isPublished ? "Draft" : "Publish"}
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (confirm(`Delete announcement "${a.title}"?`)) {
                      action(() => fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" }));
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

function AnnouncementForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Announcement | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    body: editing?.body ?? "",
    imageUrl: editing?.imageUrl ?? "",
    expiresAt: toDateInput(editing?.expiresAt),
    isPublished: editing?.isPublished ?? true,
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.title}` : "New announcement"}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            title: f.title,
            body: f.body,
            imageUrl: f.imageUrl || null,
            expiresAt: f.expiresAt || null,
            isPublished: f.isPublished,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <Field label="Title">
          <Input required value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Message">
          <TextArea required rows={3} value={f.body} onChange={(e) => setF((p) => ({ ...p, body: e.target.value }))} />
        </Field>
        <Field label="Expires on (optional)">
          <Input type="date" value={f.expiresAt} onChange={(e) => setF((p) => ({ ...p, expiresAt: e.target.value }))} />
        </Field>
        <Field label="Image (optional)">
          <ImageUpload value={f.imageUrl} onChange={(url) => setF((p) => ({ ...p, imageUrl: url }))} folder="announcements" />
        </Field>
        <Toggle
          checked={f.isPublished}
          onChange={(v) => setF((p) => ({ ...p, isPublished: v }))}
          label="Published (visible on homepage)"
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Announcement"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
