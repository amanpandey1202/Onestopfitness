"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/member/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/member/attendance", label: "Attendance", icon: "calendar" },
  { href: "/member/qr", label: "My QR Code", icon: "qrCode" },
  { href: "/member/diet", label: "Diet Plan", icon: "leaf" },
  { href: "/member/measurements", label: "Measurements", icon: "activity" },
  { href: "/member/classes", label: "Group Classes", icon: "users" },
  { href: "/member/pay", label: "Renew Membership", icon: "card" },
  { href: "/member/profile", label: "My Profile", icon: "user" },
];

export default function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gym-black text-white">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-gym-ink px-4 py-3 lg:hidden">
        <span className="font-display text-base font-bold">
          ONE STOP<span className="text-gym-lime"> FITNESS</span>
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/12 text-white"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-[49px] z-40 max-h-[calc(100vh-49px)] overflow-y-auto border-b border-white/10 bg-gym-ink p-3 lg:hidden">
          {links.map((l, i) => {
            const active =
              pathname === l.href ||
              (l.href !== "/member/dashboard" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${0.035 * i}s` }}
                className={`r-enter flex items-center rounded-md px-3 py-2.5 text-sm transition active:scale-[0.98] ${
                  active
                    ? "bg-gym-lime/10 text-gym-lime"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={l.icon} className="h-4 w-4 text-gym-lime" />
                <span className="ml-3 flex-1">{l.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-gym-lime shadow-[0_0_8px_rgba(154,217,1,0.9)]" />
                )}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="r-enter mt-2 flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10 active:scale-[0.98]"
            style={{ animationDelay: `${0.035 * links.length}s` }}
          >
            <Icon name="logout" className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col pt-[49px] lg:pt-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-gym-black/90 px-6 py-4 backdrop-blur">
          <Link href="/" className="font-display text-lg font-bold tracking-wide">
            ONE STOP<span className="text-gym-lime"> FITNESS</span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((l) => {
              const active =
                pathname === l.href ||
                (l.href !== "/member/dashboard" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative text-sm font-medium transition ${
                    active
                      ? "text-gym-lime after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-gym-lime after:shadow-[0_0_8px_rgba(154,217,1,0.8)]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                {me && <span className="text-sm font-bold text-white">{me.name}</span>}
                <button
                  onClick={logout}
                  className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-red-400/50 hover:text-red-300 active:scale-95"
                >
                  Logout
                </button>
              </div>
          </nav>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/35">
          Member Portal · {new Date().getFullYear()} ONE STOP FITNESS
        </footer>
      </div>
    </div>
  );
}
