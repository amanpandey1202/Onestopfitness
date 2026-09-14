"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const target = value;
    const start = prev.current;
    prev.current = target;
    if (start === target) {
      setDisplay(target);
      return;
    }
    const steps = 40;
    const step = (target - start) / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(start + step * i));
      if (i >= steps) {
        clearInterval(id);
        setDisplay(target);
      }
    }, 16);
    return () => clearInterval(id);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}