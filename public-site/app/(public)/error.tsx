"use client";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gym-black px-4 text-center text-white">
      <p className="font-anton text-xl uppercase tracking-widest">
        ONE STOP <span className="text-gym-lime">FITNESS</span>
      </p>
      <h1 className="mt-6 font-anton text-3xl uppercase text-gym-lime">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">Please try again, or return to the homepage.</p>
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
