"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { formatDateShort, DAYS } from "@/lib/classes";
import Icon from "@/components/Icon";

type Availability = { date: string; booked: number; spotsLeft: number; full: boolean };

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
  availability: Availability[];
};

type Booking = {
  id: string;
  classDate: string;
  status: string;
  class: { name: string; startTime: string; endTime: string; location: string | null; dayOfWeek: number };
};

export default function MemberClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [bookError, setBookError] = useState<string | null>(null);
  // cancel confirm state: holds bookingId awaiting confirmation
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/classes").then((r) => r.json()),
      fetch("/api/me/classes").then((r) => r.json()),
    ])
      .then(([clsData, bookData]) => {
        setClasses(clsData.classes ?? []);
        setBookings(bookData.bookings ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  function isBooked(classScheduleId: string, dateKey: string): boolean {
    return bookings.some(
      (b) => b.class.name === classes.find((c) => c.id === classScheduleId)?.name && b.classDate === dateKey && b.status === "CONFIRMED"
    );
  }

  async function bookClass(classId: string, dateKey: string) {
    const bookingKey = `${classId}_${dateKey}`;
    setBusy(bookingKey);
    setBookError(null);
    try {
      const res = await fetch("/api/me/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classScheduleId: classId, classDate: dateKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBookError(data.error || "Booking failed. Please try again.");
      } else {
        const bookData = await fetch("/api/me/classes").then((r) => r.json());
        setBookings(bookData.bookings ?? []);
      }
    } finally {
      setBusy(null);
    }
  }

  async function cancelClass(bookingId: string) {
    setBusy(`cancel_${bookingId}`);
    setPendingCancel(null);
    setBookError(null);
    try {
      const res = await fetch(`/api/me/classes/${bookingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setBookError(data.error || "Cancellation failed. Please try again.");
      } else {
        const bookData = await fetch("/api/me/classes").then((r) => r.json());
        setBookings(bookData.bookings ?? []);
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) => b.status === "CONFIRMED");

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gym-lime">Member Portal</p>
        <h1 className="mt-1 font-anton text-4xl uppercase leading-none tracking-wide text-white">
          Group Classes
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Book your spot for Zumba, Yoga, Aerobics, Spinning, and Martial Arts.
        </p>
      </div>

      {/* ── Inline error banner ── */}
      {bookError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3">
          <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">{bookError}</p>
          </div>
          <button onClick={() => setBookError(null)} className="text-red-400/60 hover:text-red-300">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── My upcoming bookings ── */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="mb-3 font-anton text-xl uppercase tracking-wide text-white">
            My Bookings
          </h2>
          <div className="space-y-3">
            {upcomingBookings.map((b) => {
              const isCancelling = busy === `cancel_${b.id}`;
              const isPendingThisCancel = pendingCancel === b.id;

              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-gym-lime/25 bg-gym-lime/10 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gym-lime/20">
                      <Icon name="check" className="h-5 w-5 text-gym-lime" />
                    </span>
                    <div>
                      <p className="font-bold text-white">{b.class.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-gym-lime">
                        {b.class.startTime} – {b.class.endTime}
                      </p>
                      <p className="text-xs text-white/45">
                        {formatDate(b.classDate)} · {b.class.location || "Studio"}
                      </p>
                    </div>
                  </div>

                  {/* Inline cancel confirmation */}
                  {isPendingThisCancel ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="hidden text-xs text-white/60 sm:block">Cancel booking?</p>
                      <button
                        onClick={() => cancelClass(b.id)}
                        disabled={isCancelling}
                        className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/30"
                      >
                        {isCancelling ? "…" : "Yes, cancel"}
                      </button>
                      <button
                        onClick={() => setPendingCancel(null)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60 transition hover:text-white"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPendingCancel(b.id)}
                      disabled={!!busy}
                      className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/50 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Available classes ── */}
      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.07] bg-surface-2 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/30">
            <Icon name="users" className="h-8 w-8" />
          </span>
          <div>
            <p className="font-semibold text-white/70">No classes scheduled yet</p>
            <p className="mt-1 text-sm text-white/35">Check back soon — new classes are added regularly.</p>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-3 font-anton text-xl uppercase tracking-wide text-white">
            All Classes
          </h2>
          <div className="space-y-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-2"
              >
                {/* Class header — ticket stub style */}
                <div className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-4"
                  style={{ borderLeft: "3px solid #9AD901" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-gym-lime/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gym-lime">
                        {DAYS[cls.dayOfWeek]}
                      </span>
                      {cls.location && (
                        <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
                          {cls.location}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-anton text-xl uppercase leading-tight tracking-wide text-white">
                      {cls.name}
                    </h3>
                    <p className="mt-0.5 text-sm font-semibold text-gym-lime">
                      {cls.startTime} – {cls.endTime}
                    </p>
                    {cls.description && (
                      <p className="mt-1 text-xs text-white/45 line-clamp-2">{cls.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs text-white/30">capacity</p>
                    <p className="font-anton text-2xl text-white/60">{cls.maxCapacity}</p>
                  </div>
                </div>

                {/* Upcoming dates */}
                {cls.availability.length > 0 && (
                  <div className="divide-y divide-white/[0.05] px-5">
                    {cls.availability.map((av) => {
                      const booked = isBooked(cls.id, av.date);
                      const bookingKey = `${cls.id}_${av.date}`;
                      const isBusy = busy === bookingKey;

                      return (
                        <div
                          key={av.date}
                          className={`flex items-center justify-between py-3 ${booked ? "opacity-100" : av.full ? "opacity-50" : ""}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {formatDateShort(new Date(av.date))}
                            </p>
                            <p className={`text-xs ${av.full && !booked ? "text-red-400" : "text-white/40"}`}>
                              {booked
                                ? "You're in ✓"
                                : av.full
                                  ? "Full"
                                  : `${av.spotsLeft} spot${av.spotsLeft === 1 ? "" : "s"} left`}
                            </p>
                          </div>

                          {booked ? (
                            <span className="flex items-center gap-1.5 rounded-lg bg-gym-lime/15 px-3 py-1.5 text-xs font-bold text-gym-lime">
                              <Icon name="check" className="h-3.5 w-3.5" />
                              Booked
                            </span>
                          ) : av.full ? (
                            <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/30">
                              Full
                            </span>
                          ) : (
                            <button
                              onClick={() => bookClass(cls.id, av.date)}
                              disabled={!!busy}
                              className="rounded-lg bg-gym-lime px-4 py-1.5 text-xs font-bold text-gym-black shadow-glow-sm transition active:scale-95 disabled:opacity-50"
                            >
                              {isBusy ? "Booking…" : "Book"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
