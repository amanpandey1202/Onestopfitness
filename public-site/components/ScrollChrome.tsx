"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

export default function ScrollChrome() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const root = document.documentElement;
        const max = root.scrollHeight - root.clientHeight;
        const p = max > 0 ? root.scrollTop / max : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        setShowTop(root.scrollTop > window.innerHeight * 0.85);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]"
      >
        <div
          ref={barRef}
          className="h-full w-full origin-left bg-gradient-to-r from-gym-lime-dim via-gym-lime to-gym-lime-soft shadow-[0_0_12px_rgba(154,217,1,0.7)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="float-in-up fixed bottom-5 left-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gym-ink/95 text-white/80 shadow-[0_10px_26px_-10px_rgba(0,0,0,0.8)] backdrop-blur transition hover:border-gym-lime hover:text-gym-lime active:scale-90"
        >
          <Icon name="arrowRight" className="h-5 w-5 -rotate-90" />
        </button>
      )}
    </>
  );
}