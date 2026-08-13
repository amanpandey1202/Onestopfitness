"use client";

import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-white/10 bg-gym-ink", className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-gym-lime text-gym-black hover:bg-gym-lime-soft disabled:bg-gym-lime/40",
    secondary:
      "border border-gym-lime text-gym-lime hover:bg-gym-lime hover:text-gym-black",
    ghost: "text-white/70 hover:text-white",
    danger: "border border-red-400/40 text-red-300 hover:bg-red-500/10",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/60">{children}</label>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-white/15 bg-gym-black px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-gym-lime",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-white/15 bg-gym-black px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-gym-lime",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-white/15 bg-gym-black px-3 py-2 text-sm text-white outline-none transition focus:border-gym-lime",
        className
      )}
      {...props}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-white/80"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition",
          checked ? "bg-gym-lime" : "bg-white/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "red" | "neutral" | "yellow" }) {
  const tones = {
    green: "bg-gym-lime/15 text-gym-lime",
    red: "bg-red-500/15 text-red-300",
    yellow: "bg-yellow-500/15 text-yellow-300",
    neutral: "bg-white/10 text-white/70",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 py-14 text-center">
      <p className="text-sm font-semibold text-white/60">{title}</p>
      {children && <div className="mt-3 text-sm text-white/40">{children}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-gym-lime",
        className
      )}
    />
  );
}
