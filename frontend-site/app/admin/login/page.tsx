"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Button, Field, Input } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.role !== "ADMIN") {
        throw new Error("This portal is for admin accounts only. Members use the login above.");
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero section */}
      <section className="relative min-h-screen">
        <Image
          src="/images/hero-bg.jpg"
          alt="One Stop Fitness Admin"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay for contrast */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" />
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center" data-testid="hero-hero" >
          <h1 className="font-anton text-4xl md:text-5xl lg:text-6xl font-bold italic text-white drop-shadow-2xl">BE YOUR BEST</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">Cardio · Weight Training · Martial Arts · Personal Training.</p>
          {/* Login form overlay */}
          <div className="relative mt-12 w-full max-w-md bg-white/5 backdrop-blur-sm rounded-xl p-8" style={{zIndex: 10}}>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@onestopfit.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
