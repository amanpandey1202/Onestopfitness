"use client";

import { useState } from "react";
import { whatsappLink, site } from "@/data/site";

/**
 * No backend — testimonials are sent straight to the gym's WhatsApp
 * as a pre-filled message.
 */
export default function TestimonialForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = site.messages.testimonial(message, name);
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gym-ink p-6 shadow-card">
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
        Share Your <span className="text-gym-lime">Experience</span>
      </h3>
      <p className="mt-1 text-sm text-white/55">
        Been training with us? Your story could inspire the next member.
      </p>

      {sent ? (
        <div className="mt-5 rounded-xl border border-gym-lime/40 bg-gym-lime/10 p-5 text-center text-sm text-white/80">
          <p className="font-bold text-gym-lime">Thank you!</p>
          <p className="mt-1">
            WhatsApp should have opened with your message. Just press send!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="tname" className="mb-1 block text-sm font-medium text-white/75">
              Your Name
            </label>
            <input
              id="tname"
              type="text"
              placeholder="e.g. Rahul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-gym-black px-4 py-2.5 text-white outline-none transition focus:border-gym-lime"
            />
          </div>
          <div>
            <label htmlFor="tmsg" className="mb-1 block text-sm font-medium text-white/75">
              Your Experience
            </label>
            <textarea
              id="tmsg"
              rows={4}
              placeholder="Tell us about your journey..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-gym-black px-4 py-2.5 text-white outline-none transition focus:border-gym-lime"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gym-lime px-4 py-3 font-bold text-gym-black transition hover:bg-gym-lime-soft"
          >
            Send via WhatsApp
          </button>
        </form>
      )}
    </div>
  );
}
