"use client";

import { useCallback, useEffect, useState } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  TextArea,
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

export type Competition = {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  linkUrl: string | null;
  clickCount: number;
  startDate: string | null;
  endDate: string | null;
  maxParticipants: number | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  _count: { participants: number };
};

export default function CompetitionsClient({ initial }: { initial: Competition[] | null }) {
  const [competitions, setCompetitions] = useState<Competition[] | null>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/competitions");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setCompetitions(data.competitions);
    } catch {
      setError("Couldn't load competitions.");
    }
  }, []);

  useEffect(() => {
    if (competitions === null) reload();
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowForm(true);
    }
  }, [competitions, reload]);

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

  if (competitions === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Competitions"
        subtitle="Challenges members can join from the homepage."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Competition"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <CompetitionForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/competitions/${editing.id}` : "/api/admin/competitions";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {competitions.length === 0 ? (
        <EmptyState title="No competitions yet">Create a challenge to engage members.</EmptyState>
      ) : (
        <div className="g2">
          {competitions.map((c) => {
            const statusKey = c.status === "PUBLISHED" ? "g" : c.status === "CLOSED" ? "r" : "n";
            const now = Date.now();
            const started = c.startDate ? new Date(c.startDate).getTime() <= now : false;
            const live = started && (!c.endDate || new Date(c.endDate).getTime() >= now);
            return (
              <div key={c.id} className="cc" style={!c.bannerUrl ? { paddingTop: 20 } : undefined}>
                {(c.bannerUrl || statusKey === "g") && (
                  <div className="ccn-cv" style={!c.bannerUrl ? { height: 56, padding: "0 4px" } : undefined}>
                    {c.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.bannerUrl} alt="" className="ccn-img" />
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" style={{ width: 26, height: 26 }}>
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21 1.18.54 2.03 2.03 2.03 3.79" />
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                      </svg>
                    )}
                    <span className="ccn-chip">{started ? (live ? "LIVE" : "ENDED") : "UPCOMING"}</span>
                  </div>
                )}
                <div className="ccm" style={{ padding: "14px 18px" }}>
                  <div className="row btw wrap" style={{ gap: 8 }}>
                    <div className="ccn" style={{ fontSize: 17 }}>{c.title}</div>
                    <span className={`badge ${statusKey}`}>{c.status}</span>
                  </div>
                  {c.description && (
                    <p className="txs" style={{ color: "var(--atext2)", margin: "8px 0 0", lineHeight: 1.55 }}>
                      {c.description}
                    </p>
                  )}
                  <div className="mt8 txs tft" style={{ color: "var(--atext3)", fontSize: 11.5 }}>
                    <span className="mo">
                      {c.startDate ? `${formatDate(c.startDate)} → ${formatDate(c.endDate)}` : "No dates set"}
                    </span>
                  </div>
                </div>
                <div className="of">
                  <span className="txs" style={{ color: "var(--atext2)", fontSize: 11.5 }}>
                    <span className="tmo fw6" style={{ color: "var(--atext1)" }}>{c._count.participants}</span> joined
                    {c.maxParticipants ? ` of ${c.maxParticipants}` : " · unlimited"}
                    {c.linkUrl ? ` · ${c.clickCount} form clicks` : ""}
                  </span>
                  <div className="row nowrap" style={{ gap: 6 }}>
                    <button className="ab" onClick={() => { setEditing(c); setShowForm(true); }}>
                      Edit
                    </button>
                    <button
                      className={`ab ${c.status === "PUBLISHED" ? "" : "l"}`}
                      onClick={() =>
                        action(() =>
                          fetch(`/api/admin/competitions/${c.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              status: c.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                            }),
                          })
                        )
                      }
                    >
                      {c.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className="ab d"
                      onClick={() => {
                        if (confirm(`Delete competition "${c.title}"?`)) {
                          action(() => fetch(`/api/admin/competitions/${c.id}`, { method: "DELETE" }));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function CompetitionForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Competition | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    bannerUrl: editing?.bannerUrl ?? "",
    linkUrl: editing?.linkUrl ?? "",
    startDate: toDateInput(editing?.startDate),
    endDate: toDateInput(editing?.endDate),
    maxParticipants: editing?.maxParticipants?.toString() ?? "",
    status: editing?.status ?? "DRAFT",
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.title}` : "Add a competition"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            title: f.title,
            description: f.description || null,
            bannerUrl: f.bannerUrl || null,
            linkUrl: f.linkUrl || null,
            startDate: f.startDate || null,
            endDate: f.endDate || null,
            maxParticipants: f.maxParticipants ? Number(f.maxParticipants) : null,
            status: f.status,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <div className="sm:col-span-2">
          <Field label="Banner image (optional)">
            <ImageUpload value={f.bannerUrl} onChange={(url) => setF((p) => ({ ...p, bannerUrl: url }))} folder="competitions" />
          </Field>
        </div>
        <Field label="Title">
          <Input required value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={(e) => setF((p) => ({ ...p, status: e.target.value as Competition["status"] }))}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Registration form link" hint='External Google Form. When set, the homepage card shows a "Fill form" button and tracks how many people open it.'>
            <Input
              type="url"
              placeholder="https://forms.gle/…"
              value={f.linkUrl}
              onChange={(e) => setF((p) => ({ ...p, linkUrl: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Start date">
          <Input type="date" value={f.startDate} onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))} />
        </Field>
        <Field label="End date">
          <Input type="date" value={f.endDate} onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))} />
        </Field>
        <Field label="Max participants" hint="Leave blank for unlimited.">
          <Input type="number" min={1} value={f.maxParticipants} onChange={(e) => setF((p) => ({ ...p, maxParticipants: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <TextArea rows={3} value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} />
          </Field>
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Competition"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
