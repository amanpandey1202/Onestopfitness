import Image from "next/image";

type GalleryItemFrontend = { imageUrl: string; title: string; mediaType?: string | null };

export default function GalleryGridFrontend({
  items,
  limit,
}: {
  items: GalleryItemFrontend[];
  limit?: number;
}) {
  const list = limit ? items.slice(0, limit) : items;

  if (list.length === 0) {
    return (
      <p className="py-10 text-center text-white/50">
        Photos and videos are on the way — check back soon.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((item) => (
        <figure
          key={item.imageUrl + item.title}
          className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] transition duration-300 hover:border-gym-lime/45 hover:shadow-[0_0_0_1px_rgba(154,217,1,0.15),0_0_34px_rgba(154,217,1,0.12)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {item.mediaType === "VIDEO" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={item.imageUrl}
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className="h-full w-full bg-black object-cover"
              />
            ) : (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          </div>
          <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wide text-white">
            <span className="h-px w-3.5 bg-gym-lime" />
            {item.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
