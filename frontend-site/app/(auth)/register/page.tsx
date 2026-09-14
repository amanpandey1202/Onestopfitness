"use client";
import Link from "next/link";
import { site } from "@/data/site";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Button, Field, Input, Select } from "@/components/admin/ui";
import { FITNESS_GOALS } from "@/lib/goals";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    fitnessGoal: FITNESS_GOALS[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          fitnessGoal: form.fitnessGoal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      // Show the verify-email notice before navigating.
      setRegistered(true);
      setTimeout(() => {
        router.push("/verify-required");
        router.refresh();
      }, 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <AuthShell
        kicker="Member Portal"
        title="Account Created!"
        subtitle="You're in. Check your inbox to verify your email address."
        footer={
          <>
            Already verified?{" "}
            <Link href="/verify-required" className="font-bold text-gym-lime hover:underline">
              Go to verification page →
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-center">
          {/* Animated checkmark */}
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
            A welcome email with a verification link has been sent to{" "}
            <span className="font-semibold text-white">{form.email}</span>. Check your inbox
            (and spam folder).
          </p>
          <p className="text-xs text-white/40">Redirecting you to your dashboard in a moment…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker="Member Portal"
      title="Create Account"
      subtitle={site.auth.registerSubtitle}
      footer={
        <>
          Already a member?{" "}
          <Link href="/login" className="font-bold text-gym-lime hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            required
            placeholder="Your name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        <Field label="Phone" hint="Required — used for checkout/WhatsApp contact.">
          <Input
            required
            type="tel"
            autoComplete="tel"
            placeholder="+91 …"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>

        <Field label="Fitness goal">
          <Select value={form.fitnessGoal} onChange={(e) => set("fitnessGoal", e.target.value)}>
            {FITNESS_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Password">
          <PasswordInput
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
          <PasswordStrength password={form.password} />
        </Field>

        <Field label="Confirm password">
          <PasswordInput
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400">Passwords do not match.</p>
          )}
          {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
            <p className="mt-1.5 text-xs text-gym-lime">✓ Passwords match.</p>
          )}
        </Field>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
