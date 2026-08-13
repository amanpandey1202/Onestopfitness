"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type Payment = {
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
    id: string;
    name: string;
    email: string;
    phone: string | null;
    memberCode: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
  };
};

type Summary = {
  totalRevenue: number;
  onlineRevenue: number;
  cashRevenue: number;
  excelRevenue: number;
  totalPaymentsCount: number;
};

type MemberOption = { id: string; name: string; email: string };
type PlanOption = { id: string; name: string; price: number };

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Manual payment modal state
  const [showModal, setShowModal] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPayments = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (methodFilter) params.set("method", methodFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/payments?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setPayments(d.payments ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, methodFilter, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  function openManualModal() {
    setShowModal(true);
    setFormError(null);
    Promise.all([
      fetch("/api/admin/members?status=all").then((r) => r.json()),
      fetch("/api/admin/plans").then((r) => r.json()),
    ]).then(([mRes, pRes]) => {
      setMembers(mRes.members ?? []);
      setPlans(pRes.plans ?? []);
      if (pRes.plans?.length > 0) {
        setSelectedPlanId(pRes.plans[0].id);
        setCustomAmount(pRes.plans[0].price);
      }
    });
  }

  function handlePlanSelect(pId: string) {
    setSelectedPlanId(pId);
    const p = plans.find((x) => x.id === pId);
    if (p) setCustomAmount(p.price);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId || !selectedPlanId || !customAmount) {
      setFormError("Please select a member, plan, and amount.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          planId: selectedPlanId,
          amount: Number(customAmount),
          method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment.");

      setShowModal(false);
      fetchPayments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments & Revenue"
        subtitle="Complete revenue audit across Razorpay, Cash/Manual collections & Excel imports."
        action={
          <Button onClick={openManualModal}>
            💵 Record Cash / Manual Payment
          </Button>
        }
      />

      {/* Revenue Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border-gym-lime/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Total Recorded Revenue</p>
            <p className="mt-2 font-display text-3xl font-bold text-gym-lime">
              ₹{summary.totalRevenue.toLocaleString("en-IN")}
            </p>

          </Card>

          <Card className="p-5 border-blue-500/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Razorpay Online</p>
            <p className="mt-2 font-display text-3xl font-bold text-blue-400">
              ₹{summary.onlineRevenue.toLocaleString("en-IN")}
            </p>

          </Card>

          <Card className="p-5 border-yellow-500/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Cash / Manual Collections</p>
            <p className="mt-2 font-display text-3xl font-bold text-yellow-400">
              ₹{summary.cashRevenue.toLocaleString("en-IN")}
            </p>

          </Card>

          <Card className="p-5 border-purple-500/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Excel Import Revenue</p>
            <p className="mt-2 font-display text-3xl font-bold text-purple-400">
              ₹{summary.excelRevenue.toLocaleString("en-IN")}
            </p>

          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by member, email, order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-white/10 bg-gym-ink px-4 py-2 text-sm text-white placeholder-white/40 focus:border-gym-lime focus:outline-none sm:w-80"
        />

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gym-ink px-3 py-2 text-sm text-white focus:border-gym-lime focus:outline-none"
        >
          <option value="">All Payment Methods</option>
          <option value="RAZORPAY">Razorpay Online</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="EXCEL_IMPORT">Excel Import</option>
          <option value="TEST_MODE">Demo / Test Mode</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gym-ink px-3 py-2 text-sm text-white focus:border-gym-lime focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="CREATED">CREATED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Payments Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : payments.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No payments found matching your filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-white/40">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.025] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white">{p.member.name}</p>
                      <p className="text-xs text-white/40">{p.member.email}</p>
                    </td>
                    <td className="px-5 py-3 text-white/80">
                      {p.plan.name}
                    </td>
                    <td className="px-5 py-3 font-display font-bold text-gym-lime">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">
                        {p.method || "ONLINE"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "PAID" ? (
                        <Badge tone="green">PAID</Badge>
                      ) : p.status === "FAILED" ? (
                        <Badge tone="red">FAILED</Badge>
                      ) : (
                        <Badge tone="yellow">CREATED</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">
                      {formatDate(p.paidAt || p.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/member/pay/success?paymentId=${p.id}`}
                        target="_blank"
                        className="text-xs font-semibold text-gym-lime hover:underline"
                      >
                        Receipt ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Manual Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 space-y-5 border-gym-lime/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-display text-xl font-bold uppercase text-white">Record Cash / Manual Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            {formError && (
              <p className="text-xs text-red-300 bg-red-500/10 p-2.5 rounded border border-red-500/20">{formError}</p>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Select Member *</label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-gym-ink px-3 py-2 text-white focus:border-gym-lime focus:outline-none"
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Select Plan *</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => handlePlanSelect(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-gym-ink px-3 py-2 text-white focus:border-gym-lime focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Amount Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/15 bg-gym-ink px-3 py-2 text-white focus:border-gym-lime focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-gym-ink px-3 py-2 text-white focus:border-gym-lime focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Payment & Activate Membership"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
