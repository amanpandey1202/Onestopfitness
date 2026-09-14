"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Button, Field, Spinner } from "@/components/admin/ui";

const REDIRECT_DELAY_S = 4;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // null = not started

  // Auto-redirect countdown after success.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push("/login");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing or malformed.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset your password.");
      setCountdown(REDIRECT_DELAY_S);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset your password.");
      setLoading(false);
    }
  }

  // Success state — countdown to redirect
  if (countdown !== null) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gym-lime/60 bg-gym-lime/10">
          <svg
            className="h-7 w-7 text-gym-lime"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <p className="text-sm text-white/70">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <p className="text-xs text-white/40">
          {countdown > 0
            ? `Redirecting to login in ${countdown}…`
            : "Redirecting…"}
        </p>
        <Button onClick={() => router.push("/login")} className="w-full">
          Go to login now
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!token && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          This link is missing a reset token. Please request a new reset link.
        </p>
      )}

      <Field label="New password">
        <PasswordInput
          required
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrength password={password} />
      </Field>

      <Field label="Confirm new password">
        <PasswordInput
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm && password !== confirm && (
          <p className="mt-1.5 text-xs text-red-400">Passwords do not match.</p>
        )}
        {confirm && password === confirm && confirm.length > 0 && (
          <p className="mt-1.5 text-xs text-gym-lime">✓ Passwords match.</p>
        )}
      </Field>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <Button type="submit" disabled={loading || !token} className="w-full">
        {loading ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      kicker="Account Recovery"
      title="Set New Password"
      subtitle="Choose a fresh password for your account."
      footer={
        <>
          <Link href="/login" className="font-bold text-gym-lime hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="flex justify-center py-4"><Spinner /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}