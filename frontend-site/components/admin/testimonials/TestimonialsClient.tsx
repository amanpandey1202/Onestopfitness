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

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  imageUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export default function TestimonialsClient({ initial }: { initial: Testimonial[] | null }) {
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setTestimonials(data.testimonials);
    } catch {
      setError("Couldn't load testimonials.");
    }
  }, []);

  useEffect(() => {
    if (testimonials === null) reload();
  }, [testimonials, reload]);

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

  if (testimonials === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Testimonials"
        subtitle="Reviews shown on the homepage carousel. Paste your real Google Maps reviews here."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ New Testimonial"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <TestimonialForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/testimonials/${editing.id}` : "/api/admin/testimonials";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {testimonials.length === 0 ? (
        <EmptyState title="No testimonials yet">
          Add your first Google review so visitors see real feedback.
        </EmptyState>
      ) : (
        <div className="g2">
          {testimonials.map((t) => (
            <Card key={t.id} className="oc">
              <div className="obdy">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-gym-black">
                      {t.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-anton text-lg text-gym-lime">
                          {t.name.trim().charAt(0).toUpperCase() || "M"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="otn truncate">{t.name}</p>
                      {t.role && <p className="ods">{t.role}</p>}
                    </div>
                  </div>
                  <Badge tone={t.isPublished ? "green" : "red"}>
                    {t.isPublished ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <p className="mt-3 text-[13px] italic leading-relaxed text-white/65">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="of">
                  <button
                    className="ab l"
                    onClick={() =>
                      action(() =>
                        fetch(`/api/admin/testimonials/${t.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isPublished: !t.isPublished }),
                        })
                      )
                    }
                  >
                    {t.isPublished ? "Hide" : "Show"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="ab"
                      onClick={() => {
                        setEditing(t);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="ab d"
                      onClick={() => {
                        if (confirm(`Delete review from "${t.name}"?`)) {
                          action(() => fetch(`/api/admin/testimonials/${t.id}`, { method: "DELETE" }));
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

function TestimonialForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Testimonial | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    name: editing?.name ?? "",
    role: editing?.role ?? "",
    quote: editing?.quote ?? "",
    imageUrl: editing?.imageUrl ?? "",
    isPublished: editing?.isPublished ?? true,
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.name}` : "New testimonial"}
      </h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            name: f.name,
            role: f.role || null,
            quote: f.quote,
            imageUrl: f.imageUrl || null,
            isPublished: f.isPublished,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <Field label="Reviewer name">
          <Input required value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Role / source (e.g. “Google review”)">
          <Input value={f.role} onChange={(e) => setF((p) => ({ ...p, role: e.target.value }))} />
        </Field>
        <Field label="Member photo (optional)">
          <ImageUpload
            value={f.imageUrl}
            onChange={(url) => setF((p) => ({ ...p, imageUrl: url }))}
            folder="testimonials"
          />
          <p className="mt-1 text-xs text-white/40">
            Leave empty to show the reviewer&apos;s first letter instead.
          </p>
        </Field>
        <Field label="Review">
          <TextArea required rows={4} value={f.quote} onChange={(e) => setF((p) => ({ ...p, quote: e.target.value }))} />
        </Field>
        <Toggle
          checked={f.isPublished}
          onChange={(v) => setF((p) => ({ ...p, isPublished: v }))}
          label="Live (visible on homepage carousel)"
        />
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Add Testimonial"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
