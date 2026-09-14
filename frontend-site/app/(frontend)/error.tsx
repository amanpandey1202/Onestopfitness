"use client";
import { useEffect } from "react";
import Link from "next/link";
import { brandParts } from "@/data/site";

export default function FrontendError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gym-black px-4 text-center text-white">
      <p className="font-anton text-xl uppercase tracking-widest">
        {brandParts().word1} <span className="text-gym-lime">{brandParts().word2}</span>
      </p>
      <h1 className="mt-6 font-anton text-3xl uppercase text-gym-lime">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">Please try again, or return to the homepage.</p>
      {error && (
        <div className="mt-4 max-w-xl rounded-lg border border-red-500/30 bg-red-950/60 p-4 text-left font-mono text-xs text-red-200">
          <p className="font-bold text-red-400">Error Details:</p>
          <p className="mt-1 break-words">{error.message || "No error message"}</p>
          {error.digest && <p className="mt-1 text-white/40">Digest: {error.digest}</p>}
        </div>
      )}
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black">
          Try again
        </button>
        <Link href="/" className="rounded-md border border-white/20 px-6 py-2 text-sm font-bold text-white">
          Go home
        </Link>
      </div>
    </div>
  );
}
