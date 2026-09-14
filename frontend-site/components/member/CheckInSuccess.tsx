"use client";

import { useEffect, useState } from "react";

/**
 * CheckInSuccess — full-screen animated overlay shown after a successful check-in.
 *
 * Animation sequence (~900ms total):
 *   0ms  → overlay fades in
 *   100ms → checkmark draws
 *   300ms → ring expands
 *   500ms → "YOU&apos;RE IN!" slides up
 *   800ms → starts fading out
 *   900ms → onDone() called
 */
interface Props {
  time: string;           // formatted check-in time e.g. "10:23 AM"
  onDone: () => void;     // called when animation completes
}

export default function CheckInSuccess({ time, onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "text" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 200);
    const t2 = setTimeout(() => setPhase("out"), 800);
    const t3 = setTimeout(() => onDone(), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{
        background: "rgba(12,16,16,0.97)",
        opacity: phase === "out" ? 0 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      {/* Ring + Checkmark */}
      <div className="relative flex items-center justify-center">
        {/* Expanding lime ring */}
        <div
          style={{
            width: phase === "in" ? 64 : 140,
            height: phase === "in" ? 64 : 140,
            borderRadius: "50%",
            border: "3px solid #9AD901",
            boxShadow: phase === "in" ? "none" : "0 0 32px #9AD90155",
            transition: "width 400ms cubic-bezier(0.34,1.56,0.64,1), height 400ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 400ms ease",
            position: "absolute",
          }}
        />
        {/* Checkmark SVG with draw animation */}
        <svg
          viewBox="0 0 52 52"
          style={{
            width: 56,
            height: 56,
            position: "relative",
            zIndex: 1,
          }}
        >
          <polyline
            points="14,28 24,38 38,18"
            fill="none"
            stroke="#9AD901"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: phase === "in" ? 40 : 0,
              transition: "stroke-dashoffset 350ms cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </svg>
      </div>

      {/* Text block */}
      <div
        style={{
          marginTop: 32,
          opacity: phase === "text" ? 1 : 0,
          transform: phase === "text" ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 300ms ease, transform 300ms ease",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Anton, sans-serif",
            fontSize: 36,
            letterSpacing: "0.08em",
            color: "#FFFFFF",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          YOU&apos;RE{" "}
          <span style={{ color: "#9AD901", textShadow: "0 0 16px #9AD90188" }}>
            IN!
          </span>
        </p>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Checked in at {time}
        </p>
        <p
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "rgba(154,217,1,0.6)",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Keep pushing 💪
        </p>
      </div>
    </div>
  );
}
