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

type Trainer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  trainerProfile: {
    specialization: string;
    bio: string | null;
    experience: number | null;
    profileImageUrl: string | null;
    instagram: string | null;
    isFounder: boolean;
    isActive: boolean;
    founderNote: string | null;
    founderTitles: string | null;
  } | null;
};
export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trainers");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setTrainers(data.trainers);
    } catch {
      setError("Couldn't load trainers.");
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

  if (trainers === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Trainers"
        subtitle="Your coaching team — the faces members see on the floor."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Cancel" : "+ Add Trainer"}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <TrainerForm
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/trainers/${editing.id}` : "/api/admin/trainers";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {trainers.length === 0 ? (
        <EmptyState title="No trainers yet">Add your first trainer to the team.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3">Trainer</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.trainerProfile?.profileImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.trainerProfile.profileImageUrl}
                          alt={t.name}
                          className="h-10 w-10 rounded-full border border-white/10 object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          {t.name}
                          {t.trainerProfile?.isFounder && (
                            <span className="ml-2 text-xs font-bold text-gym-lime">FOUNDER</span>
                          )}
                        </p>
                        <p className="text-xs text-white/50">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/75">
                    {t.trainerProfile?.specialization ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {t.trainerProfile?.experience ? `${t.trainerProfile.experience} yrs` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={t.isActive && (t.trainerProfile?.isActive ?? true) ? "green" : "red"}>
                      {t.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        onClick={() => {
                          setEditing(t);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        onClick={() =>
                          action(() =>
                            fetch(`/api/admin/trainers/${t.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isActive: !t.isActive }),
                            })
                          )
                        }
                      >
                        {t.isActive ? "Suspend" : "Activate"}
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() =>
                          action(() =>
                            fetch(`/api/admin/trainers/${t.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isFounder: !t.trainerProfile?.isFounder }),
                            })
                          )
                        }
                      >
                        {t.trainerProfile?.isFounder ? "Unmark Founder" : "Mark Founder"}
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => {
                          if (confirm(`Delete ${t.name} permanently?`)) {
                            action(() => fetch(`/api/admin/trainers/${t.id}`, { method: "DELETE" }));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function TrainerForm({
  editing,
  busy,
  onSubmit,
}: {
  editing: Trainer | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  const [f, setF] = useState(() => ({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    password: "",
    specialization: editing?.trainerProfile?.specialization ?? "",
    bio: editing?.trainerProfile?.bio ?? "",
    experience: editing?.trainerProfile?.experience?.toString() ?? "",
    instagram: editing?.trainerProfile?.instagram ?? "",
    profileImageUrl: editing?.trainerProfile?.profileImageUrl ?? "",
    founderNote: editing?.trainerProfile?.founderNote ?? "",
    isFounder: editing?.trainerProfile?.isFounder ?? false,
    founderTitles: (() => {
      try {
        const raw = editing?.trainerProfile?.founderTitles;
        if (!raw) return "";
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.join("\n") : "";
      } catch {
        return "";
      }
    })(),
  }));

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.name}` : "Add a new trainer"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            name: f.name,
            phone: f.phone || null,
            specialization: f.specialization,
            bio: f.bio || null,
            instagram: f.instagram || null,
            profileImageUrl: f.profileImageUrl || null,
          };
          if (f.experience) body.experience = Number(f.experience);
          body.founderNote = f.founderNote || null;
          body.isFounder = f.isFounder;
          body.founderTitles = f.founderTitles
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          if (editing) {
            onSubmit(body, "PATCH");
          } else {
            body.email = f.email;
            body.password = f.password;
            onSubmit(body, "POST");
          }
        }}
      >
        <Field label="Name">
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        {!editing && (
          <Field label="Email">
            <Input type="email" required value={f.email} onChange={set("email")} />
          </Field>
        )}
        {!editing && (
          <Field label="Temporary password" hint="Min 8 characters.">
            <Input type="password" required minLength={8} value={f.password} onChange={set("password")} />
          </Field>
        )}
        <Field label="Phone">
          <Input value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Specialization">
          <Input required value={f.specialization} onChange={set("specialization")} />
        </Field>
        <Field label="Experience (years)">
          <Input type="number" min={0} value={f.experience} onChange={set("experience")} />
        </Field>
        <Field label="Instagram handle">
          <Input placeholder="@handle" value={f.instagram} onChange={set("instagram")} />
        </Field>
        <Field label="Profile photo">
          <ImageUpload value={f.profileImageUrl} onChange={(url) => setF((p) => ({ ...p, profileImageUrl: url }))} folder="trainers" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bio">
            <TextArea rows={2} value={f.bio} onChange={set("bio")} />
          </Field>
        </div>
        <div className="rounded-lg border border-lime-400/20 bg-lime-400/5 p-4 sm:col-span-2">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gym-lime">
            Founder section — shown on Home &amp; About
          </p>
          <div className="mb-4">
            <Toggle
              checked={f.isFounder}
              onChange={(v) => setF((p) => ({ ...p, isFounder: v }))}
              label="Mark as founder (only the founder appears in the Home founder section)"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Founder note">
                <TextArea rows={3} value={f.founderNote} onChange={set("founderNote")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Founder titles"
                hint="One title per line, e.g. MR LUCKNOW 2014. This trainer must be marked as founder to appear."
              >
                <TextArea
                  rows={4}
                  value={f.founderTitles}
                  onChange={set("founderTitles")}
                  placeholder={"MR LUCKNOW 2014\nMR UP 2025"}
                />
              </Field>
            </div>
          </div>
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Trainer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
