"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { Button, Field, Input, Select } from "@/components/admin/ui";

const goals = [
  "Weight loss",
  "Muscle gain",
  "General fitness",
  "Martial arts",
  "Personal training",
  "Endurance / stamina",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    fitnessGoal: goals[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phone: form.phone || null, fitnessGoal: form.fitnessGoal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push("/member");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join ONE STOP FITNESS — start your transformation today."
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
        <Field label="Phone (optional)">
          <Input
            type="tel"
            placeholder="+91 …"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Fitness goal">
          <Select value={form.fitnessGoal} onChange={(e) => set("fitnessGoal", e.target.value)}>
            {goals.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Password" hint="Minimum 8 characters.">
          <Input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
