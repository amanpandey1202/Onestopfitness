"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/admin/ui";

const RESEND_COOLDOWN_S = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until resend is allowed

  // Tick the cooldown counter down.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function submit(emailToSend: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not process that request.");
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process that request.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit(email);
  }

  async function resend() {
    if (cooldown > 0 || loading) return;
    await submit(email);
  }

  return (
    <AuthShell
      kicker="Account Recovery"
      title="Forgot Password"
      subtitle="Enter the email you use to log in and we'll send you a reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-gym-lime hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          {/* Mail icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gym-lime/50 bg-gym-lime/10">
            <svg
              className="h-7 w-7 text-gym-lime"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <p className="text-sm text-white/70">
            If{" "}
            <span className="font-semibold text-white">{email}</span>{" "}
            is registered, a reset link is on its way.
          </p>
          <p className="text-xs text-white/40">
            Check your inbox and spam folder. The link expires in 30 minutes.
          </p>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || loading}
            className="text-sm text-white/50 underline underline-offset-2 transition hover:text-gym-lime disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Sending…"
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend email"}
          </button>

          <Link
            href="/login"
            className="block text-sm font-bold text-gym-lime hover:underline"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}