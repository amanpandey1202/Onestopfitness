"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  speedRange?: [number, number];
};

export default function ScrollZoom({ children, className = "", speedRange = [0.9, 1.5] }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;

    const io = new IntersectionObserver(
      ([e]) => {
        el.classList.toggle("is-inview", e.isIntersecting);
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      const depth = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
      const t = speedRange[0] + depth * (speedRange[1] - speedRange[0]);
      el.style.setProperty("--scroll-zoom-t", t.toFixed(2));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speedRange]);

  return (
    <div ref={wrapRef} className={`scroll-zoom ${className}`}>
      {children}
    </div>
  );
}