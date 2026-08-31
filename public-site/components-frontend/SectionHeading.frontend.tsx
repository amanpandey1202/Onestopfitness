"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export default function SectionHeadingFrontend({
  kicker,
  title,
  subtitle,
  align = "center",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);
  const center = align === "center";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShow(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const words = title.split(" ");

  return (
    <div ref={ref} className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {kicker && (
        <p
          className={`kicker transition-all duration-700 ${
            center ? "kicker-center" : ""
          } ${show ? "translate-x-0 opacity-100" : "translate-x-[-12px] opacity-0"}`}
          style={{ justifyContent: center ? "center" : undefined }}
        >
          {kicker}
        </p>
      )}
      <h2
        className={`font-anton mt-4 text-4xl uppercase leading-[0.95] tracking-tight text-white sm:text-5xl ${
          show ? "word-rise" : "opacity-0"
        }`}
        aria-label={title}
      >
        {words.map((w, i) => (
          <span key={i}>
            <span style={{ animationDelay: `${0.06 + i * 0.055}s` }}>
              {w}
              {i < words.length - 1 ? "\u00A0" : ""}
            </span>
          </span>
        ))}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-[0.95rem] text-white/55 transition-all duration-700 ${
            show ? "translate-y-0 delay-100 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}