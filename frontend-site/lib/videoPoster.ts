import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

ffmpeg.setFfmpegPath(ffmpegStatic ?? "ffmpeg");

/**
 * Extracts a poster frame (thumbnail JPG) from a video buffer.
 * Writes the video to a temp file, grabs frame 1s in, then reads back the JPG.
 * Returns the poster image bytes, or null on any failure (caller decides).
 *
 * Non-fatal by design — a failed poster extraction must never block an upload.
 */
export async function extractVideoPoster(
  videoBuffer: Buffer,
  ext: string,
): Promise<Buffer | null> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osf-video-"));
  const input = path.join(tmpDir, `in${ext || ".mp4"}`);
  const output = path.join(tmpDir, "poster.jpg");

  try {
    fs.writeFileSync(input, videoBuffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(input)
        .screenshots({
          timemarks: ["1"],
          filename: "poster.jpg",
          folder: tmpDir,
          size: "640x?",
        })
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err));
    });

    if (!fs.existsSync(output)) return null;
    const poster = fs.readFileSync(output);
    return poster.length > 0 ? poster : null;
  } catch (e) {
    console.error("[video-poster] extraction failed:", e);
    return null;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}