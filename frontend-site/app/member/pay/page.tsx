"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
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
        const loadedPlans = plansData.plans ?? [];
        setPlans(loadedPlans);

        if (initialPlanId) {
          setSelectedPlanId(initialPlanId);
        } else if (loadedPlans.length > 0) {
          setSelectedPlanId(loadedPlans[0].id);
        }

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
  }, [initialOfferId, initialPlanId]);

  async function handlePay(planId: string) {
    setBusy(planId);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          offerId: selectedOffer?.id,
        }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/member/pay?planId=${planId}${selectedOffer?.id ? `&offerId=${selectedOffer.id}` : ""}`)}`);
        return;
      }

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Payment initialization failed.");

      if (orderData.isTestMode) {
        setTestOrderData({
          orderId: orderData.orderId,
          planName: orderData.plan.name,
          amount: orderData.plan.finalPrice,
          discountAmount: orderData.plan.discountAmount || 0,
        });
        setBusy(null);
        return;
      }

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Could not load checkout script."));
          document.head.appendChild(s);
        });
      }

      const rz = new window.Razorpay!({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "ONE STOP FITNESS",
        description: `Plan: ${orderData.plan.name}`,
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
          if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
          router.push(verifyData.redirectUrl);
        },
      });
      rz.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment error");
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
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
      router.push(verifyData.redirectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
      setBusy(null);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  if (isUnauthenticated) {
    return (
      <div className="min-h-screen bg-gym-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4 border-white/5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            🔑
          </div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Member Login Required</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Please log in with your gym member credentials to view custom plans or extend your active membership details.
          </p>
          <Button className="w-full mt-2" onClick={() => router.push("/login?next=/member/pay")}>
            Log In to Proceed →
          </Button>
        </Card>
      </div>
    );
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  let finalPrice = basePrice;
  let discountAmount = 0;

  if (selectedPlan && selectedOffer) {
    if (selectedOffer.discountType === "PERCENT" && selectedOffer.discountValue) {
      discountAmount = Math.round((basePrice * selectedOffer.discountValue) / 100);
      finalPrice = Math.max(1, basePrice - discountAmount);
    } else if (selectedOffer.discountType === "AMOUNT" && selectedOffer.discountValue) {
      discountAmount = selectedOffer.discountValue;
      finalPrice = Math.max(1, basePrice - discountAmount);
    }
  }

  return (
    <div className="min-h-screen bg-gym-black text-white px-4 py-8 md:py-16">
      <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="font-anton text-2xl uppercase tracking-wider text-white hover:text-gym-lime transition">
            ONE STOP <span className="text-gym-lime">FITNESS</span>
          </Link>
          <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold uppercase tracking-wide">
            Member Checkout
          </h1>
          <p className="mt-1 text-xs md:text-sm text-white/50">
            Extend your membership expiry or purchase new plans.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Checkout Block */}
        <div className="grid gap-6 md:grid-cols-5 items-start">
          
          {/* Plan Selector Column */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Active Plan Card */}
            {activeMembership && (
              <Card className="p-4 md:p-6 border-white/5 bg-[#0d0d0d] space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gym-lime">Active Subscription</span>
                    <h2 className="font-display text-lg font-bold text-white uppercase mt-0.5">{activeMembership.planName}</h2>
                  </div>
                  <Badge tone="green">Active</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-white/5 pt-3">
                  <p className="text-xs text-white/45">
                    Expiry Date: <span className="font-bold text-white">{formatDate(activeMembership.endDate)}</span>
                  </p>
                  <p className="text-[10px] text-gym-lime font-medium bg-gym-lime/10 px-2 py-1 rounded">
                    +{activeMembership.daysRemaining} days remaining
                  </p>
                </div>
              </Card>
            )}

            {/* Plan Selector Card */}
            <Card className="p-4 md:p-6 space-y-4 border-white/5 bg-[#0d0d0d]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Select Extension Plan</h3>
                <p className="text-xs text-white/40 mt-0.5">Your membership validity will extend from your current expiry date.</p>
              </div>

              <div className="space-y-3">
                {plans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <label
                      key={plan.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer select-none ${
                        isSelected
                          ? "border-gym-lime bg-gym-lime/5 shadow-[0_0_20px_rgba(154,217,1,0.06)]"
                          : "border-white/10 bg-[#121212] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={isSelected}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="accent-gym-lime h-4.5 w-4.5 cursor-pointer"
                        />
                        <div className="text-left">
                          <span className="block text-sm font-bold text-white uppercase tracking-wider">{plan.name}</span>
                          <span className="block text-xs text-white/45 mt-0.5">+{plan.durationDays} Days Extension</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-gym-lime">
                          ₹{plan.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Checkout Summary Column */}
          <div className="md:col-span-2">
            <Card className="p-4 md:p-6 border-white/5 bg-[#0d0d0d] space-y-6 sticky top-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Invoice Summary</h3>
                <p className="text-xs text-white/40 mt-0.5">Please verify selection details.</p>
              </div>

              {/* Offer Banner */}
              {selectedOffer && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">🔥 Offer Applied</span>
                    <button className="text-[10px] text-white/40 hover:text-white" onClick={() => setSelectedOffer(null)}>
                      Remove
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white">{selectedOffer.title}</h4>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-3 text-xs md:text-sm border-t border-white/5 pt-4">
                <div className="flex justify-between text-white/60">
                  <span>Extension Rate</span>
                  <span>₹{basePrice.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Campaign Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span>Platform Fee</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3 text-base font-extrabold text-white">
                  <span>Total Amount</span>
                  <span className="text-gym-lime">₹{finalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Pay Action */}
              <Button
                className="w-full py-3 font-semibold text-sm rounded-lg"
                disabled={!!busy || !selectedPlanId}
                onClick={() => handlePay(selectedPlanId)}
              >
                {busy ? "Activating gateway..." : "Extend Membership Now"}
              </Button>

              <div className="text-[10px] text-white/35 text-center leading-relaxed">
                Your new membership validation period will be calculated extending exactly from your current expiry date.
              </div>
            </Card>
          </div>
        </div>

        {/* Test Mode Gate */}
        {testOrderData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <Card className="w-full max-w-md p-6 space-y-5 border-gym-lime/40 bg-[#0d0d0d] shadow-[0_0_50px_rgba(154,217,1,0.15)]">
              <div className="text-center space-y-1">
                <h2 className="font-display text-xl font-bold uppercase text-white">Demo Payment Simulation</h2>
                <p className="text-xs text-white/50">Simulated credit checkout</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#121212] p-4 text-sm flex justify-between font-bold">
                <span>{testOrderData.planName}</span>
                <span className="text-gym-lime">₹{testOrderData.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" disabled={!!busy} onClick={confirmTestPayment}>
                  {busy === "test_confirm" ? "Confirming..." : "Simulate Success"}
                </Button>
                <Button variant="secondary" onClick={() => setTestOrderData(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
