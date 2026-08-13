/**
 * QR Check-in landing page — opened when member/staff scans a member's QR code.
 * Route: /checkin/qr/[token]
 * Works on any phone camera — no app needed, no login required.
 */
export const dynamic = "force-dynamic";

import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function QrCheckinPage({ params }: Props) {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let result: {
    success?: boolean;
    alreadyCheckedIn?: boolean;
    memberName?: string;
    memberCode?: string;
    checkInTime?: string;
    planName?: string;
    daysRemaining?: number;
    error?: string;
  } = {};

  try {
    const res = await fetch(`${baseUrl}/api/checkin/qr/${token}`, {
      cache: "no-store",
    });
    result = await res.json();
  } catch {
    result = { error: "Could not connect. Check your internet connection." };
  }

  const isSuccess = result.success && !result.alreadyCheckedIn;
  const isAlready = result.success && result.alreadyCheckedIn;

  const checkInTime = result.checkInTime
    ? new Date(result.checkInTime).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gym-black px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <p className="font-anton text-xl uppercase tracking-widest text-white">
          ONE STOP <span className="text-gym-lime">FITNESS</span>
        </p>

        {isSuccess && (
          <div className="mt-8 rounded-2xl border border-gym-lime/40 bg-[#0d1a00] p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gym-lime text-5xl font-bold text-gym-black">
              ✓
            </div>
            <h1 className="mt-5 font-anton text-3xl uppercase text-gym-lime">
              Checked In!
            </h1>
            <p className="mt-2 text-xl font-bold text-white">{result.memberName}</p>
            <p className="text-sm text-white/50">{result.memberCode}</p>

            <div className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10 bg-gym-black text-sm">
              <div className="flex justify-between px-4 py-3">
                <span className="text-white/50">Time</span>
                <span className="font-semibold text-white">{checkInTime}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-white/50">Plan</span>
                <span className="font-semibold text-white">{result.planName}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-white/50">Days left</span>
                <span className="font-semibold text-gym-lime">{result.daysRemaining}</span>
              </div>
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-gym-lime">
              Let&apos;s crush it today! 💪
            </p>
          </div>
        )}

        {isAlready && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-gym-ink p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl">
              🔄
            </div>
            <h1 className="mt-5 font-anton text-2xl uppercase text-white">
              Already Checked In
            </h1>
            <p className="mt-2 text-lg font-bold text-white">{result.memberName}</p>
            <p className="mt-2 text-sm text-white/50">
              Checked in today at{" "}
              <span className="font-semibold text-white">{checkInTime}</span>
            </p>
            <div className="mt-4 text-xs text-white/35 space-y-1">
              <p>Plan: {result.planName}</p>
              <p>{result.daysRemaining} days remaining</p>
            </div>
          </div>
        )}

        {!isSuccess && !isAlready && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-gym-ink p-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/15 text-4xl">
              ✗
            </div>
            <h1 className="mt-5 font-anton text-2xl uppercase text-red-400">
              Cannot Check In
            </h1>
            <p className="mt-3 text-sm text-white/60">{result.error}</p>
            <p className="mt-4 text-xs text-white/40">
              Please speak to the front desk or renew your membership.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black"
            >
              Go to Website
            </Link>
          </div>
        )}

        <p className="mt-8 text-xs text-white/20">
          ONE STOP FITNESS · Attendance via QR
        </p>
      </div>
    </div>
  );
}
