/**
 * /checkin — landing/info page for the QR check-in feature.
 * The actual scan flow lives at /checkin/qr/[token].
 * Works without a token so it never shows a broken state.
 */
import Link from "next/link";
import { site, brandParts } from "@/data/site";

export const dynamic = "force-dynamic";

export default function CheckinLandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gym-black px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-anton text-xl uppercase tracking-widest text-white">
          {brandParts().word1} <span className="text-gym-lime">{brandParts().word2}</span>
        </p>

        <div className="mt-10 rounded-2xl border border-gym-lime/30 bg-gym-ink p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gym-lime text-gym-black text-4xl font-bold">
            ⌁
          </div>
          <h1 className="mt-5 font-anton text-2xl uppercase text-gym-lime">QR Check-in</h1>
          <p className="mt-3 text-sm text-white/70">
            Open the QR code from your member app with your phone camera — no app
            install needed. It takes you straight to your check-in confirmation.
          </p>
          <p className="mt-4 text-xs text-white/40">
            Trouble checking in? Speak to the front desk or reach us on WhatsApp.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black"
          >
            Go to Website
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/25">
          {site.name} · Scan your personal QR to check in
        </p>
      </div>
    </div>
  );
}
