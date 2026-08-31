"use client";

import { useEffect, useRef } from "react";
import type { ElementType, ReactNode } from "react";

type Variant = "up" | "left" | "right" | "zoom" | "blur";

const VARIANTS: Record<Variant, string> = {
  up: "",
  left: " reveal-left",
  right: " reveal-right",
  zoom: " reveal-zoom",
  blur: " reveal-blur",
};

type RevealProps<T extends ElementType> = {
  as?: T;
  variant?: Variant;
  delay?: number;
  className?: string;
  children: ReactNode;
};

export default function Reveal<T extends ElementType = "div">({
  as,
  variant = "up",
  delay = 0,
  className = "",
  children,
}: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delay > 0) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("reveal-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as React.Ref<never>} className={`reveal${VARIANTS[variant]}${className ? ` ${className}` : ""}`}>
      {children}
    </Tag>
  );
}