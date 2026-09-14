"use client";

/**
 * Real-time password strength checklist.
 * Shows four criteria ticking off as the user types.
 * Used on register, reset-password, and change-password forms.
 */

type Rule = { label: string; test: (p: string) => boolean };

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains a letter", test: (p) => /[A-Za-z]/.test(p) },
  { label: "Contains a number", test: (p) => /\d/.test(p) },
  { label: "Contains a special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
            {ok ? (
              <svg
                className="h-3.5 w-3.5 shrink-0 text-gym-lime"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
            )}
            <span className={ok ? "text-white/70" : "text-white/35"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Returns true only when all password rules pass — use for submit-button gating. */
export function passwordIsStrong(p: string): boolean {
  return RULES.every((r) => r.test(p));
}
