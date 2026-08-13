type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

/**
 * Premium section heading — small glowing kicker rule, condensed
 * italic Anton display title and a quiet Poppins subtitle.
 */
export default function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
}: Props) {
  const center = align === "center";
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {kicker && (
        <p
          className={`kicker ${center ? "kicker-center" : ""}`}
          style={{ justifyContent: center ? "center" : undefined }}
        >
          {kicker}
        </p>
      )}
      <h2 className="font-anton mt-4 text-4xl uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-[0.95rem] text-white/55">{subtitle}</p>}
    </div>
  );
}
