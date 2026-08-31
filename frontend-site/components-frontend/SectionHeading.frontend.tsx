"use client";

import { useEffect, useRef } from "react";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

/**
 * Premium section heading — small glowing kicker rule, condensed
 * Anton display title (word-by-word cascade reveal) and a quiet
 * Poppins subtitle.
 */
export default function SectionHeadingFrontend({
  kicker,
  title,
  subtitle,
  align = "center",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-inview");
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const center = align === "center";
  const words = title.split(" ");

  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`} ref={ref}>
      {kicker && (
        <p
          className={`kicker ${center ? "kicker-center" : ""}`}
          style={{ justifyContent: center ? "center" : undefined }}
        >
          {kicker}
        </p>
      )}
      <h2 className="font-anton mt-4 text-4xl uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
        <span className="word-rise" aria-label={title}>
          {words.map((word, i) => (
            <span
              key={i}
              className="word"
              aria-hidden="true"
              style={{ animationDelay: `${200 + i * 70}ms` }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </span>
          ))}
        </span>
      </h2>
      {subtitle && <p className="mt-4 text-[0.95rem] text-white/55">{subtitle}</p>}
    </div>
  );
}
