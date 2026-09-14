"use client";

import { useState } from "react";
import { whatsappLink, site } from "@/data/site";

/**
 * Review form — sends the message straight to WhatsApp. Restyled to
 * the frontend.css design language (form-card / form-field / button-primary).
 */
export default function TestimonialFormFrontend() {
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
    <div className="form-card">
      <h3>Share your experience<span style={{ color: "var(--lime)" }}>.</span></h3>
      <p className="form-sub">
        Been training with us? Your words help the next member take the first step.
      </p>

      {sent ? (
        <div className="form-success" style={{ textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", margin: "0 auto", width: 46, height: 46, border: "1.5px solid var(--lime)", background: "rgba(200,255,40,.08)", color: "var(--lime)" }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <strong style={{ marginTop: 16 }}>Thank you.</strong>
          <p>WhatsApp should have opened with your message. Just press send.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="ftname">Your name</label>
            <input
              id="ftname"
              type="text"
              placeholder="e.g. Rahul"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="ftmsg">Your experience</label>
            <textarea
              id="ftmsg"
              rows={4}
              placeholder="Tell us about your journey..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button type="submit" className="button-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Send via WhatsApp
          </button>
        </form>
      )}
    </div>
  );
}