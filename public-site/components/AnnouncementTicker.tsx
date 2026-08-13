"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

type Announcement = {
  id: string;
  title: string;
  body: string;
};

/**
 * Rotates through announcements every 5 seconds with a fade transition.
 * Falls back to a single static line when there's only one.
 */
export default function AnnouncementTicker({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % announcements.length);
        setVisible(true);
      }, 450);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;
  const current = announcements[index % announcements.length];

  return (
    <div className="flex items-center justify-center gap-3 overflow-hidden py-0.5 text-center">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gym-lime/12 text-gym-lime">
        <Icon name="megaphone" className="h-4 w-4" />
      </span>
      <div
        className={`min-h-5 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-sm text-white/80">
          <span className="font-bold text-white">{current.title}:</span> {current.body}
        </p>
      </div>
    </div>
  );
}
