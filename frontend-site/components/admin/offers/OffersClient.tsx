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
  Toggle,
} from "@/components/admin/ui";
import { formatDate, toDateInput } from "@/lib/format";

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountValue: number | null;
  discountType: string | null;
  imageUrl: string | null;
  planId: string | null;
  plan?: { id: string; name: string } | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export type Plan = { id: string; name: string };

function offerStatus(o: Offer): { label: string; tone: "green" | "yellow" | "red" } {
  const now = Date.now();
  if (!o.startDate && !o.endDate) return { label: "Live", tone: "green" };
  if (o.startDate && new Date(o.startDate).getTime() > now)
    return { label: "Scheduled", tone: "yellow" };
  if (o.endDate && new Date(o.endDate).getTime() < now) return { label: "Ended", tone: "red" };
  return { label: "Live", tone: "green" };
}

export default function OffersClient({
  initialOffers,
  initialPlans,
}: {
  initialOffers: Offer[] | null;
  initialPlans: Plan[];
}) {
  const [offers, setOffers] = useState<Offer[] | null>(initialOffers);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [offersRes, plansRes] = await Promise.all([
        fetch("/api/admin/offers"),
        fetch("/api/admin/plans"),
      ]);
      if (!offersRes.ok) throw new Error("load failed");
      const offersData = await offersRes.json();
      const plansData = await plansRes.json();
      setOffers(offersData.offers);
      setPlans(plansData.plans ?? []);
    } catch {
      setError("Couldn't load offers.");
    }
  }, []);

  useEffect(() => {
    if (offers === null) reload();
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") {
      setShowForm(true);
    }
  }, [offers, reload]);

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
          plans={plans}
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
        <div className="g3">
          {offers.map((o) => {
            const st = offerStatus(o);
            const badge = !o.isActive ? (
              <span className="badge n">Inactive</span>
            ) : st.label === "Scheduled" ? (
              <span className="badge a">Scheduled</span>
            ) : st.label === "Ended" ? (
              <span className="badge r">Ended</span>
            ) : (
              <span className="badge g">Live</span>
            );
            const discountLabel =
              o.discountValue !== null
                ? o.discountType === "PERCENT"
                  ? `${o.discountValue}% OFF`
                  : `₹${o.discountValue} OFF`
                : "OFFER";
            return (
              <div key={o.id} className="oc">
                <div
                  className="ob"
                  style={
                    o.imageUrl
                      ? {
                          backgroundImage: `linear-gradient(135deg, rgba(10,10,10,0.55), rgba(10,10,10,0.75)), url(${o.imageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <span className="obadge">{discountLabel}</span>
                </div>
                <div className="obdy">
                  <div className="otn">{o.title}</div>
                  {o.description && <p className="ods">{o.description}</p>}
                  <p className="odt">
                    {o.startDate
                      ? `Valid till ${o.endDate ? formatDate(o.endDate) : "ongoing"} · ${formatDate(o.startDate)}`
                      : "No date window"}
                    {o.plan && <span style={{ color: "var(--alime)" }}> · {o.plan.name}</span>}
                  </p>
                  <div className="of">
                    {badge}
                    <div className="row g3">
                      <button
                        className="ab"
                        onClick={() => {
                          setEditing(o);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="ab"
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
                      </button>
                      <button
                        className="ab d"
                        onClick={() => {
                          if (confirm(`Delete offer "${o.title}"?`)) {
                            action(() => fetch(`/api/admin/offers/${o.id}`, { method: "DELETE" }));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

function OfferForm({
  editing,
  busy,
  plans,
  onSubmit,
}: {
  editing: Offer | null;
  busy: boolean;
  plans: Plan[];
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    discountValue: editing?.discountValue?.toString() ?? "",
    discountType: editing?.discountType ?? "PERCENT",
    imageUrl: editing?.imageUrl ?? "",
    planId: editing?.planId ?? "",
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
            planId: f.planId || null,
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
            max={100}
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
        <Field label="Target plan" hint="Optional — links this offer to a specific plan for one-click checkout.">
          <Select value={f.planId} onChange={(e) => setF((p) => ({ ...p, planId: e.target.value }))}>
            <option value="">Any plan (member chooses)</option>
            {plans.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.name}</option>
            ))}
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
