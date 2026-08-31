/**
 * Consistent premium page header — glowing kicker, condensed Anton
 * display title and a quiet subtitle, over ambient glow + grain.
 */
export default function PageHeroFrontend({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="noise relative overflow-hidden border-b border-white/10">
      <div
        className="orb"
        style={{
          background: "rgba(154,217,1,0.22)",
          width: 340,
          height: 340,
          top: "-30%",
          right: "-4%",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(700px 320px at 50% 0%, rgba(154,217,1,0.09), transparent 65%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="kicker kicker-center r-enter mx-auto">{kicker}</p>
        <h1 className="font-anton r-enter r-enter-1 mt-6 uppercase leading-[0.9] text-white sm:text-6xl text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="r-enter r-enter-2 mx-auto mt-5 max-w-2xl text-[0.95rem] text-white/60">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
