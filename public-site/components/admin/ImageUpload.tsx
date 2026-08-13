"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { Button } from "./ui";

export type MediaType = "IMAGE" | "VIDEO";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-m4v";

function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

/**
 * Media uploader for admin forms. POSTs to /api/upload (admin-guarded) and
 * reports the returned public URL back through `onChange`. Set `allowVideo`
 * (e.g. for the gallery) to also accept MP4/WebM/MOV files.
 */
export default function ImageUpload({
  value,
  onChange,
  onTypeChange,
  folder = "misc",
  allowVideo = false,
  mediaType = "IMAGE",
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  onTypeChange?: (type: MediaType) => void;
  folder?: string;
  allowVideo?: boolean;
  mediaType?: MediaType;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      if (onTypeChange && (data.type === "IMAGE" || data.type === "VIDEO")) {
        onTypeChange(data.type);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const showVideoPreview = mediaType === "VIDEO" || isVideoUrl(value);

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border border-white/15 bg-gym-black">
          {value && showVideoPreview ? (
            <video
              src={value}
              muted
              playsInline
              controls
              className="h-full w-full object-cover"
            />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/20">
              <Icon name={allowVideo ? "camera" : "image"} className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : allowVideo ? "Upload media" : "Upload image"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange("")}>
              Remove
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={allowVideo ? `${IMAGE_ACCEPT},${VIDEO_ACCEPT}` : IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          {allowVideo && !value && (
            <p className="text-xs text-white/40">Photos up to 5MB · Videos up to 50MB</p>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
