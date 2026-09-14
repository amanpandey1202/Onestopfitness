"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brandParts } from "@/data/site";
import { useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: "grid" },
      { href: "/admin/analytics", label: "Analytics & Revenue", icon: "chart" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/members", label: "Members", icon: "users" },
      { href: "/admin/trainers", label: "Trainers", icon: "dumbbell" },
      { href: "/admin/payments", label: "Payments & Audit", icon: "card" },
    ],
  },
  {
    label: "Offerings",
    items: [
      { href: "/admin/plans", label: "Plans", icon: "card" },
      { href: "/admin/diet-plans", label: "Diet Plans", icon: "leaf" },
      { href: "/admin/classes", label: "Classes & Timetable", icon: "calendar" },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/admin/broadcast", label: "Bulk Outreach", icon: "send" },
      { href: "/admin/announcements", label: "Announcements", icon: "megaphone" },
      { href: "/admin/competitions", label: "Competitions", icon: "trophy" },
      { href: "/admin/offers", label: "Offers", icon: "tag" },
      { href: "/admin/testimonials", label: "Testimonials", icon: "star" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/gallery", label: "Gallery", icon: "image" },
      { href: "/admin/banners", label: "Banners", icon: "flag" },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/audit", label: "Audit Logs", icon: "file" }],
  },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary/12 text-primary shadow-[0_0_14px_rgba(154,217,1,0.12)_inset]"
          : "text-white/68 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gym-lime shadow-glow-sm" />
      )}
      <Icon name={icon} className="h-[18px] w-[18px] opacity-85" />
      {label}
    </Link>
  );
}

export default function AdminShell({
  user,
  children,
}: {
  user: { name: string | null; email: string | null };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin min-h-screen bg-background text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-surface-1 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-glow-sm">
            <Icon name="dumbbell" className="h-5 w-5" />
          </span>
          <span className="font-anton text-base uppercase leading-none tracking-wide text-white">
            {brandParts().word1}<span className="glow-lime">&nbsp;{brandParts().word2}</span>
            <span className="block pt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-faint">
              Admin Console
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="label-kicker px-3 pb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((l) => (
                  <NavItem key={l.href} href={l.href} label={l.label} icon={l.icon} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Link href="/" className="block rounded-lg px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-gym-lime">
            ← View public site
          </Link>
          {user?.name && (
            <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground">
                {(user.name || "A").trim()[0]?.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{user.name}</p>
                <p className="truncate font-mono text-xs text-faint">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="glass-bar fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2.5 font-anton text-base uppercase leading-none text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            <Icon name="dumbbell" className="h-4 w-4" />
          </span>
          {brandParts().word1}<span className="glow-lime">&nbsp;{brandParts().word2}</span>
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-white"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="glass-bar fixed inset-x-0 top-[49px] z-40 max-h-[80vh] overflow-y-auto p-3 lg:hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="label-kicker px-3 py-1.5">{group.label}</p>
              {group.items.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                >
                  <Icon name={l.icon} className="h-4 w-4 text-gym-lime" />
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
          <Link href="/" onClick={() => setOpen(false)} className="mt-1 block px-3 py-2 text-xs text-white/50">
            ← View public site
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="flex min-h-screen flex-col pt-[49px] lg:pl-64 lg:pt-0">
        <header className="glass-bar sticky top-0 z-20 flex items-center justify-between border-b px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gym-lime shadow-glow-sm" />
            <h1 className="heading-condensed text-lg text-white">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.name && (
              <div className="text-right">
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="font-mono text-xs text-faint">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-xs font-bold text-white/70 transition hover:border-red-400/50 hover:text-red-300"
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
