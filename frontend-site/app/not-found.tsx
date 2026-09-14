import Link from "next/link";
import { brandParts } from "@/data/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gym-black px-4 text-center text-white">
      <p className="font-anton text-xl uppercase tracking-widest">
        {brandParts().word1} <span className="text-gym-lime">{brandParts().word2}</span>
      </p>
      <h1 className="mt-6 font-anton text-6xl uppercase text-gym-lime">404</h1>
      <p className="mt-3 text-sm text-white/60">This page could not be found.</p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-gym-lime px-6 py-2 text-sm font-bold text-gym-black"
      >
        Go home
      </Link>
    </div>
  );
}
