"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { site, brandParts } from "@/data/site";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/admin/ui";
import { applyOfferDiscount } from "@/lib/discount";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  features: string[];
};

type Offer = {
  id: string;
  title: string;
  description: string | null;
  discountValue: number | null;
  discountType: string | null;
};

export default function PublicPayLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; offerId?: string; memberId?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [member, setMember] = useState<{ id: string; name: string; email: string } | null>(null);
  const [lookupEmail, setLookupEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test mode modal
  const [testOrderData, setTestOrderData] = useState<{
    orderId: string;
    planName: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/public/plans").then((r) => r.json()),
      params.offerId ? fetch("/api/public/offers").then((r) => r.json()) : Promise.resolve(null),
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([plansData, offersData, meData]) => {
        const loadedPlans = plansData.plans ?? [];
        setPlans(loadedPlans);
        
        // Auto select plan from URL or select first by default
        if (params.planId) {
          setSelectedPlanId(params.planId);
        } else if (loadedPlans.length > 0) {
          setSelectedPlanId(loadedPlans[0].id);
        }

        if (offersData?.offers && params.offerId) {
          const found = offersData.offers.find((o: Offer) => o.id === params.offerId);
          if (found) setOffer(found);
        }
        if (meData?.id) {
          setMember(meData);
        }
      })
      .catch(() => setError("Failed to load payment options."))
      .finally(() => setLoading(false));
  }, [params.offerId, params.planId]);

  async function handlePay(planId: string) {
    let effectiveMemberId = member?.id || params.memberId;

    if (!effectiveMemberId && lookupEmail.trim()) {
      try {
        const lookupRes = await fetch(`/api/public/lookup-member?query=${encodeURIComponent(lookupEmail.trim())}`);
        const lookupData = await lookupRes.json();
        if (lookupRes.ok && lookupData.memberId) {
          effectiveMemberId = lookupData.memberId;
        }
      } catch {}
    }

    if (!effectiveMemberId) {
      router.push(`/login?next=${encodeURIComponent(`/pay?planId=${planId}${params.offerId ? `&offerId=${params.offerId}` : ""}`)}`);
      return;
    }

    setBusy(planId);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          offerId: offer?.id,
          memberId: effectiveMemberId,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Payment initialization failed.");

      if (orderData.isTestMode) {
        setTestOrderData({
          orderId: orderData.orderId,
          planName: orderData.plan.name,
          amount: orderData.plan.finalPrice,
        });
        setBusy(null);
        return;
      }

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Could not load checkout."));
          document.head.appendChild(s);
        });
      }

      const rz = new window.Razorpay!({
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: site.name,
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

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const { finalPrice, discountAmount } = applyOfferDiscount(basePrice, offer);

  return (
    <div className="min-h-screen bg-gym-black text-white px-4 py-8 md:py-16">
      <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="font-anton text-2xl uppercase tracking-wider text-white hover:text-gym-lime transition">
            {brandParts().word1} <span className="text-gym-lime">{brandParts().word2}</span>
          </Link>
          <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold uppercase tracking-wide">
            Checkout Portal
          </h1>
          <p className="mt-1.5 text-xs md:text-sm text-white/50">
            {member ? `Account: ${member.name} (${member.email})` : "Link your phone/email or login below to complete checkout."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Unified Checkout Block */}
        <div className="grid gap-6 md:grid-cols-5 items-start">
          
          {/* Plan Selector & Identity Column */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Identity Lookup Card */}
            {!member && !params.memberId && (
              <Card className="p-4 md:p-6 space-y-4 border-white/5 bg-[#0d0d0d]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">1. Member Verification</h3>
                  <p className="text-xs text-white/40 mt-0.5">Validate your membership account before paying.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Enter registered email or phone"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-[#121212] px-3 py-2.5 text-sm text-white placeholder-white/35 focus:border-gym-lime focus:outline-none"
                    />
                    <Button variant="secondary" onClick={() => router.push("/login?next=/pay")} className="sm:w-auto w-full">
                      Log In instead
                    </Button>
                  </div>
                  <p className="text-[10px] text-white/45 leading-relaxed">
                    Connecting your profile ensures validity days are credited instantly to your specific member code.
                  </p>
                </div>
              </Card>
            )}

            {/* Plan Selector Card */}
            <Card className="p-4 md:p-6 space-y-4 border-white/5 bg-[#0d0d0d]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {member || params.memberId ? "1. Select Membership Plan" : "2. Select Membership Plan"}
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Pick the package you wish to purchase or extend.</p>
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
                          <span className="block text-xs text-white/45 mt-0.5">{plan.durationDays} Days Membership</span>
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

          {/* Invoice Summary Block Column */}
          <div className="md:col-span-2">
            <Card className="p-4 md:p-6 border-white/5 bg-[#0d0d0d] space-y-6 sticky top-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Checkout Summary</h3>
                <p className="text-xs text-white/40 mt-0.5">Please review your billing details.</p>
              </div>

              {/* Offer Badge inside summary */}
              {offer && (
                <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/5 p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">🏷️ Offer Applied</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{offer.title}</h4>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs md:text-sm border-t border-white/5 pt-4">
                <div className="flex justify-between text-white/60">
                  <span>Base Fare</span>
                  <span>₹{basePrice.toLocaleString("en-IN")}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-yellow-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span>Taxes & Platform Fees</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3 text-base font-extrabold text-white">
                  <span>Total Amount</span>
                  <span className="text-gym-lime">₹{finalPrice.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className="w-full py-3 font-semibold text-sm rounded-lg"
                disabled={!!busy || !selectedPlanId}
                onClick={() => handlePay(selectedPlanId)}
              >
                {busy ? "Connecting gateway..." : member || lookupEmail.trim() ? "Confirm & Pay Now" : "Register / Verify to Pay"}
              </Button>

              <div className="text-[10px] text-white/35 text-center leading-relaxed">
                By processing, you agree to our membership terms. Payments are processed securely via encrypted channels.
              </div>
            </Card>
          </div>
        </div>

        {/* Test Mode Modal */}
        {testOrderData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <Card className="w-full max-w-md p-6 space-y-5 border-gym-lime/40 bg-[#0d0d0d] shadow-[0_0_50px_rgba(154,217,1,0.15)]">
              <div className="text-center space-y-1">
                <h2 className="font-display text-xl font-bold uppercase text-white">Demo Payment Simulation</h2>
                <p className="text-xs text-white/50">Simulated check for test keys</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-[#121212] p-4 text-sm flex justify-between font-bold">
                <span>{testOrderData.planName}</span>
                <span className="text-gym-lime">₹{testOrderData.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" disabled={!!busy} onClick={confirmTestPayment}>
                  {busy === "test_confirm" ? "Processing…" : "Simulate Success"}
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
