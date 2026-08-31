"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";

export type GalleryExperienceItem = {
  id?: string;
  imageUrl: string;
  title: string;
  mediaType?: string | null;
};

const BAR_COUNT = 26;

export default function GalleryExperience({
  items,
  interval = 4600,
}: {
  items: GalleryExperienceItem[];
  interval?: number;
}) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const [energy, setEnergy] = useState(84);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const swiped = useRef(false);

  const goTo = useCallback(
    (n: number) => setIndex(((n % count) + count) % count),
    [count]
  );

  const next = useCallback(() => {
    setPaused(false);
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const prev = useCallback(() => {
    setPaused(false);
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [paused, count, interval, next]);

  useEffect(() => {
    const t = setInterval(() => {
      setEnergy((e) => Math.max(38, Math.min(100, Math.round(e + (Math.random() * 20 - 9)))));
    }, 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, next, prev]);

  const dust = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        left: 6 + ((i * 37) % 88),
        top: 12 + ((i * 53) % 70),
        size: 2 + (i % 3),
        delay: -(i * 0.9),
      })),
    []
  );

  if (count === 0) {
    return (
      <p className="py-10 text-center text-white/50">
        Photos and videos are on the way — check back soon.
      </p>
    );
  }

  const current = items[index];
  const activeBars = Math.round((energy / 100) * BAR_COUNT);

  function rotate(e: React.PointerEvent) {
    if (e.pointerType === "touch") return;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const rx = (y / r.height - 0.5) * -7;
    const ry = (x / r.width - 0.5) * 9;
    if (tiltRef.current) {
      tiltRef.current.style.transform = `perspective(1100px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.015)`;
    }
    el.style.setProperty("--gx-x", `${x}px`);
    el.style.setProperty("--gx-y", `${y}px`);
  }

  function resetTilt() {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  }

  function pumpEnergy() {
    setEnergy((e) => Math.min(100, e + 8 + Math.round(Math.random() * 10)));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    swiped.current = Math.abs(dx) > 45;
    if (dx > 45) prev();
    else if (dx < -45) next();
    touchStart.current = null;
  }

  return (
    <div className="space-y-6">
      {/* ── Energy stage ── */}
      <div className="group gx-tilt-wrap" style={{ perspective: "1200px" }}>
        <div
          ref={tiltRef}
          style={{ transformStyle: "preserve-3d", transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div
            ref={stageRef}
            className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0b] shadow-[0_0_60px_rgba(154,217,1,0.1)]"
            onPointerMove={rotate}
            onPointerLeave={resetTilt}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              setOpen(true);
            }}
            role="button"
            tabIndex={0}
            aria-label="Open gallery viewer"
            onKeyDown={(e) => {
              if (e.key === "Enter") setOpen(true);
            }}
          >
            <div className="relative aspect-[3/4] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
              <div key={index} className="gx-in absolute inset-0">
                {current.mediaType === "VIDEO" ? (
                  <video
                    src={current.imageUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full bg-black object-cover"
                  />
                ) : (
                  <Image
                    src={current.imageUrl}
                    alt={current.title}
                    fill
                    priority={index === 0}
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 90vw, 80vw"
                    className={`object-cover ${index % 2 === 0 ? "gx-zoom-a" : "gx-zoom-b"}`}
                  />
                )}

                <div className="gx-scan pointer-events-none absolute inset-0" />
                <div className="gx-sweep pointer-events-none" />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(520px circle at var(--gx-x,50%) var(--gx-y,50%), rgba(154,217,1,0.16), transparent 60%)",
                  }}
                />
                <div className="gx-vignette pointer-events-none absolute inset-0" />
                {current.mediaType === "VIDEO" && (
                  <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-gym-lime px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gym-black">
                    <Icon name="camera" className="h-3 w-3" /> Video
                  </span>
                )}
                {dust.map((d) => (
                  <span
                    key={d.id}
                    className="gx-dust"
                    style={{
                      left: `${d.left}%`,
                      top: `${d.top}%`,
                      width: d.size,
                      height: d.size,
                      animationDelay: `${d.delay}s`,
                    }}
                  />
                ))}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span key={`ring-${index}`} className="gx-ring h-16 w-16" />
                </span>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
                  <figcaption key={`cap-${index}`} className="text-white">
                    <div className="flex items-center gap-2.5">
                      <span className="h-px w-6 bg-gym-lime shadow-[0_0_8px_rgba(154,217,1,0.8)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gym-lime">
                        {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold uppercase tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:text-3xl">
                      {current.title.split(" ").map((w, i) => (
                        <span key={i} className="gx-word">
                          <span style={{ animationDelay: `${0.08 + i * 0.07}s` }}>
                            {w}
                            {i < current.title.split(" ").length - 1 ? "\u00A0" : ""}
                          </span>
                        </span>
                      ))}
                    </p>
                  </figcaption>
                  <span className="hidden rounded-md border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-xs tracking-widest text-white/70 backdrop-blur-sm sm:inline-block">
                    TAP TO EXPAND
                  </span>
                </div>
              </div>

              {count > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={(e) => {
                      e.stopPropagation();
                      prev();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2.5 text-white/85 opacity-0 backdrop-blur-md transition hover:scale-110 hover:border-gym-lime hover:text-gym-lime hover:shadow-[0_0_20px_rgba(154,217,1,0.4)] focus:outline-none group-hover:opacity-100"
                  >
                    <Icon name="arrowRight" className="h-5 w-5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/50 p-2.5 text-white/85 opacity-0 backdrop-blur-md transition hover:scale-110 hover:border-gym-lime hover:text-gym-lime hover:shadow-[0_0_20px_rgba(154,217,1,0.4)] focus:outline-none group-hover:opacity-100"
                  >
                    <Icon name="arrowRight" className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0">
                <div className="mx-4 mb-4 sm:mx-6 sm:mb-6">
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      key={index}
                      className="gx-progress"
                      style={{
                        animationDuration: `${interval}ms`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live energy meter ── */}
      <div
        className="flex items-center gap-4 rounded-xl border border-white/10 bg-gym-ink px-4 py-3 sm:px-5"
        onClick={pumpEnergy}
        role="button"
        tabIndex={0}
        aria-label="Pump the energy meter"
        onKeyDown={(e) => {
          if (e.key === "Enter") pumpEnergy();
        }}
      >
        <div className="flex-1">
          <div className="gx-kicker flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-gym-lime">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gym-lime opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gym-lime" />
            </span>
            Gym energy
            <span className="not-italic tracking-widest text-white/45">{energy}%</span>
          </div>
          <p className="mt-1 hidden text-xs text-white/40 sm:block">
            Tap to pump it — the reel keeps rolling on its own.
          </p>
        </div>
        <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
          {Array.from({ length: BAR_COUNT }, (_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full transition-colors duration-300"
              style={{
                height: `${10 + ((i * 7) % 16)}px`,
                transformOrigin: "bottom",
                animation: `gx-needle 1.6s ease-in-out ${-(i * 0.09)}s infinite`,
                backgroundColor: i < activeBars ? "var(--color-gym-lime)" : "rgba(255,255,255,0.12)",
                boxShadow: i < activeBars ? "0 0 8px rgba(154,217,1,0.6)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Cine-reel infinite loop ── */}
      {count > 1 && (
        <div className="gx-reel-wrap overflow-hidden rounded-xl border border-white/10 bg-gym-ink py-3">
          <div className="gx-reel-track px-1.5">
            {[...items, ...items].map((item, i) => {
              const active = i % count === index;
              return (
                <button
                  key={`${item.id ?? item.imageUrl}-${i}`}
                  type="button"
                  onClick={() => goTo(i % count)}
                  aria-label={`View ${item.title}`}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition sm:h-[72px] sm:w-[110px] ${
                    active
                      ? "border-gym-lime shadow-[0_0_16px_rgba(154,217,1,0.5)] scale-[1.06]"
                      : "border-white/10 opacity-55 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gym-lime shadow-[0_0_8px_rgba(154,217,1,0.9)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-center text-xs uppercase tracking-[0.3em] text-white/40">
        <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180 text-gym-lime" />
        Swipe or tap to explore
        <Icon name="arrowRight" className="h-3.5 w-3.5 text-gym-lime" />
      </p>

      {/* ── Lightbox ── */}
      {open && (
        <div
          className="gx-lightbox fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gym-lime text-gym-black">
                <Icon name="dumbbell" className="h-4 w-4" />
              </div>
              <span className="font-bold uppercase tracking-widest text-white/80">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:rotate-90 hover:border-gym-lime hover:text-gym-lime"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div key={index} className="gx-in absolute inset-0">
              {current.mediaType === "VIDEO" ? (
                <video
                  src={current.imageUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <Image
                  src={current.imageUrl}
                  alt={current.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
            </div>

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white transition hover:scale-110 hover:border-gym-lime hover:text-gym-lime"
                >
                  <Icon name="arrowRight" className="h-6 w-6 rotate-180" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white transition hover:scale-110 hover:border-gym-lime hover:text-gym-lime"
                >
                  <Icon name="arrowRight" className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <span className="h-px w-5 bg-gym-lime" />
              <p className="font-display text-xl font-bold uppercase tracking-wide text-white">
                {current.title}
              </p>
            </div>
            {count > 1 && (
              <div className="mt-3 flex items-center gap-1.5">
                {items.map((item, i) => (
                  <button
                    key={item.id ?? i}
                    type="button"
                    aria-label={`Go to ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={
                      i === index
                        ? "h-1.5 w-7 rounded-full bg-gym-lime transition-all duration-300"
                        : "h-1.5 w-1.5 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}