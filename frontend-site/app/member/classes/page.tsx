"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type GymClass = {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  location: string | null;
  _count: { bookings: number };
};

type Booking = {
  id: string;
  classDate: string;
  class: { name: string; startTime: string; endTime: string; location: string | null };
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MemberClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/classes").then((r) => r.json()),
      fetch("/api/me/classes").then((r) => r.json()),
    ])
      .then(([clsData, bookData]) => {
        setClasses(clsData.classes ?? []);
        setBookings(bookData.bookings ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function bookClass(classId: string) {
    setBusy(classId);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/me/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classScheduleId: classId, classDate: today }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Booking failed");
      else {
        alert("✓ Class booked successfully!");
        const bookData = await fetch("/api/me/classes").then((r) => r.json());
        setBookings(bookData.bookings ?? []);
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Group Classes &amp; Timetable
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Book your spot for Zumba, Yoga, Aerobics, Spinning, and Martial Arts.
        </p>
      </div>

      {bookings.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase text-white mb-4">
            My Booked Classes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-lg border border-gym-lime/30 bg-gym-lime/10 p-4">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-white">{b.class.name}</p>
                  <Badge tone="green">Confirmed</Badge>
                </div>
                <p className="text-xs text-gym-lime mt-1 font-semibold">
                  {b.class.startTime} - {b.class.endTime}
                </p>
                <p className="text-xs text-white/50 mt-1">{formatDate(b.classDate)} · {b.class.location || "Studio"}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="font-display text-xl font-bold uppercase text-white">Weekly Schedule</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => {
          const booked = bookings.some((b) => b.class.name === cls.name);
          const full = cls._count.bookings >= cls.maxCapacity;
          return (
            <Card key={cls.id} className="p-6 flex flex-col justify-between">
              <div>
                <Badge tone="green">{DAYS[cls.dayOfWeek]}</Badge>
                <h3 className="font-display text-xl font-bold text-white uppercase mt-2">{cls.name}</h3>
                <p className="text-sm font-bold text-gym-lime mt-1">
                  {cls.startTime} - {cls.endTime}
                </p>
                {cls.location && <p className="text-xs text-white/50 mt-1">Studio: {cls.location}</p>}
                <p className="text-xs text-white/40 mt-3">
                  Capacity: {cls._count.bookings} / {cls.maxCapacity} spots taken
                </p>
              </div>

              <Button
                className="mt-6 w-full"
                disabled={booked || full || busy === cls.id}
                onClick={() => bookClass(cls.id)}
              >
                {booked ? "Already Booked ✓" : full ? "Class Full" : busy === cls.id ? "Booking..." : "Book Spot"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
