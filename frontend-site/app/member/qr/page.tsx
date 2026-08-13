"use client";

import { useEffect, useState, useRef } from "react";
import { Card, Spinner } from "@/components/admin/ui";

/**
 * Member QR Code Page
 *
 * Shows the member their unique QR code.
 * How it works:
 * - The QR encodes a URL: https://yourgym.com/checkin?token=<qrToken>
 * - Staff OR the member opens their camera, scans the QR.
 * - The phone opens the check-in URL in the browser — no app needed.
 * - The server logs attendance as "QR" method.
 *
 * The QR is rendered in a <canvas> using the `qrcode` library (client-side only).
 * It never expires unless admin resets it.
 */
export default function MemberQrPage() {
  const [me, setMe] = useState<{
    name: string;
    memberCode: string | null;
    qrToken: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(setMe)
      .catch(() => setError("Could not load your QR code. Please refresh."));
  }, []);

  useEffect(() => {
    if (!me?.qrToken || !canvasRef.current) return;

    const siteUrl =
      typeof window !== "undefined" ? window.location.origin : "https://yourgym.com";
    const checkInUrl = `${siteUrl}/checkin/qr/${me.qrToken}`;

    // Dynamically import qrcode to keep it client-side only
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, checkInUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#000000", light: "#9AD901" },
      }).catch(console.error);
    });
  }, [me]);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!me) return (
    <div className="flex justify-center py-24">
      <Spinner />
    </div>
  );

  return (
    <div className="mx-auto max-w-sm space-y-8 text-center">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
        My QR Code
      </h1>

      <Card className="p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
          Scan to check in
        </p>

        {/* QR Canvas — rendered with gym-lime background */}
        <div className="mt-6 flex justify-center">
          <div className="rounded-2xl bg-gym-lime p-3 shadow-[0_0_40px_rgba(154,217,1,0.35)]">
            <canvas ref={canvasRef} className="block rounded-xl" />
          </div>
        </div>

        <div className="mt-6">
          <p className="font-bold text-white text-lg">{me.name}</p>
          {me.memberCode && (
            <p className="mt-1 font-mono text-sm text-gym-lime">{me.memberCode}</p>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-gym-black p-4 text-left text-xs text-white/55 space-y-1.5">
          <p className="font-semibold text-white/80">How to use</p>
          <p>1. Show this QR to the front desk staff.</p>
          <p>2. They point any camera at it — your attendance is marked.</p>
          <p>3. You can also scan it yourself when you arrive.</p>
          <p>4. One check-in per day recorded.</p>
        </div>
      </Card>

      <p className="text-xs text-white/30">
        This QR is unique to you. Do not share it publicly.
      </p>
    </div>
  );
}
