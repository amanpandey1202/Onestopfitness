"use client";
import { useEffect } from "react";
import { site } from "@/data/site";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "Impact, sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {site.name}
          </h1>
          <p style={{ marginTop: 12 }}>
            Something went wrong.{" "}
            <button
              onClick={reset}
              style={{
                background: "#9ad901",
                color: "#000",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </p>
        </div>
      </body>
    </html>
  );
}
