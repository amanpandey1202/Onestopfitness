"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { site } from "@/data/site";

type GalleryItemFrontend = {
  imageUrl: string;
  title: string;
  mediaType?: string | null;
  posterUrl?: string | null;
};

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
      <p className="photo-empty">
        Photos and videos are on the way — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="photo-grid">
        {list.map((item, i) => (
          <Reveal key={item.imageUrl + item.title} delay={i * 60}>
            <figure
              role="button"
              tabIndex={0}
              onClick={() => setLightbox(item)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightbox(item); } }}
              aria-label={`View ${item.title}`}
              className="group relative h-full w-full overflow-hidden bg-[#1a2020]"
            >
              {item.mediaType === "VIDEO" ? (
                <>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={item.imageUrl}
                    poster={item.posterUrl ?? undefined}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <div className="photo-play">
                    <span>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, transform: "translateX(2px)" }}>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={`${item.title} at ${site.name}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              <figcaption>
                <span>{item.title}</span>
                <small>0{i + 1}</small>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery lightbox"
        >
          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              aria-label="Close lightbox"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 50,
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(236,232,220,.26)",
                background: "rgba(10,13,14,.8)",
                color: "var(--paper)",
                cursor: "pointer",
                transition: "border-color .25s, color .25s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--lime)"; e.currentTarget.style.color = "var(--lime)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(236,232,220,.26)"; e.currentTarget.style.color = "var(--paper)"; }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div style={{ position: "relative", aspectRatio: "16/10", width: "100%", background: "#080b0b" }}>
              {lightbox.mediaType === "VIDEO" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={lightbox.imageUrl}
                  poster={lightbox.posterUrl ?? undefined}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightbox.imageUrl}
                  alt={lightbox.title}
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              )}
            </div>
            <div style={{ padding: "14px 16px", background: "#0a0d0e", textAlign: "center", borderTop: "1px solid rgba(236,232,220,.1)" }}>
              <span style={{ color: "var(--paper)", font: "700 11px var(--font-space-mono),monospace", letterSpacing: ".14em", textTransform: "uppercase" }}>
                {lightbox.title}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}