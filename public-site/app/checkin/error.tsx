"use client";
import Link from "next/link";

export default function CheckinError({
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
      <h1 className="mt-6 font-anton text-3xl uppercase text-gym-lime">Check-in error</h1>
      <p className="mt-3 max-w-md text-sm text-white/60">
        We couldn&apos;t process your check-in. Please speak to the front desk or contact us on WhatsApp.
      </p>
      <Link href="/" className="mt-8 inline-block rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black">
        Go to Website
      </Link>
    </div>
  );
}
