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
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-4 text-center">
      {state === "loading" && <p className="text-sm text-white/40">Verifying your email…</p>}
      {state === "done" && (
        <>
          <p className="text-sm text-white/70">Your email is verified. Welcome to the family!</p>
          <Link href="/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </>
      )}
      {state === "error" && <p className="text-sm text-red-300">{error}</p>}
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
      <Suspense fallback={<Spinner />}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}