"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/components/admin/ui";

type MeResponse = {
  user?: { name: string; email: string; phone: string | null } | null;
  membership?: { id: string; status: string } | null;
};

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load the payment window."));
    document.body.appendChild(s);
  });
}

const baseBtn =
  "inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition disabled:cursor-not-allowed disabled:opacity-50";

export default function PayNowButton({
  plan,
  variant = "dark",
}: {
  plan: { id: string; name: string; price: number };
  variant?: "dark" | "light";
}) {
  const [me, setMe] = useState<MeResponse | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => setMe(null));
  }, []);

  async function startPayment() {
    setBusy(true);
    setMsg(null);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) throw new Error(orderData.error || "Couldn't start payment.");

      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Payment is unavailable right now.");

      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ONE STOP FITNESS",
        description: plan.name,
        order_id: orderData.orderId,
        method: {
          card: true,
          netbanking: true,
          upi: true,
          wallet: false,
          emi: false,
        },
        prefill: {
          name: orderData.prefill?.name ?? "",
          email: orderData.prefill?.email ?? "",
          contact: orderData.prefill?.contact ?? "",
        },
        theme: { color: "#9ad901" },
        handler: async (response: RazorpayCheckoutResponse) => {
          setBusy(true);
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment not confirmed.");
            setMsg({
              ok: true,
              text: `Payment successful! Your ${plan.name} membership is now active. You can check in from your dashboard.`,
            });
          } catch (e) {
            setMsg({
              ok: false,
              text: e instanceof Error ? e.message : "Payment not confirmed. Contact the gym if money was deducted.",
            });
          } finally {
            setBusy(false);
          }
        },
      });

      rzp.on("payment.failed", () => {
        setMsg({ ok: false, text: "Payment was not completed. You can try again." });
        setBusy(false);
      });

      rzp.open();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const isMember = Boolean(me?.user);

  if (me === undefined) {
    return (
      <span className={cn(baseBtn, "border border-white/15 text-white/40")}>
        Loading…
      </span>
    );
  }

  if (!isMember) {
    return (
      <Link
        href="/login?next=/pricing"
        className={cn(
          baseBtn,
          variant === "light"
            ? "border border-[#101416] bg-[#101416] text-[#ece8dc] hover:bg-gym-lime hover:text-[#101416]"
            : "border border-gym-lime/50 bg-gym-ink text-gym-lime hover:border-gym-lime hover:bg-gym-lime/15"
        )}
      >
        Login to Pay Online
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={startPayment}
        disabled={busy}
        className={cn(
          baseBtn,
          variant === "light"
            ? "border border-[#101416] bg-[#101416] text-[#ece8dc] hover:bg-gym-lime hover:text-[#101416] hover:shadow-[0_0_18px_rgba(200,255,40,0.35)]"
            : "border border-gym-lime/50 bg-gym-ink text-gym-lime hover:border-gym-lime hover:bg-gym-lime/15 hover:shadow-[0_0_18px_rgba(154,217,1,0.22)]"
        )}
      >
        {busy ? "Processing…" : "Pay Online · ₹" + plan.price.toLocaleString("en-IN")}
      </button>
      {msg && (
        <p className={`mt-2 text-center text-xs leading-relaxed ${msg.ok ? "text-gym-lime" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
