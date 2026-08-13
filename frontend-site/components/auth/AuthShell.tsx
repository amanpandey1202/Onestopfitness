import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  kicker = "Member Portal",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="panel p-7 sm:p-9">
      <p className="kicker">{kicker}</p>
      <h1 className="font-anton mt-4 text-4xl uppercase leading-none tracking-tight text-white">
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-sm text-white/50">{subtitle}</p>}
      <div className="mt-7">{children}</div>
      {footer && (
        <div className="mt-7 border-t border-white/10 pt-5 text-center text-sm text-white/50">
          {footer}
        </div>
      )}
    </div>
  );
}
