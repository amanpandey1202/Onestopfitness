"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Badge, Button, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type AttendanceData = {
  attendance: {
    total: number;
    todayCheckIn: { id: string; checkIn: string } | null;
    recent: { id: string; checkIn: string; method: string }[];
  };
  membership: { status: string; daysRemaining: number } | null;
};

export default function MemberAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) throw new Error("load failed");
      setData(await res.json());
    } catch {
      setError("Couldn't load your attendance.");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function checkIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/check-in", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Check-in failed");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <p className="text-sm text-red-300">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const { attendance, membership } = data;
  const active = membership?.status === "ACTIVE";
  const checkedIn = Boolean(attendance.todayCheckIn);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">Attendance</h1>

      <Card className="p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Today</p>
        {checkedIn ? (
          <div className="mt-3">
            <Icon name="check" className="mx-auto h-12 w-12 text-gym-lime" />
            <p className="mt-2 font-display text-xl font-bold text-gym-lime">Checked in</p>
            <p className="mt-1 text-sm text-white/55">
              {new Date(attendance.todayCheckIn!.checkIn).toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <Icon name="pin" className="mx-auto h-12 w-12 text-white/30" />
            <p className="mt-2 font-display text-xl font-bold text-white">Not checked in yet</p>
            <p className="mt-1 text-sm text-white/55">
              {active ? "Tap the button below when you arrive." : "Your membership is not active."}
            </p>
            <Button className="mt-5" disabled={busy || !active} onClick={checkIn}>
              {busy ? "Checking in…" : "Check In"}
            </Button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Total check-ins</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">{attendance.total}</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Membership</p>
          <div className="mt-2 flex justify-center">
            <Badge tone={active ? "green" : "red"}>
              {active ? `${membership?.daysRemaining} days left` : "Expired"}
            </Badge>
          </div>
        </Card>
      </div>

      {attendance.recent.length > 0 && (
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Recent History</h2>
          <ul className="mt-4 space-y-2">
            {attendance.recent.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-gym-black px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-white">
                  <Icon name="check" className="h-4 w-4 shrink-0 text-gym-lime" />
                  {formatDate(r.checkIn)}
                </span>
                <span className="text-white/45">
                  {new Date(r.checkIn).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase">
                    {r.method.toLowerCase()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
