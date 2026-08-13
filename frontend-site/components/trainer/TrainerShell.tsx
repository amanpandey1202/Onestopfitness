"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TrainerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const active = pathname === "/trainer/dashboard";

  return (
    <div className="min-h-screen bg-gym-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-gym-black/90 px-6 py-4 backdrop-blur">
          <Link href="/" className="font-display text-lg font-bold tracking-wide">
            ONE STOP<span className="text-gym-lime"> FITNESS</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/trainer/dashboard"
              className={`text-sm font-medium transition ${
                active ? "text-gym-lime" : "text-white/70 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              {me && <span className="text-sm font-bold text-white">{me.name}</span>}
              <button
                onClick={logout}
                className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-red-400/50 hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </nav>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/35">
          Trainer Portal · {new Date().getFullYear()} ONE STOP FITNESS
        </footer>
      </div>
    </div>
  );
}
