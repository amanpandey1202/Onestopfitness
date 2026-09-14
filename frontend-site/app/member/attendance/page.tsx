"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { native } from "@/lib/native";
import CheckInSuccess from "@/components/member/CheckInSuccess";

type AttendanceData = {
  attendance: {
    total: number;
    todayCheckIn: { id: string; checkIn: string } | null;
    recent: { id: string; checkIn: string; method: string }[];
  };
  membership: { status: string; daysRemaining: number; endDate?: string } | null;
};

export default function MemberAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTime, setSuccessTime] = useState("");

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("load failed");
      setData(await res.json());
    } catch {
      setError("Couldn't load your attendance. Check your connection.");
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Refresh data when app comes back to foreground
  useEffect(() => native.onForeground(reload), [reload]);

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/check-in", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        await native.hapticError();
        throw new Error(body.error || "Check-in failed");
      }
      // Success!
      const time = new Date(body.checkIn || Date.now()).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
      setSuccessTime(time);
      setShowSuccess(true);
      await native.hapticSuccess();
      native.playCheckInSound();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed");
    } finally {
      setBusy(false);
    }
  }

  // ── Loading state
  if (!data && !error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        {/* Skeleton shimmer */}
        <div className="w-full max-w-2xl space-y-4 animate-pulse">
          <div className="h-10 w-40 rounded-xl bg-white/5" />
          <div className="h-48 rounded-2xl bg-white/5" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-2xl bg-white/5" />
            <div className="h-28 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  // ── Network / load error (no data at all)
  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <Icon name="close" className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-red-300">CAN&apos;T CONNECT</p>
          <p className="mt-1 text-sm text-white/40">Your connection appears unavailable.</p>
        </div>
        <button
          onClick={reload}
          className="rounded-xl border border-white/10 bg-surface-2 px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { attendance, membership } = data!;
  const active = membership?.status === "ACTIVE";
  const checkedIn = Boolean(attendance.todayCheckIn);
  const checkInTime = attendance.todayCheckIn
    ? new Date(attendance.todayCheckIn.checkIn).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      {/* Success overlay */}
      {showSuccess && (
        <CheckInSuccess
          time={successTime}
          onDone={() => setShowSuccess(false)}
        />
      )}

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="font-anton text-4xl uppercase tracking-wide text-white">Attendance</h1>
          <p className="mt-1 text-sm text-white/40">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* ── STATE A: Membership expired ── */}
        {!active && !checkedIn && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-7 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <Icon name="alertCircle" className="h-8 w-8 text-red-400" />
            </div>
            <p className="mt-4 font-anton text-2xl uppercase tracking-wide text-red-400">
              Membership Expired
            </p>
            <p className="mt-2 text-sm text-white/40">
              Your membership has ended. Renew to keep training.
            </p>
            <Link
              href="/member/pay"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gym-lime px-6 py-3 font-bold text-gym-black text-sm transition active:scale-95"
            >
              Renew Membership
            </Link>
          </div>
        )}

        {/* ── STATE B: Already checked in ── */}
        {checkedIn && (
          <div className="relative overflow-hidden rounded-2xl border border-gym-lime/30 bg-gym-lime/10 p-7 text-center shadow-glow">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gym-lime/20 ring-4 ring-gym-lime/30">
              <Icon name="check" className="h-10 w-10 text-gym-lime" />
            </div>
            <p className="mt-5 font-anton text-3xl uppercase tracking-wide text-gym-lime">
              You&apos;re in!
            </p>
            <p className="mt-1 text-base font-semibold text-white/70">Keep pushing 💪</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gym-black/60 px-5 py-2.5">
              <Icon name="clock" className="h-4 w-4 text-gym-lime" />
              <span className="font-mono text-lg font-bold text-white">{checkInTime}</span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-widest text-white/30">
              Checked in today
            </p>
          </div>
        )}

        {/* ── STATE C: Ready to check in ── */}
        {active && !checkedIn && (
          <div className="rounded-2xl border border-white/[0.07] bg-surface-2 p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gym-lime/15">
              <Icon name="pin" className="h-8 w-8 text-gym-lime" />
            </div>
            <p className="mt-4 font-anton text-2xl uppercase tracking-wide text-white">
              Ready to Train?
            </p>
            <p className="mt-1 text-sm text-white/40">
              Tap below to mark your arrival and get after it.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left">
                <Icon name="close" className="h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm font-semibold text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={checkIn}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gym-lime font-anton text-2xl uppercase tracking-widest text-gym-black shadow-glow transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ minHeight: "64px" }}
            >
              {busy ? (
                <>
                  <Spinner />
                  <span>Checking in…</span>
                </>
              ) : (
                <>
                  <Icon name="check" className="h-6 w-6" />
                  <span>⚡ Check In Now</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-surface-2 p-5 text-center">
            <Icon name="activity" className="h-5 w-5 text-gym-lime" />
            <p className="mt-3 font-anton text-5xl leading-none text-gym-lime">
              {attendance.total}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              Total Visits
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-surface-2 p-5 text-center">
            <Icon name="calendar" className="h-5 w-5 text-gym-lime" />
            {active ? (
              <>
                <p className="mt-3 font-anton text-5xl leading-none text-white">
                  {membership?.daysRemaining}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Days Left
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 font-anton text-2xl leading-none text-red-400">Expired</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Membership
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── RECENT HISTORY ── */}
        {attendance.recent.length > 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-surface-2 p-6">
            <h2 className="font-anton text-xl uppercase tracking-wide text-white">Recent History</h2>
            <p className="mt-0.5 text-xs text-white/30">Your last visits</p>
            <ul className="mt-5 space-y-3">
              {attendance.recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-surface-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gym-lime/15">
                      <Icon name="check" className="h-4 w-4 text-gym-lime" />
                    </span>
                    <span className="text-sm font-semibold text-white">{formatDate(r.checkIn)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white/50">
                      {new Date(r.checkIn).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="rounded-full border border-gym-lime/30 bg-gym-lime/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gym-lime">
                      {r.method.toLowerCase()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] bg-surface-2 px-6 py-10 text-center">
            <Icon name="activity" className="h-10 w-10 text-white/20" />
            <p className="font-semibold text-white/40">No visit history yet</p>
            <p className="text-xs text-white/25">Your gym visits will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
}
