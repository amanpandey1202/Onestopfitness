"use client";

import { useEffect, useState } from "react";
import { Button, Card, Spinner } from "@/components/admin/ui";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on: (event: string, cb: (res: unknown) => void) => void };
  }
}

export default function MemberPayPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function pay(planId: string, planName: string) {
    setBusy(planId);
    setError(null);
    setSuccess(null);
    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Could not create order");

      // 2. Load Razorpay checkout script
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Could not load payment gateway"));
          document.head.appendChild(s);
        });
      }

      // 3. Open Razorpay modal
      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) return reject(new Error("Razorpay unavailable"));
        const rz = new window.Razorpay({
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name: "ONE STOP FITNESS",
          description: planName,
          prefill: orderData.prefill,
          theme: { color: "#9AD901" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            // 4. Verify with server
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) reject(new Error(verifyData.error || "Verification failed"));
            else resolve();
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rz.open();
      });

      setSuccess(`✓ ${planName} activated! Your membership is now live.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      if (msg !== "Payment cancelled") setError(msg);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Renew / Buy Membership
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Secure payment via Razorpay. Your membership activates instantly on payment.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-gym-lime/30 bg-gym-lime/10 px-4 py-3 text-sm font-semibold text-gym-lime">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const months = plan.durationDays % 30 === 0 ? plan.durationDays / 30 : null;
          return (
            <Card key={plan.id} className="p-6 flex flex-col">
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold uppercase text-white">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1 text-sm text-white/55">{plan.description}</p>
                )}
                <p className="mt-4 font-display text-3xl font-bold text-gym-lime">
                  ₹{plan.price.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-white/50">
                    /{months ? `${months} month${months > 1 ? "s" : ""}` : `${plan.durationDays} days`}
                  </span>
                </p>
                {plan.features.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-sm text-white/65">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1 text-gym-lime">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Button
                className="mt-6 w-full"
                disabled={!!busy}
                onClick={() => pay(plan.id, plan.name)}
              >
                {busy === plan.id ? "Processing…" : `Pay ₹${plan.price.toLocaleString("en-IN")}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
