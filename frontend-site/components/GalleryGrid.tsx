import Image from "next/image";

type GalleryItem = { imageUrl: string; title: string; mediaType?: string | null };

export default function GalleryGrid({
  items,
  limit,
}: {
  items: GalleryItem[];
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
          className="group overflow-hidden rounded-xl border border-white/10 bg-gym-ink"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            {item.mediaType === "VIDEO" ? (
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
          </div>
          <figcaption className="px-4 py-3 text-sm font-medium text-white/75">
            {item.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
