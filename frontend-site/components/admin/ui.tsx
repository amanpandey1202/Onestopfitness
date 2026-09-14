"use client";

import { useState } from "react";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn("surface-card", hover && "lift", className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  kicker,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="ph mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="phk label-kicker mb-2">{kicker}</p>}
        <h1 className="pht font-anton text-2xl uppercase tracking-wide text-white">{title}</h1>
        {subtitle && <p className="phs mt-1 text-sm text-white/55">{subtitle}</p>}
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
      "abtn p bg-primary text-primary-foreground shadow-glow hover:bg-gym-lime-soft disabled:bg-gym-lime/40",
    secondary:
      "abtn s border border-gym-lime text-gym-lime hover:bg-primary hover:text-primary-foreground",
    ghost: "abtn gh text-white/70 hover:text-white hover:bg-white/5",
    danger: "abtn d border border-red-400/40 text-red-300 hover:bg-red-500/10",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
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
        "w-full rounded-lg border border-input bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.1)]",
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
        "w-full rounded-lg border border-input bg-surface-3 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.1)]",
        className
      )}
      {...props}
    />
  );
}

export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        type={shown ? "text" : "password"}
        className={cn(
          "w-full rounded-lg border border-input bg-surface-3 px-3 py-2 pr-10 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.1)]",
          className
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={shown ? "Hide password" : "Show password"}
        onClick={() => setShown((v) => !v)}
        className="absolute inset-y-0 right-2 flex items-center text-white/45 transition hover:text-gym-lime"
      >
        {shown ? (
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-input bg-surface-3 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.1)]",
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
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary shadow-glow-sm" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full transition",
            checked ? "left-[22px] bg-primary-foreground" : "left-0.5 bg-white"
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "red" | "neutral" | "yellow" | "info" }) {
  const tones = {
    green: "badge g bg-gym-lime/15 text-gym-lime",
    red: "badge r bg-red-500/15 text-red-300",
    yellow: "badge a bg-yellow-500/15 text-yellow-300",
    info: "badge a bg-info/15 text-info",
    neutral: "badge n bg-white/10 text-white/75",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong py-14 text-center r-enter">
      <p className="text-sm font-semibold text-white/65">{title}</p>
      {children && <div className="mt-3 text-sm text-white/45">{children}</div>}
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
