"use client";

import Image from "next/image";
import { useState } from "react";
import Reveal from "@/components/Reveal";

type GalleryItemFrontend = { imageUrl: string; title: string; mediaType?: string | null };

export default function GalleryGridFrontend({
  items,
  limit,
}: {
  items: GalleryItemFrontend[];
  limit?: number;
}) {
  const list = limit ? items.slice(0, limit) : items;
  const [lightbox, setLightbox] = useState<GalleryItemFrontend | null>(null);

  if (list.length === 0) {
    return (
      <p className="py-10 text-center text-white/50">
        Photos and videos are on the way — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item, i) => (
          <Reveal key={item.imageUrl + item.title} delay={i * 70} className="h-full">
            <button
              type="button"
              className="group relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0e0e0e] text-left transition duration-300 hover:border-gym-lime/45 hover:shadow-[0_0_0_1px_rgba(154,217,1,0.15),0_0_34px_rgba(154,217,1,0.12)] hover:-translate-y-1 active:scale-[0.98]"
              onClick={() => setLightbox(item)}
              aria-label={`View ${item.title}`}
            >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              {item.mediaType === "VIDEO" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={item.imageUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-black object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
              ) : (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
            </div>
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wide text-white">
              <span className="h-px w-3.5 bg-gym-lime" />
              {item.title}
            </figcaption>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Lightbox Pop-up */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full rounded-xl overflow-hidden border border-white/10 bg-[#0c0c0c] shadow-2xl transition-all duration-300 transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-gym-lime border border-white/10 text-xl font-bold transition"
              onClick={() => setLightbox(null)}
              aria-label="Close dialog"
            >
              ✕
            </button>
            <div className="relative aspect-[16/10] w-full">
              {lightbox.mediaType === "VIDEO" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={lightbox.imageUrl}
                  controls
                  autoPlay
                  className="h-full w-full bg-black object-contain"
                />
              ) : (
                <Image
                  src={lightbox.imageUrl}
                  alt={lightbox.title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
            </div>
            <div className="bg-black/60 p-4 text-center border-t border-white/5">
              <p className="text-sm font-medium tracking-wider text-white uppercase">
                {lightbox.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
