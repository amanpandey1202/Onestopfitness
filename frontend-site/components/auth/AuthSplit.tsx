import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import { site, brandParts, establishedLine, copyrightLine } from "@/data/site";

/**
 * Bold premium split for every login screen:
 * left = giant italic Anton "BE YOUR BEST" brand hero,
 * right = the auth card. Used by member login/register and admin login.
 */
export default function AuthSplit({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — brand hero */}
      <div className="noise relative hidden overflow-hidden border-r border-white/10 bg-[#0a0a0a] lg:block">
        <div
          className="orb"
          style={{
            background: "rgba(154,217,1,0.3)",
            width: 420,
            height: 420,
            top: "-8%",
            right: "-6%",
          }}
        />
        <div
          className="orb"
          style={{
            background: "rgba(154,217,1,0.18)",
            width: 340,
            height: 340,
            bottom: "-10%",
            left: "-6%",
            animationDelay: "-5s",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gym-lime/60 bg-gym-lime/10 text-gym-lime shadow-[0_0_18px_rgba(154,217,1,0.35)]">
              <Icon name="dumbbell" className="h-5 w-5" />
            </span>
            <span className="font-anton text-lg uppercase tracking-wide text-white">
              {brandParts().word1}<span className="glow-lime">&nbsp;{brandParts().word2}</span>
            </span>
          </Link>

          <div>
            <p className="kicker">{site.auth.loginKicker}</p>
            <h1 className="font-anton mt-5 text-[clamp(3rem,6vw,5rem)] uppercase leading-[0.9] text-white">
              <span className="block">{site.tagline.substring(0, site.tagline.lastIndexOf(' '))}</span>
              <span className="glow-lime block">{site.tagline.substring(site.tagline.lastIndexOf(' ') + 1)}</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              Cardio · Weight Training · Martial Arts · Personal Training.<br/>
              {site.auth.loginTagline}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {site.auth.badges.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-gym-lime/30 bg-gym-lime/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gym-lime"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            {establishedLine()}
          </p>
        </div>
      </div>

      {/* Right — the auth form */}
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 py-12">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gym-lime/60 bg-gym-lime/10 text-gym-lime">
            <Icon name="dumbbell" className="h-5 w-5" />
          </span>
          <span className="font-anton text-lg uppercase tracking-wide text-white">
            {brandParts().word1}<span className="glow-lime">&nbsp;{brandParts().word2}</span>
          </span>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-8 text-xs text-white/35">
          {copyrightLine()}
        </p>
      </div>
    </div>
  );
}
