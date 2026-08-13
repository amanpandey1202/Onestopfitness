"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
};

type ActiveMembership = {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: string;
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountValue: number | null;
  discountType: string | null;
};

export default function MemberPayPage({
  searchParams,
}: {
  searchParams?: Promise<{ planId?: string; offerId?: string }>;
}) {
  const params = searchParams ? use(searchParams) : {};
  const initialPlanId = params.planId;
  const initialOfferId = params.offerId;

  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // Test mode modal state
  const [testOrderData, setTestOrderData] = useState<{
    orderId: string;
    planName: string;
    amount: number;
    discountAmount: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/plans").then((r) => r.json()),
      fetch("/api/me").then((r) => (r.ok ? r.json() : null)),
      initialOfferId ? fetch("/api/public/offers").then((r) => r.json()) : Promise.resolve(null),
    ])
      .then(([plansData, meData, offersData]) => {
        setPlans(plansData.plans ?? []);

        if (!meData || !meData.user) {
          setIsUnauthenticated(true);
        } else if (meData?.user?.memberships) {
          const active = meData.user.memberships.find(
            (m: { status: string; endDate: string }) =>
              m.status === "ACTIVE" && new Date(m.endDate) >= new Date()
          );
          if (active) {
            const daysLeft = Math.ceil(
              (new Date(active.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            setActiveMembership({
              id: active.id,
              planName: active.plan?.name || "Membership",
              startDate: active.startDate,
              endDate: active.endDate,
              daysRemaining: Math.max(0, daysLeft),
              status: active.status,
            });
          }
        }

        if (offersData?.offers && initialOfferId) {
          const found = offersData.offers.find((o: Offer) => o.id === initialOfferId);
          if (found) setSelectedOffer(found);
        }
      })
      .catch(() => setError("Failed to load plans."))
      .finally(() => setLoading(false));
  }, [initialOfferId]);

  async function initiatePayment(planId: string) {
    if (isUnauthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/member/pay?planId=${planId}`)}`);
      return;
    }

    setBusy(planId);
    setError(null);

    try {
      // 1. Create payment order (supports Real Razorpay or Test Mode)
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          offerId: selectedOffer?.id,
        }),
      });

      const orderData = await res.json();
      if (res.status === 401) {
        setIsUnauthenticated(true);
        router.push(`/login?next=${encodeURIComponent(`/member/pay?planId=${planId}`)}`);
        return;
      }
      if (!res.ok) throw new Error(orderData.error || "Could not initialize payment.");

      if (orderData.isTestMode) {
        // Test Mode Modal
        setTestOrderData({
          orderId: orderData.orderId,
          planName: orderData.plan.name,
          amount: orderData.plan.finalPrice,
          discountAmount: orderData.plan.discountAmount || 0,
        });
        setBusy(null);
        return;
      }

      // Real Razorpay Checkout
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Could not load Razorpay gateway script."));
          document.head.appendChild(s);
        });
      }

      await new Promise<void>((resolve, reject) => {
        if (!window.Razorpay) return reject(new Error("Razorpay unavailable"));
        const rz = new window.Razorpay({
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          name: "ONE STOP FITNESS",
          description: `Membership: ${orderData.plan.name}`,
          prefill: orderData.prefill,
          theme: { color: "#9AD901" },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
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
            else {
              router.push(verifyData.redirectUrl || `/member/pay/success?paymentId=${response.razorpay_order_id}`);
              resolve();
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled by user.")) },
        });
        rz.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      if (msg !== "Payment cancelled by user.") setError(msg);
      setBusy(null);
    }
  }

  async function confirmTestPayment() {
    if (!testOrderData) return;
    setBusy("test_confirm");
    try {
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderData.orderId,
          isTestMode: true,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
      router.push(verifyData.redirectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment confirmation failed");
      setBusy(null);
      setTestOrderData(null);
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
          Instant activation. If you already have an active plan, paying extends your membership seamlessly.
        </p>
      </div>

      {/* Unauthenticated Alert Banner */}
      {isUnauthenticated && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-yellow-400 uppercase">
              🔑 Member Login Required
            </h2>
            <p className="mt-1 text-xs text-white/70">
              Please log in to your account so we can link your membership and send your receipt.
            </p>
          </div>
          <Button onClick={() => router.push("/login?next=/member/pay")}>
            Log In to Proceed →
          </Button>
        </div>
      )}

      {/* Active Membership Banner */}
      {activeMembership && (
        <div className="rounded-xl border border-gym-lime/40 bg-gym-lime/10 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="green">Active Plan</Badge>
              <h2 className="font-display text-lg font-bold text-white uppercase">{activeMembership.planName}</h2>
            </div>
            <p className="mt-1 text-xs text-white/70">
              Valid until <span className="font-bold text-gym-lime">{formatDate(activeMembership.endDate)}</span> ({activeMembership.daysRemaining} days remaining)
            </p>
          </div>
          <p className="text-xs text-gym-lime/90 font-semibold bg-gym-lime/10 px-3 py-1.5 rounded-lg border border-gym-lime/20">
            ℹ️ Selecting any plan below extends your expiry date by 30 days!
          </p>
        </div>
      )}

      {/* Selected Offer Banner */}
      {selectedOffer && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">🔥 Applied Discount</span>
            <p className="font-display text-base font-bold text-white">{selectedOffer.title}</p>
            {selectedOffer.description && <p className="text-xs text-white/60">{selectedOffer.description}</p>}
          </div>
          <Button variant="secondary" className="text-xs py-1" onClick={() => setSelectedOffer(null)}>
            Remove Offer
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Test Mode Modal */}
      {testOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-5 border-gym-lime/40 shadow-[0_0_40px_rgba(154,217,1,0.2)]">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gym-lime/20 text-gym-lime font-bold">
                💳
              </div>
              <h2 className="mt-3 font-display text-xl font-bold uppercase text-white">
                Demo Payment Gateway
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Razorpay Live keys not set — running in Test Mode
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-white/50">Plan:</span>
                <span className="font-bold text-white">{testOrderData.planName}</span>
              </div>
              {testOrderData.discountAmount > 0 && (
                <div className="flex justify-between text-yellow-400">
                  <span>Discount:</span>
                  <span>-₹{testOrderData.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 text-base font-bold text-gym-lime">
                <span>Amount:</span>
                <span>₹{testOrderData.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" disabled={!!busy} onClick={confirmTestPayment}>
                {busy === "test_confirm" ? "Activating…" : "Simulate Successful Payment"}
              </Button>
              <Button variant="secondary" onClick={() => setTestOrderData(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          let finalPrice = plan.price;
          let discountText = null;

          if (selectedOffer) {
            if (selectedOffer.discountType === "PERCENT" && selectedOffer.discountValue) {
              const d = Math.round((plan.price * selectedOffer.discountValue) / 100);
              finalPrice = Math.max(1, plan.price - d);
              discountText = `${selectedOffer.discountValue}% OFF`;
            } else if (selectedOffer.discountType === "AMOUNT" && selectedOffer.discountValue) {
              finalPrice = Math.max(1, plan.price - selectedOffer.discountValue);
              discountText = `₹${selectedOffer.discountValue} OFF`;
            }
          }

          const isSelected = initialPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col transition-all ${
                isSelected ? "border-gym-lime shadow-[0_0_20px_rgba(154,217,1,0.2)]" : ""
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold uppercase text-white">{plan.name}</h2>
                  {discountText && (
                    <Badge tone="yellow">{discountText}</Badge>
                  )}
                </div>

                {plan.description && (
                  <p className="mt-1 text-sm text-white/55">{plan.description}</p>
                )}

                <div className="mt-4 flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold text-gym-lime">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                  {finalPrice !== plan.price && (
                    <p className="text-sm text-white/40 line-through">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </p>
                  )}
                  <span className="text-xs text-white/40">/ {plan.durationDays} days</span>
                </div>

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
                onClick={() => initiatePayment(plan.id)}
              >
                {busy === plan.id
                  ? "Processing…"
                  : isUnauthenticated
                  ? "Log In to Pay"
                  : activeMembership
                  ? `Extend Membership (+30 Days)`
                  : `Pay ₹${finalPrice.toLocaleString("en-IN")}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
