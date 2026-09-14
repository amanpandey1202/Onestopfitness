"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button, Spinner } from "@/components/admin/ui";

function VerifyEmailForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("error");
        setError("This verification link is missing a token.");
        return;
      }
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Could not verify that email link.");
        setState("done");
      } catch (e) {
        if (cancelled) return;
        setState("error");
        setError(e instanceof Error ? e.message : "Could not verify that email link.");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="space-y-5 text-center">
      {state === "loading" && (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-white/50">Verifying your email…</p>
        </div>
      )}

      {state === "done" && (
        <>
          {/* Success checkmark */}
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm text-white/70">
            Your email is verified. Welcome to the family! 💪
          </p>
          <Link href="/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          {/* Error icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500/40 bg-red-500/10">
            <svg
              className="h-7 w-7 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-red-300">{error}</p>
          <p className="text-xs text-white/40">
            If this link expired, you can request a new one by logging in and visiting your profile.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">Back to login</Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      kicker="Member Portal"
      title="Confirm Email"
      subtitle="Confirming your email address."
      footer={
        <>
          <Link href="/login" className="font-bold text-gym-lime hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-white/50">Loading…</p>
          </div>
        }
      >
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}