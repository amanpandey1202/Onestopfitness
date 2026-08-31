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
  Toggle,
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountValue: number | null;
  discountType: string | null;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

function offerStatus(o: Offer): { label: string; tone: "green" | "yellow" | "red" } {
  const now = Date.now();
  if (!o.startDate && !o.endDate) return { label: "Live", tone: "green" };
  if (o.startDate && new Date(o.startDate).getTime() > now)
    return { label: "Scheduled", tone: "yellow" };
  if (o.endDate && new Date(o.endDate).getTime() < now) return { label: "Ended", tone: "red" };
  return { label: "Live", tone: "green" };
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/offers");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setOffers(data.offers);
    } catch {
      setError("Couldn't load offers.");
    }
  }, []);

  useEffect(() => {
    reload();
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowForm(true);
    }
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

  if (offers === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Offers & Discounts"
        subtitle="Promotional offers shown on the homepage. Active offers appear automatically."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Offer"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <OfferForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/offers/${editing.id}` : "/api/admin/offers";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {offers.length === 0 ? (
        <EmptyState title="No offers yet">Create your first promotional offer.</EmptyState>
      ) : (
        <div className="space-y-4">
          {offers.map((o) => (
            <Card key={o.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              {o.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.imageUrl} alt={o.title} className="h-20 w-32 rounded-md border border-white/10 object-cover" />
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                    {o.title}
                  </h3>
                  {o.discountValue !== null && (
                    <Badge tone="green">
                      {o.discountType === "PERCENT" ? `${o.discountValue}% OFF` : `₹${o.discountValue} OFF`}
                    </Badge>
                  )}
                  <Badge tone={o.isActive ? "green" : "red"}>{o.isActive ? "Active" : "Inactive"}</Badge>
                  {o.isActive && (
                    <Badge tone={offerStatus(o).tone}>
                      {offerStatus(o).label}
                      {offerStatus(o).label === "Scheduled" && o.startDate
                        ? ` — starts ${formatDate(o.startDate)}`
                        : ""}
                    </Badge>
                  )}
                </div>
                {o.description && <p className="mt-1 text-sm text-white/60">{o.description}</p>}
                <p className="mt-1 text-xs text-white/40">
                  {o.startDate ? `${formatDate(o.startDate)} → ${o.endDate ? formatDate(o.endDate) : "ongoing"}` : "No date window"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setEditing(o);
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
                      fetch(`/api/admin/offers/${o.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isActive: !o.isActive }),
                      })
                    )
                  }
                >
                  {o.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (confirm(`Delete offer "${o.title}"?`)) {
                      action(() => fetch(`/api/admin/offers/${o.id}`, { method: "DELETE" }));
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

function OfferForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Offer | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    discountValue: editing?.discountValue?.toString() ?? "",
    discountType: editing?.discountType ?? "PERCENT",
    imageUrl: editing?.imageUrl ?? "",
    startDate: toDateInput(editing?.startDate),
    endDate: toDateInput(editing?.endDate),
    isActive: editing?.isActive ?? true,
  }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.title}` : "Add an offer"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            title: f.title,
            description: f.description || null,
            discountValue: f.discountValue ? Number(f.discountValue) : undefined,
            discountType: f.discountType || undefined,
            imageUrl: f.imageUrl || null,
            startDate: f.startDate || null,
            endDate: f.endDate || null,
            isActive: f.isActive,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <div className="sm:col-span-2">
          <Field label="Offer image (optional)">
            <ImageUpload value={f.imageUrl} onChange={(url) => setF((p) => ({ ...p, imageUrl: url }))} folder="offers" />
          </Field>
        </div>
        <Field label="Title">
          <Input required value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} />
        </Field>
        <Field label="Discount value">
          <Input
            type="number"
            min={0}
            placeholder="e.g. 20"
            value={f.discountValue}
            onChange={(e) => setF((p) => ({ ...p, discountValue: e.target.value }))}
          />
        </Field>
        <Field label="Discount type">
          <Select value={f.discountType} onChange={(e) => setF((p) => ({ ...p, discountType: e.target.value }))}>
            <option value="PERCENT">Percentage (%)</option>
            <option value="AMOUNT">Flat amount (₹)</option>
          </Select>
        </Field>
        <Field label="Description">
          <Input value={f.description} onChange={(e) => setF((p) => ({ ...p, description: e.target.value }))} />
        </Field>
        <Field label="Start date">
          <Input type="date" value={f.startDate} onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))} />
        </Field>
        <Field label="End date">
          <Input type="date" value={f.endDate} onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle
            checked={f.isActive}
            onChange={(v) => setF((p) => ({ ...p, isActive: v }))}
            label="Active (visible on homepage)"
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Offer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
