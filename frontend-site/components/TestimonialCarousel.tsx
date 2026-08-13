"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
};

/**
 * Non-stop auto-rotating reviews carousel with a fade transition.
 * Cycles through every 5 seconds and shows the reviewer's real name.
 */
export default function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % testimonials.length);
        setVisible(true);
      }, 450);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;
  const current = testimonials[index % testimonials.length];

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className={`panel relative overflow-hidden p-8 text-center transition-opacity duration-500 sm:p-12 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 text-gym-lime/[0.07]">
          <Icon name="quote" className="h-40 w-40" />
        </div>

        <div className="relative">
          <p
            className="flex items-center justify-center gap-1 text-gym-lime"
            aria-label="5 out of 5 stars"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                className="h-4 w-4 drop-shadow-[0_0_6px_rgba(154,217,1,0.6)]"
              />
            ))}
          </p>
          <blockquote className="mt-6 font-display text-lg leading-relaxed text-white/85 sm:text-xl">
            “{current.quote}”
          </blockquote>
          <figcaption className="mt-7">
            <p className="font-bold uppercase tracking-wide text-white">{current.name}</p>
            <p className="mt-1 text-sm text-white/50">
              {current.role ?? "Member"} · <span className="text-gym-lime">Verified</span>
            </p>
          </figcaption>
        </div>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => {
                setVisible(false);
                setTimeout(() => {
                  setIndex(i);
                  setVisible(true);
                }, 200);
              }}
              aria-label={`Show review from ${t.name}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-gym-lime" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
