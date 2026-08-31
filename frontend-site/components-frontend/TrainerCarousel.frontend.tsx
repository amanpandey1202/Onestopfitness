"use client";

import { useEffect, useRef, useState } from "react";

type Trainer = {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  profileImageUrl: string | null;
  isFounder: boolean;
};

export default function TrainerCarousel({ trainers }: { trainers: Trainer[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sort: founder first
  const sorted = [...trainers].sort((a, b) => (b.isFounder ? 1 : 0) - (a.isFounder ? 1 : 0));

  const startAutoplay = () => {
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % sorted.length);
    }, 3500);
  };

  const stopAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.length]);

  const goTo = (idx: number) => {
    stopAutoplay();
    setActiveIdx(idx);
    startAutoplay();
  };

  const prev = () => goTo((activeIdx - 1 + sorted.length) % sorted.length);
  const next = () => goTo((activeIdx + 1) % sorted.length);

  if (sorted.length === 0) return null;

  return (
    <div className="trainer-carousel-root" onMouseEnter={stopAutoplay} onMouseLeave={startAutoplay}>
      {/* Slide Track */}
      <div className="trainer-carousel-track" ref={trackRef}>
        {sorted.map((t, i) => (
          <div
            key={t.id}
            className={`trainer-carousel-slide${i === activeIdx ? " active" : ""}`}
            aria-hidden={i !== activeIdx}
          >
            {/* Background image */}
            <div className="trainer-carousel-bg">
              {t.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.profileImageUrl} alt={t.name} />
              ) : (
                <div className="trainer-carousel-initial">{t.name.charAt(0)}</div>
              )}
              <div className="trainer-carousel-overlay" />
            </div>

            {/* Content */}
            <div className="trainer-carousel-content">
              {t.isFounder && (
                <span className="trainer-carousel-badge">Founder</span>
              )}
              <h3 className="trainer-carousel-name">{t.name}</h3>
              <p className="trainer-carousel-role">{t.specialization}</p>
              {t.bio && <p className="trainer-carousel-bio">{t.bio}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="trainer-carousel-controls">
        <button className="trainer-carousel-arrow" onClick={prev} aria-label="Previous trainer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="trainer-carousel-dots">
          {sorted.map((_, i) => (
            <button
              key={i}
              className={`trainer-carousel-dot${i === activeIdx ? " active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to trainer ${i + 1}`}
            />
          ))}
        </div>

        <button className="trainer-carousel-arrow" onClick={next} aria-label="Next trainer">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Counter */}
      <p className="trainer-carousel-counter">
        {activeIdx + 1} / {sorted.length}
      </p>
    </div>
  );
}
