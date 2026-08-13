"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Spinner } from "@/components/admin/ui";

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
        setPlans(plansData.plans ?? []);
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
  }, [params.offerId]);

  async function handlePay(planId: string) {
    let effectiveMemberId = member?.id || params.memberId;

    if (!effectiveMemberId && lookupEmail.trim()) {
      // Look up member by email or phone
      try {
        const lookupRes = await fetch(`/api/public/lookup-member?query=${encodeURIComponent(lookupEmail.trim())}`);
        const lookupData = await lookupRes.json();
        if (lookupRes.ok && lookupData.memberId) {
          effectiveMemberId = lookupData.memberId;
        }
      } catch {}
    }

    if (!effectiveMemberId) {
      // Redirect to login with return URL
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

      // Launch Razorpay
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
          isTestMode: true,
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

  return (
    <div className="min-h-screen bg-gym-black text-white px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <Link href="/" className="font-anton text-2xl uppercase tracking-wider text-white">
            ONE STOP <span className="text-gym-lime">FITNESS</span>
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wide">
            Membership Checkout
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {member ? `Logged in as ${member.name} (${member.email})` : "Enter your email/phone or log in to complete your checkout."}
          </p>
        </div>

        {!member && !params.memberId && (
          <Card className="p-5 max-w-md mx-auto space-y-3">
            <label className="block text-xs font-semibold uppercase text-white/70">
              Member Email or Phone
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. member@onestopfit.in or 9876543210"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                className="flex-1 rounded-lg border border-white/15 bg-gym-ink px-3 py-2 text-sm text-white placeholder-white/40 focus:border-gym-lime focus:outline-none"
              />
              <Button onClick={() => router.push("/login?next=/pay")}>
                Log In
              </Button>
            </div>
            <p className="text-[11px] text-white/40">
              Entering your registered email/phone links your payment to your profile instantly.
            </p>
          </Card>
        )}

        {offer && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-center space-y-1">
            <Badge tone="yellow">Special Discount Offer</Badge>
            <h2 className="font-display text-xl font-bold text-white">{offer.title}</h2>
            {offer.description && <p className="text-xs text-white/70">{offer.description}</p>}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {testOrderData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 space-y-5 border-gym-lime/40">
              <div className="text-center">
                <h2 className="font-display text-xl font-bold uppercase text-white">Demo Gateway</h2>
                <p className="mt-1 text-xs text-white/50">Test mode simulation</p>
              </div>
              <div className="rounded-lg border border-white/10 p-4 text-sm flex justify-between font-bold">
                <span>{testOrderData.planName}</span>
                <span className="text-gym-lime">₹{testOrderData.amount.toLocaleString("en-IN")}</span>
              </div>
              <Button className="w-full" disabled={!!busy} onClick={confirmTestPayment}>
                {busy === "test_confirm" ? "Processing…" : "Complete Payment Now"}
              </Button>
            </Card>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            let finalPrice = plan.price;
            if (offer) {
              if (offer.discountType === "PERCENT" && offer.discountValue) {
                finalPrice = Math.max(1, plan.price - Math.round((plan.price * offer.discountValue) / 100));
              } else if (offer.discountType === "AMOUNT" && offer.discountValue) {
                finalPrice = Math.max(1, plan.price - offer.discountValue);
              }
            }

            return (
              <Card key={plan.id} className="p-6 flex flex-col">
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold uppercase text-white">{plan.name}</h2>
                  <p className="mt-3 font-display text-3xl font-bold text-gym-lime">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <Button className="mt-6 w-full" disabled={!!busy} onClick={() => handlePay(plan.id)}>
                  {busy === plan.id ? "Processing…" : member || lookupEmail.trim() ? "Pay Now" : "Pay / Log In"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
