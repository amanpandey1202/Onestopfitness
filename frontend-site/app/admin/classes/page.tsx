"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Spinner } from "@/components/admin/ui";

type GymClass = {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  location: string | null;
  isActive: boolean;
  _count: { bookings: number };
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [name, setName] = useState("Zumba Workout");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [maxCapacity, setMaxCapacity] = useState("25");
  const [location, setLocation] = useState("Main Studio");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/classes")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          maxCapacity: Number(maxCapacity),
          location,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        const d = await fetch("/api/admin/classes").then((r) => r.json());
        setClasses(d.classes ?? []);
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteClass(id: string) {
    if (!confirm("Remove this class from the schedule?")) return;
    await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    setClasses(classes.filter((c) => c.id !== id));
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Class Schedule &amp; Timetable"
        subtitle="Manage group fitness batches — Zumba, Yoga, Aerobics, Spinning, Martial Arts."
        action={<Button onClick={() => setShowModal(true)}>+ Add New Class</Button>}
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <Badge tone="green">{DAYS[cls.dayOfWeek]}</Badge>
                <Button variant="danger" className="py-0.5 px-2 text-xs" onClick={() => deleteClass(cls.id)}>Delete</Button>
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase mt-3">{cls.name}</h3>
              <p className="text-sm font-bold text-gym-lime mt-1">
                {cls.startTime} - {cls.endTime}
              </p>
              {cls.location && <p className="text-xs text-white/50 mt-1">Studio: {cls.location}</p>}
              <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
                <span className="text-white/40">Capacity: {cls.maxCapacity} members</span>
                <span className="font-bold text-white">{cls._count.bookings} Booked</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-gym-ink p-6 space-y-4">
            <h2 className="font-display text-xl font-bold uppercase text-white">Add Class to Timetable</h2>
            <form onSubmit={createClass} className="space-y-4">
              <Field label="Class Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>

              <Field label="Day of Week">
                <Select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time (24h)">
                  <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="07:00" required />
                </Field>
                <Field label="End Time (24h)">
                  <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="08:00" required />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Max Capacity">
                  <Input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} required />
                </Field>
                <Field label="Studio Location">
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Main Floor / Yoga Studio" />
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Adding..." : "Save Class"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
