"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

type Announcement = {
  id: string;
  title: string;
  body: string | null;
};

/**
 * News slideshow — rotates through announcements every 4.5s with a slide-up
 * animation, dot navigation and pause-on-hover. Falls back to a single line
 * when there's only one announcement.
 */
export default function NewsSlideshow({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = announcements.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4500);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;
  const current = announcements[index];

  return (
    <div
      className="flex items-center justify-center gap-3 sm:gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* News badge */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gym-lime/15 text-gym-lime ring-1 ring-gym-lime/30">
        <Icon name="megaphone" className="h-4 w-4" />
      </span>

      {/* Slide area */}
      <div className="relative h-6 min-w-0 flex-1 max-w-3xl overflow-hidden sm:h-7">
        <div key={index} className="news-slide absolute inset-0 flex items-center">
          <p className="line-clamp-1 w-full text-center text-sm text-white/75">
            <span className="font-bold uppercase tracking-wide text-gym-lime">
              {current.title}
            </span>
            {current.body ? (
              <span className="text-white/75"> — {current.body}</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {announcements.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={
                i === index
                  ? "h-1.5 w-5 rounded-full bg-gym-lime transition-all duration-300"
                  : "h-1.5 w-1.5 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
