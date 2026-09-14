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
  PasswordInput,
  Spinner,
  TextArea,
  Toggle,
} from "@/components/admin/ui";

export type Trainer = {
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
export default function TrainersClient({ initial }: { initial: Trainer[] | null }) {
  const [trainers, setTrainers] = useState<Trainer[] | null>(initial);
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
    if (trainers === null) reload();
  }, [trainers, reload]);

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

  const currentFounder = trainers.find((t) => t.trainerProfile?.isFounder);

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
        <div className="tw">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Status</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="row g3">
                      {t.trainerProfile?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.trainerProfile.profileImageUrl}
                          alt={t.name}
                          className="av rounded-full object-cover"
                          style={{ width: 34, height: 34 }}
                        />
                      ) : (
                        <div className="av">{t.name.trim()[0]?.toUpperCase() ?? "?"}</div>
                      )}
                      <div>
                        <div className="fw5">
                          {t.name}
                          {t.trainerProfile?.isFounder && (
                            <span className="badge l" style={{ marginLeft: 8 }}>Founder</span>
                          )}
                        </div>
                        <div className="txs tft tmo">{(t.trainerProfile?.profileImageUrl && t.email) || t.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mu">{t.trainerProfile?.specialization ?? "—"}</td>
                  <td className="mu">
                    {t.trainerProfile?.experience ? `${t.trainerProfile.experience} yrs` : "—"}
                  </td>
                  <td>
                    <span className={t.isActive && (t.trainerProfile?.isActive ?? true) ? "badge g" : "badge r"}>
                      {t.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td>
                    <div className="row g3" style={{ justifyContent: "flex-end" }}>
                      <button className="ab" onClick={() => { setEditing(t); setShowForm(true); }}>
                        Edit
                      </button>
                      <button
                        className="ab"
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
                      </button>
                      <button
                        className={`ab ${t.trainerProfile?.isFounder ? "" : "l"}`}
                        onClick={() => {
                          if (!t.trainerProfile?.isFounder && currentFounder && currentFounder.id !== t.id) {
                            if (!confirm(`"${currentFounder.name}" is currently the founder. Make "${t.name}" the founder instead? "${currentFounder.name}" will be unmarked.`)) return;
                          }
                          action(() =>
                            fetch(`/api/admin/trainers/${t.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isFounder: !t.trainerProfile?.isFounder }),
                            })
                          );
                        }}
                      >
                        {t.trainerProfile?.isFounder ? "Unmark Founder" : "Mark Founder"}
                      </button>
                      <button
                        className="ab d"
                        onClick={() => {
                          if (confirm(`Delete ${t.name} permanently?`)) {
                            action(() => fetch(`/api/admin/trainers/${t.id}`, { method: "DELETE" }));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <PasswordInput required minLength={8} value={f.password} onChange={set("password")} />
          </Field>
        )}
        <Field label="Phone">
          <Input type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
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
                hint="One title per line, e.g. NATIONAL CHAMPION 2024. This trainer must be marked as founder to appear."
              >
                <TextArea
                  rows={4}
                  value={f.founderTitles}
                  onChange={set("founderTitles")}
                  placeholder={"NATIONAL CHAMPION 2024\nREGIONAL CHAMPION 2025"}
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
