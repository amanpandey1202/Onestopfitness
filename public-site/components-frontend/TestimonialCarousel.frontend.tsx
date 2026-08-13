"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons.frontend";

type TestimonialFrontend = {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  imageUrl?: string | null;
};

/**
 * Non-stop auto-rotating reviews with a fade. Premium framed card,
 * SVG stars, and the reviewer's real name.
 */
export default function TestimonialCarouselFrontend({
  testimonials,
}: {
  testimonials: TestimonialFrontend[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (testimonials.length <= 1 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 4500);
    return () => clearInterval(timer);
  }, [testimonials.length, paused]);

  if (testimonials.length === 0) return null;
  const current = testimonials[index % testimonials.length];

  return (
    <div className="mx-auto max-w-3xl" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        key={index}
        className={`testimonial-slide panel relative overflow-hidden p-8 text-center sm:p-12`}
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

          <blockquote className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
            “{current.quote}”
          </blockquote>

          <figcaption className="mt-7 flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-gym-lime/30 bg-gym-black shadow-[0_0_18px_rgba(154,217,1,0.25)]">
              {current.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-anton text-2xl uppercase text-gym-lime">
                  {current.name.trim().charAt(0).toUpperCase() || "M"}
                </span>
              )}
            </div>
            <div>
              <p className="font-anton text-lg uppercase tracking-wide text-white">
                {current.name}
              </p>
              <p className="mt-1 text-sm text-white/45">
                {current.role ?? "Member"} ·{" "}
                <span className="text-gym-lime">Verified Member</span>
              </p>
            </div>
          </figcaption>
        </div>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-7 flex items-center justify-center gap-2.5">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIndex(i)}
              aria-label={`Show review from ${t.name}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-9 bg-gym-lime shadow-[0_0_10px_rgba(154,217,1,0.7)]"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
