"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button, Field, Input, Spinner } from "@/components/admin/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If user is already authenticated, redirect them to their dashboard.
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me?.role === "ADMIN") router.replace("/admin/dashboard");
        else if (me?.role === "TRAINER") router.replace("/trainer");
        else if (me?.role === "MEMBER") router.replace("/member");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: remember }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const dest =
        data.role === "ADMIN"
          ? "/admin/dashboard"
          : data.role === "TRAINER"
          ? "/trainer"
          : "/member";
      router.push(dest);
      router.refresh();
      // Do not reset loading here — let the navigation replace the page.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthShell
      kicker="Member Portal"
      title="Sign In"
      subtitle="Welcome back. Enter your credentials to continue."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-bold text-gym-lime hover:underline">
            Create an account
          </Link>{" "}
          ·{" "}
          <Link href="/admin/login" className="text-white/60 hover:text-white">
            Admin login
          </Link>
        </>
      }
    >
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

        <Field label="Password">
          <PasswordInput
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-[#9ad901]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-white/60 hover:text-gym-lime hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </AuthShell>
  );
}
