"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button, Card, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type PaymentDetail = {
  id: string;
  orderId: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
  member: {
    name: string;
    email: string;
    phone: string | null;
    memberCode: string | null;
  };
  plan: {
    name: string;
    description: string | null;
    price: number;
    durationDays: number;
  };
};

type MembershipDetail = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const params = use(searchParams);
  const paymentId = params.paymentId;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [membership, setMembership] = useState<MembershipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError("No payment reference provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/payments/${paymentId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load payment details."))))
      .then((d) => {
        setPayment(d.payment);
        setMembership(d.membership);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  if (error || !payment) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <Card className="p-8">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-white">Payment Receipt Notice</h1>
          <p className="mt-2 text-sm text-white/60">{error || "Could not locate receipt."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/member/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
            <Link href="/member/pay">
              <Button variant="secondary">Back to Pay</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Hero Badge */}
      <div className="rounded-2xl border border-gym-lime/40 bg-gym-lime/10 p-6 text-center shadow-[0_0_30px_rgba(154,217,1,0.15)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gym-lime/20 text-3xl text-gym-lime">
          ✓
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wide text-white">
          Payment Successful!
        </h1>
        <p className="mt-1 text-sm text-gym-lime">
          Your membership has been activated / extended!
        </p>
      </div>

      {/* Invoice Card */}
      <Card className="p-8 space-y-6 print:bg-white print:text-black">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <span className="font-anton text-xl uppercase tracking-wider text-white">
              ONE STOP <span className="text-gym-lime">FITNESS</span>
            </span>
            <p className="text-xs text-white/40">Official Payment Receipt &amp; Invoice</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded border border-gym-lime/40 bg-gym-lime/10 px-2.5 py-1 text-xs font-bold text-gym-lime">
              PAID
            </span>
            <p className="mt-1 text-[11px] font-mono text-white/40">
              {formatDate(payment.paidAt || payment.createdAt)}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Billed To</p>
            <p className="mt-1 font-semibold text-white">{payment.member.name}</p>
            <p className="text-xs text-white/60">{payment.member.email}</p>
            {payment.member.phone && <p className="text-xs text-white/60">{payment.member.phone}</p>}
            {payment.member.memberCode && (
              <p className="mt-1 text-xs font-mono text-gym-lime">Code: {payment.member.memberCode}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Transaction Ref</p>
            <p className="mt-1 font-mono text-xs text-white/80">Order: {payment.orderId}</p>
            {payment.paymentId && <p className="font-mono text-xs text-white/60">ID: {payment.paymentId}</p>}
            <p className="mt-1 text-xs text-white/60">Method: {payment.method || "ONLINE"}</p>
          </div>
        </div>

        {/* Plan & Dates */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold uppercase text-white">{payment.plan.name}</p>
              <p className="text-xs text-white/50">{payment.plan.durationDays} Days Membership Access</p>
            </div>
            <p className="font-display text-2xl font-bold text-gym-lime">
              ₹{payment.amount.toLocaleString("en-IN")}
            </p>
          </div>

          {membership && (
            <div className="mt-3 flex flex-wrap gap-4 border-t border-white/10 pt-3 text-xs text-white/75">
              <div>
                <span className="text-white/40">Valid From: </span>
                <span className="font-semibold">{formatDate(membership.startDate)}</span>
              </div>
              <div>
                <span className="text-white/40">Valid Until: </span>
                <span className="font-semibold text-gym-lime">{formatDate(membership.endDate)}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-white/35">
          Thank you for training with ONE STOP FITNESS! Keep pushing your limits.
        </p>
      </Card>

      {/* Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => window.print()} variant="secondary">
          🖨️ Print / Download Receipt
        </Button>
        <Link href="/member/dashboard">
          <Button>Go to Member Dashboard →</Button>
        </Link>
      </div>
    </div>
  );
}
