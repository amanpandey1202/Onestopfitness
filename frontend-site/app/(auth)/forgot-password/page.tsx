"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button, Field, Input } from "@/components/admin/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not process that request.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process that request.");
      setLoading(false);
    }
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
        <div className="space-y-4 text-center">
          <p className="text-sm text-white/70">
            If that email is registered, a reset link is on its way.
          </p>
          <p className="text-xs text-white/40">Check your inbox (and spam folder). The link expires in 30 minutes.</p>
          <Link href="/login" className="block text-sm font-bold text-gym-lime hover:underline">
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