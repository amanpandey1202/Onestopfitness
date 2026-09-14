"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, PageHeader, Select, Spinner, TextArea } from "@/components/admin/ui";

export type GymClass = {
  id: string;
  name: string;
  description: string | null;
  trainerId: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMins: number;
  maxCapacity: number;
  location: string | null;
  isActive: boolean;
  _count: { bookings: number };
};

export type Trainer = {
  id: string;
  name: string;
  trainerProfile?: { specialties?: string | null } | null;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyForm = {
  name: "",
  description: "",
  trainerId: "",
  dayOfWeek: "1",
  startTime: "07:00",
  endTime: "08:00",
  maxCapacity: "25",
  location: "Main Studio",
};

export default function ClassesClient({
  initialClasses,
  initialTrainers,
}: {
  initialClasses: GymClass[] | null;
  initialTrainers: Trainer[] | null;
}) {
  const [classes, setClasses] = useState<GymClass[]>(initialClasses ?? []);
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers ?? []);
  const [loading, setLoading] = useState(initialClasses === null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(emptyForm);

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (initialClasses !== null) return;
    Promise.all([
      fetch("/api/admin/classes").then((r) => r.json()),
      fetch("/api/admin/trainers").then((r) => r.json()),
    ])
      .then(([clsData, trainerData]) => {
        setClasses(clsData.classes ?? []);
        setTrainers(trainerData.trainers ?? []);
      })
      .finally(() => setLoading(false));
  }, [initialClasses]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(cls: GymClass) {
    setEditingId(cls.id);
    setForm({
      name: cls.name,
      description: cls.description ?? "",
      trainerId: cls.trainerId ?? "",
      dayOfWeek: String(cls.dayOfWeek),
      startTime: cls.startTime,
      endTime: cls.endTime,
      maxCapacity: String(cls.maxCapacity),
      location: cls.location ?? "",
    });
    setFormError("");
    setShowModal(true);
  }

  // Validate that times are well-formed and start < end
  function validateTimes(): string {
    const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRe.test(form.startTime) || !timeRe.test(form.endTime)) {
      return "Times must be in 24h HH:MM format (e.g. 07:00).";
    }
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      return "End time must be after start time.";
    }
    return "";
  }

  async function saveClass(e: React.FormEvent) {
    e.preventDefault();
    setFormError(validateTimes());
    if (formError) return;

    setBusy(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        trainerId: form.trainerId || null,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        durationMins:
          Math.max(0, Math.round((toMin(form.endTime) - toMin(form.startTime)) / 5) * 5) || 60,
        maxCapacity: Math.max(1, Number(form.maxCapacity) || 1),
        location: form.location || null,
        isActive: true,
      };

      const res = editingId
        ? await fetch(`/api/admin/classes/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        setShowModal(false);
        const d = await fetch("/api/admin/classes").then((r) => r.json());
        setClasses(d.classes ?? []);
      } else {
        const d = await res.json();
        setFormError(d.error || "Could not save class.");
      }
    } finally {
      setBusy(false);
    }
  }

  function toMin(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  async function deleteClass(id: string) {
    if (!confirm("Remove this class from the schedule?")) return;
    await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    const d = await fetch("/api/admin/classes").then((r) => r.json());
    setClasses(d.classes ?? []);
  }

  function trainerName(id: string | null): string {
    if (!id) return "Unassigned";
    return trainers.find((t) => t.id === id)?.name ?? "Unknown";
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Class Schedule &amp; Timetable"
        subtitle="Manage group fitness batches — Zumba, Yoga, Aerobics, Spinning, Martial Arts."
        action={<Button onClick={openCreate}>+ Add New Class</Button>}
      />

      <div className="g3">
        {classes.map((cls) => {
          const pct = cls.maxCapacity > 0 ? Math.round((cls._count.bookings / cls.maxCapacity) * 100) : 0;
          const full = pct >= 100;
          return (
            <div key={cls.id} className="cc" style={!cls.isActive ? { opacity: 0.55 } : undefined}>
              <div className="row btw">
                <span className="badge l">{DAYS[cls.dayOfWeek]}</span>
                {!cls.isActive && <span className="badge n">Hidden</span>}
              </div>
              <div className="ccn">{cls.name}</div>
              <div className="cct">
                {cls.startTime} – {cls.endTime}
              </div>
              <div className="ccm">
                {cls.location ?? "No location"} · Max {cls.maxCapacity} · {cls._count.bookings} booked
                {cls.trainerId ? ` · ${trainerName(cls.trainerId)}` : ""}
              </div>
              <div className="pbar">
                <div className={full ? "pfill full" : "pfill"} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="row btw mt4">
                {full ? (
                  <span className="txs trd fw5">Full</span>
                ) : (
                  <span className="txs tft">{cls._count.bookings} / {cls.maxCapacity} spots</span>
                )}
                <div className="row g3">
                  <button className="ab" onClick={() => openEdit(cls)}>Edit</button>
                  <button className="ab d" onClick={() => deleteClass(cls.id)}>Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-gym-ink p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl font-bold uppercase text-white">
              {editingId ? "Edit Class" : "Add Class to Timetable"}
            </h2>
            <form onSubmit={saveClass} className="space-y-4">
              <Field label="Class Name">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>

              <Field label="Trainer">
                <Select value={form.trainerId} onChange={(e) => set("trainerId", e.target.value)}>
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Day of Week">
                <Select value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value)}>
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time (24h)">
                  <Input value={form.startTime} onChange={(e) => set("startTime", e.target.value)} placeholder="07:00" required />
                </Field>
                <Field label="End Time (24h)">
                  <Input value={form.endTime} onChange={(e) => set("endTime", e.target.value)} placeholder="08:00" required />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Max Capacity">
                  <Input type="number" value={form.maxCapacity} onChange={(e) => set("maxCapacity", e.target.value)} required />
                </Field>
                <Field label="Studio Location">
                  <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Main Floor / Yoga Studio" />
                </Field>
              </div>

              <Field label="Description (optional)">
                <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
              </Field>

              {formError && (
                <p className="text-xs font-semibold text-red-400 mt-2">{formError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Saving..." : (editingId ? "Save Changes" : "Save Class")}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
