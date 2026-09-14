"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button, Spinner } from "@/components/admin/ui";

export default function VerifyRequiredPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Poll every 5s to see if the user has verified (e.g. opened link in another tab).
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const me = await res.json();
        if (!cancelled) {
          if (me?.emailVerified) {
            router.replace("/member");
            router.refresh();
          } else if (me?.email) {
            setEmail(me.email);
          }
        }
      } catch {
        // ignore — keep polling
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [router]);

  async function resend() {
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not resend email");
      setNotice("Verification email sent! Check your inbox (and spam folder).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend email");
    } finally {
      setSending(false);
    }
  }

  if (checking) {
    return (
      <AuthShell kicker="Member Portal" title="Verify Your Email" subtitle="Checking your account…">
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-white/50">Loading…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Member Portal"
      title="Verify Your Email"
      subtitle="You need to confirm your email address before accessing the member portal."
      footer={
        <>
          <Link href="/login" className="font-bold text-gym-lime hover:underline">
            Log in with a different account
          </Link>
        </>
      }
    >
      <div className="space-y-5 text-center">
        {/* Envelope icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gym-lime/60 bg-gym-lime/10">
          <svg
            className="h-7 w-7 text-gym-lime"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <p className="text-sm text-white/70">
          A verification link was sent to{" "}
          <span className="font-semibold text-white">{email || "your email"}</span>.
          Check your inbox and spam folder.
        </p>

        <p className="text-xs text-white/40">
          The link expires in 24 hours. After clicking it, this page will automatically redirect you.
        </p>

        {notice && <p className="text-sm text-gym-lime">{notice}</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button onClick={resend} disabled={sending} variant="secondary" className="w-full">
          {sending ? "Sending…" : "Resend verification email"}
        </Button>

        <p className="text-xs text-white/30">
          This page checks automatically — once you click the link in the email you&apos;ll be redirected.
        </p>
      </div>
    </AuthShell>
  );
}
