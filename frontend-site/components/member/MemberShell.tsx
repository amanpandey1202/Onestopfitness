"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { brandParts } from "@/data/site";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { native } from "@/lib/native";

/* ─── Bottom navigation tabs (phone-first) ─── */
const bottomTabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/member/dashboard", label: "Home",      icon: "grid"    },
  { href: "/member/qr",        label: "QR Code",   icon: "qrCode"  },
  { href: "/member/diet",      label: "Diet",      icon: "leaf"    },
  { href: "/member/classes",   label: "Classes",   icon: "users"   },
  { href: "/member/profile",   label: "Profile",   icon: "user"    },
];

/* ─── Full sidebar links (desktop) ─── */
const sideLinks: { href: string; label: string; icon: IconName }[] = [
  { href: "/member/dashboard",    label: "Dashboard",        icon: "grid"     },
  { href: "/member/attendance",   label: "Attendance",       icon: "calendar" },
  { href: "/member/qr",          label: "My QR Code",       icon: "qrCode"   },
  { href: "/member/diet",         label: "Diet Plan",        icon: "leaf"     },
  { href: "/member/measurements", label: "Measurements",     icon: "activity" },
  { href: "/member/classes",      label: "Group Classes",    icon: "users"    },
  { href: "/member/pay",          label: "Renew Membership", icon: "card"     },
  { href: "/member/profile",      label: "My Profile",       icon: "user"     },
];

export default function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [me, setMe] = useState<{ name: string; memberCode?: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); router.refresh(); return null; }
        return r.ok ? r.json() : null;
      })
      .then(setMe)
      .catch(() => {});

    // Set native dark status bar on Android
    native.setDarkStatusBar();
  }, [router]);

  async function logout() {
    // Cancel local notifications so reminders stop after logout
    await native.cancelAllLocalNotifications();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/member/dashboard" && pathname.startsWith(href));
  }

  const initials = me
    ? me.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background text-white">

      {/* ═══════════════════════════════════════════
          DESKTOP — slim left sidebar (lg+)
          ═══════════════════════════════════════════ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.07] bg-surface-1 lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-lime text-gym-black shadow-glow-sm">
            <Icon name="dumbbell" className="h-4 w-4" />
          </span>
          <span className="font-anton text-base uppercase leading-none tracking-wide text-white">
            {brandParts().word1}<span className="glow-lime"> {brandParts().word2}</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {sideLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-gym-lime/15 text-gym-lime"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon
                    name={l.icon}
                    className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-gym-lime" : "text-white/40 group-hover:text-white/70"}`}
                  />
                  {l.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gym-lime shadow-glow-sm" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/[0.07] p-4">
          {me && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gym-lime/20 font-anton text-sm text-gym-lime">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{me.name}</p>
                {me.memberCode && (
                  <p className="truncate font-mono text-[10px] text-white/40">{me.memberCode}</p>
                )}
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/45 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE — compact top bar
          ═══════════════════════════════════════════ */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-surface-1/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/member/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gym-lime text-gym-black shadow-glow-sm">
            <Icon name="dumbbell" className="h-3.5 w-3.5" />
          </span>
          <span className="font-anton text-sm uppercase leading-none tracking-wide text-white">
            {brandParts().word1}<span className="glow-lime"> {brandParts().word2}</span>
          </span>
        </Link>

        {me && (
          <Link href="/member/profile" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gym-lime/30 bg-gym-lime/10 font-anton text-xs text-gym-lime">
              {initials}
            </span>
          </Link>
        )}
      </header>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
          — mobile: top-14 (header) + bottom-20 (tab bar)
          — desktop: left-60 (sidebar)
          ═══════════════════════════════════════════ */}
      <main className="min-h-screen pb-24 pt-14 lg:ml-60 lg:pb-8 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-7">
          {children}
        </div>
      </main>

      {/* ═══════════════════════════════════════════
          MOBILE — fixed bottom tab bar
          ═══════════════════════════════════════════ */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-surface-1/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center">
          {bottomTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all active:scale-95"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    active
                      ? "bg-gym-lime/20 shadow-glow-sm"
                      : "bg-transparent"
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    className={`h-5 w-5 transition-colors ${active ? "text-gym-lime" : "text-white/40"}`}
                  />
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide transition-colors ${
                    active ? "text-gym-lime" : "text-white/35"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-surface-1/95" />
      </nav>
    </div>
  );
}
