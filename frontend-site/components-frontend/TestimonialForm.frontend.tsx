"use client";

import { useState } from "react";
import { whatsappLink } from "@/data/site";
import Icon from "./Icons.frontend";

/**
 * No backend — testimonials go straight to the gym's WhatsApp as a
 * pre-filled message.
 */
export default function TestimonialFormFrontend() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = `Hi ONE STOP FITNESS! I'd like to share my experience:\n\n"${message}"\n\n— ${name || "A member"}`;
    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  const inputCls =
    "w-full rounded-md border border-white/12 bg-[#0a0a0a] px-4 py-3 text-white outline-none transition focus:border-gym-lime focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.12)]";

  return (
    <div className="panel p-7">
      <h3 className="font-anton text-2xl uppercase leading-none text-white">
        Share Your <span className="glow-lime">Experience</span>
      </h3>
      <p className="mt-2 text-sm text-white/55">
        Been training with us? Your story could inspire the next member.
      </p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-gym-lime/35 bg-gym-lime/10 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gym-lime text-[#101010] shadow-[0_0_22px_rgba(154,217,1,0.5)]">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-gym-lime">
            Thank you!
          </p>
          <p className="mt-1.5 text-sm text-white/70">
            WhatsApp should have opened with your message. Just press send!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="ftname" className="mb-1.5 block text-sm font-medium text-white/75">
              Your Name
            </label>
            <input
              id="ftname"
              type="text"
              placeholder="e.g. Rahul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="ftmsg" className="mb-1.5 block text-sm font-medium text-white/75">
              Your Experience
            </label>
            <textarea
              id="ftmsg"
              rows={4}
              placeholder="Tell us about your journey..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputCls}
            />
          </div>
          <button type="submit" className="btn btn-whatsapp w-full">
            <Icon name="whatsapp" className="h-[1.1rem] w-[1.1rem]" />
            Send via WhatsApp
          </button>
        </form>
      )}
    </div>
  );
}
