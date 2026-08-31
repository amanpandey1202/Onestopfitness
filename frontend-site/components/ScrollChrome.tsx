"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

export default function ScrollChrome() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0);
        setShowTop(window.scrollY > 620);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 bg-white/5">
        <div
          className="h-full bg-gym-lime shadow-[0_0_14px_rgba(154,217,1,0.8)] transition-[width] duration-150 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 left-6 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gym-ink/90 text-white shadow-[0_10px_34px_rgba(0,0,0,0.55)] backdrop-blur transition hover:border-gym-lime hover:text-gym-lime active:scale-95"
        >
          <Icon name="arrowRight" className="h-4 w-4 -rotate-90" />
        </button>
      )}
    </>
  );
}