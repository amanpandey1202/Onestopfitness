"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { site, brandParts } from "@/data/site";
import { useEffect, useState } from "react";

export default function TrainerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          // Session expired while the cookie-less guard let us through —
          // bounce to login instead of showing a broken dashboard.
          router.replace("/login");
          router.refresh();
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(setMe)
      .catch(() => {});
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/trainer/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
        <header className="glass-bar sticky top-0 z-30 border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-wide">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/></svg>
              </span>
              {brandParts().word1}<span className="text-gym-lime"> {brandParts().word2}</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/trainer/dashboard"
                className={`text-sm font-medium transition ${
                  isActive("/trainer/dashboard") ? "text-primary" : "text-white/70 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/trainer/diet-plans"
                className={`text-sm font-medium transition ${
                  isActive("/trainer/diet-plans") ? "text-primary" : "text-white/70 hover:text-white"
                }`}
              >
                Diet Plans
              </Link>
              <div className="flex items-center gap-3 border-l pl-6">
                {me && (
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground">
                      {(me.name || "T").trim()[0]?.toUpperCase()}
                    </span>
                    {me.name}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg border border-input px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-red-400/50 hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
          <div className="h-0.5 w-full bg-gradient-to-br from-primary to-secondary" />
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
        <footer className="border-t px-6 py-4 text-center text-xs text-white/35">
          Trainer Portal · {new Date().getFullYear()} {site.name}
        </footer>
      </div>
    </div>
  );
}
