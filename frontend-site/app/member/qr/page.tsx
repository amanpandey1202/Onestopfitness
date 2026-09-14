"use client";

import { useEffect, useState, useRef } from "react";
import { Spinner } from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { site } from "@/data/site";
import { native } from "@/lib/native";

/**
 * Member QR Code Page
 *
 * Native enhancements when running as Android app:
 *  - Screen brightness boosted to 100% for easy scanning
 *  - Screen kept awake (no auto-lock while QR is visible)
 *  - Neon lime pulse animation around QR container
 *  - Brightness + wake-lock restored on page unmount
 */
export default function MemberQrPage() {
  const [me, setMe] = useState<{
    name: string;
    memberCode: string | null;
    qrToken: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [howToOpen, setHowToOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(setMe)
      .catch(() => setError("Could not load your QR code. Please refresh."));
  }, []);

  // Native: boost brightness + keep screen on when page mounts
  useEffect(() => {
    native.boostBrightness();
    native.keepScreenOn(true);
    // Start pulse animation after a brief delay
    const t = setTimeout(() => setPulse(true), 300);
    return () => {
      clearTimeout(t);
      native.restoreBrightness();
      native.keepScreenOn(false);
    };
  }, []);

  useEffect(() => {
    if (!me?.qrToken || !canvasRef.current) return;

    const siteUrl =
      typeof window !== "undefined" ? window.location.origin : site.app.serverUrl;
    const checkInUrl = `${siteUrl}/checkin/qr/${me.qrToken}`;

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, checkInUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).catch(console.error);
    });
  }, [me]);

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${site.shortName}-QR-${me?.memberCode ?? "member"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (error)
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <Icon name="alertCircle" className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-xl border border-white/10 bg-surface-2 px-5 py-2 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );

  if (!me)
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );

  return (
    <div className="mx-auto max-w-sm space-y-6">
      {/* Page title */}
      <h1 className="font-anton text-3xl uppercase tracking-widest text-white glow-lime text-center">
        My QR Code
      </h1>

      {/* Membership pass card */}
      <div
        className="relative rounded-2xl border border-white/[0.07] bg-surface-2 overflow-hidden shadow-glow"
        style={{ borderTop: "4px solid #9AD901" }}
      >
        {/* Lime glow strip behind top border */}
        <div
          className="absolute inset-x-0 top-0 h-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(154,217,1,0.18) 0%, transparent 100%)",
          }}
        />

        {/* Header: name + member code */}
        <div className="px-6 pt-7 pb-4 text-center relative z-10">
          <p className="font-anton text-3xl uppercase tracking-wide text-white leading-tight">
            {me.name}
          </p>
          {me.memberCode && (
            <p className="mt-1 font-mono text-sm tracking-widest text-gym-lime">
              {me.memberCode}
            </p>
          )}
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/40">
            Member Pass
          </p>
        </div>

        {/* Dashed divider */}
        <div className="mx-6 border-t border-dashed border-white/10" />

        {/* QR Code with neon pulse ring */}
        <div className="flex flex-col items-center px-6 py-7">
          <div className="relative">
            {/* Outer pulse ring - animates only on native */}
            <div
              style={{
                position: "absolute",
                inset: -12,
                borderRadius: 20,
                border: "2px solid #9AD901",
                opacity: pulse ? 0.5 : 0,
                transform: pulse ? "scale(1.04)" : "scale(0.96)",
                transition: "opacity 1.2s ease, transform 1.2s ease",
                animation: pulse ? "qrPulse 2s ease-in-out infinite" : "none",
                pointerEvents: "none",
              }}
            />
            <style>{`
              @keyframes qrPulse {
                0%, 100% { opacity: 0.2; transform: scale(1.00); }
                50% { opacity: 0.6; transform: scale(1.05); box-shadow: 0 0 24px rgba(154,217,1,0.4); }
              }
            `}</style>
            <div className="rounded-2xl bg-white p-3 shadow-glow-sm">
              <canvas ref={canvasRef} className="block rounded-xl" />
            </div>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-white/40">
            Show this to the front desk to check in
          </p>
        </div>

        {/* Dashed divider */}
        <div className="mx-6 border-t border-dashed border-white/10" />

        {/* Action buttons */}
        <div className="px-6 py-6 space-y-3">
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gym-lime py-3.5 font-bold text-gym-black text-sm tracking-wide transition active:scale-95"
            style={{ minHeight: 48 }}
          >
            <Icon name="download" className="h-5 w-5" />
            Save to Photos
          </button>

          <button
            onClick={() => setHowToOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-surface-3 px-4 py-3.5 text-sm font-semibold text-white/70 transition active:scale-95"
            style={{ minHeight: 48 }}
          >
            <span>How to use</span>
            <Icon
              name={howToOpen ? "chevronUp" : "chevronDown"}
              className="h-4 w-4 text-gym-lime"
            />
          </button>

          {howToOpen && (
            <div className="rounded-xl border border-white/10 bg-gym-black px-4 py-4 text-left text-xs text-white/55 space-y-2">
              {[
                "Show this QR to the front desk staff.",
                "They point any camera at it — your attendance is marked instantly.",
                "You can also scan it yourself when you arrive.",
                "One check-in per day is recorded.",
              ].map((tip, i) => (
                <div key={i} className="flex gap-2">
                  <span className="mt-0.5 text-gym-lime font-bold">{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-white/30 pb-2">
        This QR is unique to you. Do not share it publicly.
      </p>
    </div>
  );
}
