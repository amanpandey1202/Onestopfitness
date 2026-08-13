"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Icon from "@/components/Icon";

export type GalleryCarouselItem = {
  id?: string;
  imageUrl: string;
  title: string;
  mediaType?: string | null;
};

/**
 * Auto-rotating gallery. Every photo and video revolves automatically
 * (crossfade), with prev/next arrows, dot navigation, a clickable thumbnail
 * strip, and pause-on-hover. Videos play inline (muted) while active.
 */
export default function GalleryCarousel({
  items,
  interval = 5000,
}: {
  items: GalleryCarouselItem[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const goTo = useCallback(
    (n: number) => setIndex(((n % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [paused, count, interval]);

  if (count === 0) {
    return (
      <p className="py-10 text-center text-white/50">
        Photos and videos are on the way — check back soon.
      </p>
    );
  }

  const current = items[index];

  return (
    <div>
      {/* ── Main viewer ── */}
      <div
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] shadow-[0_0_40px_rgba(154,217,1,0.06)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          {/* key forces a fresh slide + fade animation on every rotation */}
          <div key={index} className="carousel-fade absolute inset-0">
            {current.mediaType === "VIDEO" ? (
              <video
                src={current.imageUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="h-full w-full bg-black object-cover"
              />
            ) : (
              <Image
                src={current.imageUrl}
                alt={current.title}
                fill
                sizes="(min-width:1024px) 90vw, 100vw"
                priority={index === 0}
                className="object-cover"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
          </div>

          {/* Caption */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
            <figcaption className="flex items-center gap-3 text-white">
              <span className="h-px w-4 bg-gym-lime" />
              <span className="font-semibold tracking-wide sm:text-lg">
                {current.title}
              </span>
            </figcaption>
            <span className="rounded-md border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-xs text-white/80 backdrop-blur-sm">
              {index + 1} / {count}
            </span>
          </div>

          {/* Prev / Next */}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => goTo(index - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2 text-white/80 opacity-0 backdrop-blur-sm transition hover:border-gym-lime/50 hover:text-gym-lime focus:outline-none group-hover:opacity-100"
              >
                <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => goTo(index + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/50 p-2 text-white/80 opacity-0 backdrop-blur-sm transition hover:border-gym-lime/50 hover:text-gym-lime focus:outline-none group-hover:opacity-100"
              >
                <Icon name="arrowRight" className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {count > 1 && (
            <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 sm:flex">
              {items.map((item, i) => (
                <button
                  key={item.id ?? i}
                  type="button"
                  aria-label={`Go to ${item.title}`}
                  onClick={() => goTo(i)}
                  className={
                    i === index
                      ? "h-1.5 w-6 rounded-full bg-gym-lime transition-all"
                      : "h-1.5 w-1.5 rounded-full bg-white/35 transition-all hover:bg-white/70"
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {count > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {items.map((item, i) => (
            <button
              key={item.id ?? i}
              type="button"
              onClick={() => goTo(i)}
              className={
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition " +
                (i === index
                  ? "border-gym-lime shadow-[0_0_14px_rgba(154,217,1,0.35)]"
                  : "border-white/10 opacity-55 hover:opacity-90")
              }
            >
              {item.mediaType === "VIDEO" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/90">
                    <Icon name="camera" className="h-4 w-4" />
                  </span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
