"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
      <h1 className="mt-6 font-anton text-3xl uppercase text-gym-lime">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">Please try again, or return to the dashboard.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black">
          Try again
        </button>
        <Link href="/admin" className="rounded-md border border-white/20 px-6 py-2 text-sm font-bold text-white">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
