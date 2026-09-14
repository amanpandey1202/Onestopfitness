"use client";

import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";

function StripCard({
  href,
  icon,
  title,
  sub,
  value,
}: {
  href: string;
  icon: IconName;
  title: string;
  sub: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-surface-2 px-5 py-4 transition hover:border-gym-lime/40 hover:bg-surface-3"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gym-lime/15 text-gym-lime transition group-hover:bg-gym-lime group-hover:text-gym-black">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span>
          <span className="heading-condensed block text-base text-white">{title}</span>
          <span className="text-xs text-white/40">{sub}</span>
        </span>
      </span>
      <span className="font-display text-3xl leading-none text-gym-lime">{value}</span>
    </Link>
  );
}

export function OffersStrip({ offers, competitions }: { offers: number; competitions: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StripCard
        href="/admin/offers"
        icon="tag"
        title="Active Offers"
        sub="live promotions running"
        value={offers}
      />
      <StripCard
        href="/admin/competitions"
        icon="trophy"
        title="Competitions"
        sub="published right now"
        value={competitions}
      />
    </div>
  );
}