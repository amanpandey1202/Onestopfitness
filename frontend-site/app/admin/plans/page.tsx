"use client";

import { useCallback, useEffect, useState } from "react";
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
import Icon from "@/components/Icon";
import { formatPrice } from "@/lib/format";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string; // JSON string
  isActive: boolean;
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setPlans(data.plans);
    } catch {
      setError("Couldn't load plans.");
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

  if (plans === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Membership Plans"
        subtitle="Pricing shown on the public site — changes appear instantly."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Plan"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <PlanForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/plans/${editing.id}` : "/api/admin/plans";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {plans.length === 0 ? (
        <EmptyState title="No plans yet">Create your first membership plan.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const features: string[] = (() => {
              try {
                const v = JSON.parse(p.features);
                return Array.isArray(v) ? v : [];
              } catch {
                return [];
              }
            })();
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="mt-1 text-sm text-white/55">{p.description}</p>
                    )}
                  </div>
                  <Badge tone={p.isActive ? "green" : "red"}>{p.isActive ? "Live" : "Hidden"}</Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-gym-lime">
                  {formatPrice(p.price)}
                  <span className="text-sm font-normal text-white/45"> / {p.durationDays} days</span>
                </p>
                {features.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-white/65">
                    {features.slice(0, 4).map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-gym-lime" />
                        {feat}
                      </li>
                    ))}
                    {features.length > 4 && (
                      <li className="pl-5 text-xs text-white/40">+{features.length - 4} more</li>
                    )}
                  </ul>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 px-3 py-1.5 text-xs"
                    onClick={() => {
                      setEditing(p);
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
                        fetch(`/api/admin/plans/${p.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isActive: !p.isActive }),
                        })
                      )
                    }
                  >
                    {p.isActive ? "Hide" : "Publish"}
                  </Button>
                  <Button
                    variant="danger"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (confirm(`Delete plan "${p.name}"?`)) {
                        action(() => fetch(`/api/admin/plans/${p.id}`, { method: "DELETE" }));
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function PlanForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Plan | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => {
    let features: string[] = [];
    try {
      const v = JSON.parse(editing?.features ?? "[]");
      if (Array.isArray(v)) features = v;
    } catch {
      /* ignore */
    }
    return {
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      price: editing?.price?.toString() ?? "",
      durationDays: editing?.durationDays?.toString() ?? "30",
      features: features.join("\n"),
      isActive: editing?.isActive ?? true,
    };
  });

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.name}` : "Add a new plan"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const features = f.features
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          const body: Record<string, unknown> = {
            name: f.name,
            description: f.description || null,
            price: Number(f.price),
            durationDays: Number(f.durationDays) || 30,
            features,
            isActive: f.isActive,
          };
          onSubmit(body, editing ? "PATCH" : "POST");
        }}
      >
        <Field label="Plan name">
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Price (₹)">
          <Input type="number" required min={0} value={f.price} onChange={set("price")} />
        </Field>
        <Field label="Duration (days)">
          <Input type="number" min={1} value={f.durationDays} onChange={set("durationDays")} />
        </Field>
        <Field label="Description">
          <Input value={f.description} onChange={set("description")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Features" hint="One feature per line.">
            <TextArea rows={5} value={f.features} onChange={set("features")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Toggle checked={f.isActive} onChange={(v) => setF((p) => ({ ...p, isActive: v }))} label="Active (visible on public site)" />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
