"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/admin/payments", label: "Payments & Audit", icon: "card" },
  { href: "/admin/members", label: "Members", icon: "users" },
  { href: "/admin/trainers", label: "Trainers", icon: "dumbbell" },
  { href: "/admin/plans", label: "Plans", icon: "card" },
  { href: "/admin/diet-plans", label: "Diet Plans", icon: "leaf" },
  { href: "/admin/classes", label: "Classes & Timetable", icon: "calendar" },
  { href: "/admin/broadcast", label: "Bulk Outreach", icon: "send" },
  { href: "/admin/analytics", label: "Analytics & Revenue", icon: "chart" },
  { href: "/admin/gallery", label: "Gallery", icon: "image" },
  { href: "/admin/banners", label: "Banners", icon: "flag" },
  { href: "/admin/offers", label: "Offers", icon: "tag" },
  { href: "/admin/competitions", label: "Competitions", icon: "trophy" },
  { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "star" },
  { href: "/admin/audit", label: "Audit Logs", icon: "file" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) {
          // Session expired while the cookie-less guard let us through —
          // bounce to the admin login instead of showing a broken page.
          router.replace("/admin/login");
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
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gym-black text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-gym-ink lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gym-lime/50 bg-gym-lime/10 text-gym-lime">
            <Icon name="dumbbell" className="h-4 w-4" />
          </span>
          <span className="font-anton text-base uppercase tracking-wide text-white">
            ONE STOP<span className="glow-lime">&nbsp;FITNESS</span>
            <span className="block pt-0.5 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
              Admin Panel
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {links.map((l) => {
            const active =
              pathname === l.href ||
              (l.href !== "/admin/dashboard" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-gym-lime text-gym-black"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={l.icon} className="h-[18px] w-[18px]" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link href="/" className="text-xs text-white/50 transition hover:text-gym-lime">
            ← View public site
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-gym-ink px-4 py-3 lg:hidden">
        <span className="font-anton text-base uppercase tracking-wide text-white">
          ONE STOP<span className="glow-lime">&nbsp;FITNESS</span>
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
        <div className="fixed inset-x-0 top-[49px] z-40 border-b border-white/10 bg-gym-ink p-3 lg:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80"
            >
              <Icon name={l.icon} className="h-4 w-4 text-gym-lime" />
              {l.label}
            </Link>
          ))}
          <Link href="/" className="mt-2 block px-3 py-2 text-xs text-white/50">
            ← View public site
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="flex min-h-screen flex-col pt-[49px] lg:pl-60 lg:pt-0">
        <header className="flex items-center justify-between border-b border-white/10 bg-gym-black/80 px-6 py-4">
          <p className="font-anton text-sm uppercase tracking-[0.2em] text-white/70">
            Admin Console
          </p>
          <div className="flex items-center gap-4">
            {me && (
              <div className="text-right">
                <p className="text-sm font-bold text-white">{me.name}</p>
                <p className="text-xs text-white/45">{me.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-red-400/50 hover:text-red-300"
            >
              <Icon name="logout" className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
