import Icon from "./Icons.frontend";

/**
 * Athletic editorial marquee — Anton words scrolling infinitely
 * with a lime bolt between them. Content is duplicated so the
 * loop is seamless.
 */
export default function MarqueeFrontend({ words }: { words: string[] }) {
  const track = [...words, ...words];
  return (
    <div className="marquee border-y border-white/10 bg-[#0c0c0c] py-4">
      <div className="marquee-track font-anton text-lg uppercase tracking-[0.3em] text-white/80 sm:text-2xl">
        {track.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-flex items-center gap-10">
            <span>{word}</span>
            <Icon name="zap" className="h-4 w-4 text-gym-lime" />
          </span>
        ))}
      </div>
    </div>
  );
}
