"use client";

import { useCallback, useEffect, useState } from "react";
import {
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

export type Announcement = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  expiresAt: string | null;
  isPublished: boolean;
  publishAt: string;
};

export default function AnnouncementsClient({ initial }: { initial: Announcement[] | null }) {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(initial);
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
    if (announcements === null) reload();
  }, [announcements, reload]);

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
        <div className="space-y-3">
          {announcements.map((a) => {
            const expired = a.expiresAt ? new Date(a.expiresAt).getTime() < Date.now() : false;
            const tone = !a.isPublished ? "r" : expired ? "a" : "g";
            return (
              <div key={a.id} className="anr">
                <div className={`adot ${tone}`} />
                <div className="anly" style={{ flex: 1, minWidth: 0 }}>
                  <div className="row btw wrap" style={{ gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw6" style={{ fontSize: 14.5 }}>{a.title}</div>
                      <div className="txs tft" style={{ fontSize: 11.5, display: "block", marginTop: 2 }}>
                        {a.isPublished ? "Published" : "Draft"}
                        {a.expiresAt ? ` · expires ${formatDate(a.expiresAt)}` : " · no expiry"}
                        {expired && " · expired"}
                      </div>
                    </div>
                    <span className={`badge ${tone}`}>
                      {!a.isPublished ? "Draft" : expired ? "Expired" : "Live"}
                    </span>
                  </div>
                  <p className="txs" style={{ color: "var(--atext2)", marginTop: 8, lineHeight: 1.55 }}>
                    {a.body}
                  </p>
                </div>
                <div className="row nowrap" style={{ gap: 6 }}>
                  <button className="ab" onClick={() => { setEditing(a); setShowForm(true); }}>
                    Edit
                  </button>
                  <button
                    className={`ab ${a.isPublished ? "l" : ""}`}
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
                  </button>
                  <button
                    className="ab d"
                    onClick={() => {
                      if (confirm(`Delete announcement "${a.title}"?`)) {
                        action(() => fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" }));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}

          <p className="txs" style={{ padding: "16px 4px 0", color: "var(--atext3)", fontSize: 11.5 }}>
            Live announcements are shown in a striped bar at the very top of the homepage.
          </p>
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
