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
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

type Competition = {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  maxParticipants: number | null;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  _count: { participants: number };
};

const statusTone: Record<Competition["status"], "green" | "red" | "neutral"> = {
  PUBLISHED: "green",
  CLOSED: "red",
  DRAFT: "neutral",
};

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[] | null>(null);
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
        <div className="space-y-4">
          {competitions.map((c) => (
            <Card key={c.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {c.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.bannerUrl} alt={c.title} className="h-20 w-32 rounded-md border border-white/10 object-cover" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                    {c.title}
                  </h3>
                  <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                </div>
                {c.description && <p className="mt-1 text-sm text-white/60">{c.description}</p>}
                <p className="mt-1 text-xs text-white/40">
                  {c.startDate ? `${formatDate(c.startDate)} → ${formatDate(c.endDate)}` : "No dates set"} ·{" "}
                  {c._count.participants} joined{c.maxParticipants ? ` / ${c.maxParticipants} max` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setEditing(c);
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
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (confirm(`Delete competition "${c.title}"?`)) {
                      action(() => fetch(`/api/admin/competitions/${c.id}`, { method: "DELETE" }));
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
