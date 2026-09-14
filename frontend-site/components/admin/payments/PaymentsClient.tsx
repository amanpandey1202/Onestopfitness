"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, PageHeader, Spinner } from "@/components/admin/ui";
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
  offer?: {
    id: string;
    title: string;
  } | null;
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

function computeSummary(payments: Payment[]): Summary {
  const paid = payments.filter((p) => p.status === "PAID");
  const sum = (list: Payment[]) => list.reduce((acc, p) => acc + p.amount, 0);
  return {
    totalRevenue: sum(paid),
    onlineRevenue: sum(paid.filter((p) => ["RAZORPAY", "ONLINE"].includes(p.method || ""))),
    cashRevenue: sum(paid.filter((p) => ["CASH", "UPI", "CHEQUE", "BANK_TRANSFER", "MANUAL"].includes(p.method || ""))),
    excelRevenue: sum(paid.filter((p) => p.method === "EXCEL_IMPORT")),
    totalPaymentsCount: payments.length,
  };
}

export function PaymentsClient({
  initialPayments,
}: {
  initialPayments: Payment[];
}) {
  const [allPayments, setAllPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(initialPayments.length === 0);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshError, setRefreshError] = useState(false);

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

  const refresh = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) throw new Error("load failed");
      const d = await res.json();
      setAllPayments(d.payments ?? []);
      setRefreshError(false);
    } catch {
      setRefreshError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPayments.length === 0) refresh();
  }, [initialPayments.length]);

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
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error saving payment");
    } finally {
      setSaving(false);
    }
  }

  // All filtering happens instantly in-memory — no server round-trips per
  // keystroke, which is what made search feel slow.
  const filtered = allPayments.filter((p) => {
    if (methodFilter && (p.method || "") !== methodFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [
        p.member.name,
        p.member.email,
        p.member.memberCode ?? "",
        p.orderId,
        p.paymentId ?? "",
        p.plan.name,
        p.offer?.title ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const summary = computeSummary(filtered);

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

      {refreshError && (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2 text-xs text-red-300">
          Couldn&apos;t refresh payments — showing last loaded data.
        </p>
      )}

      {/* Revenue Summary Cards */}
      <div className="g4 mb6">
        <div className="kpi">
          <div className="kl">Total Recorded Revenue</div>
          <div className="kpi-i">
            <div>
              <div className="kv" style={{ fontSize: 24 }}>₹{summary.totalRevenue.toLocaleString("en-IN")}</div>
              <div className="ks">{summary.totalPaymentsCount} payments recorded</div>
            </div>
            <div className="ki l">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
          </div>
        </div>
        <div className="kpi">
          <div className="kl">Razorpay Online</div>
          <div className="kpi-i">
            <div>
              <div className="kv" style={{ fontSize: 24 }}>₹{summary.onlineRevenue.toLocaleString("en-IN")}</div>
              <div className="ks">Gateway verified</div>
            </div>
            <div className="ki w">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
            </div>
          </div>
        </div>
        <div className="kpi">
          <div className="kl">Cash / Manual Collections</div>
          <div className="kpi-i">
            <div>
              <div className="kv a" style={{ fontSize: 24 }}>₹{summary.cashRevenue.toLocaleString("en-IN")}</div>
              <div className="ks">Counter + manual entries</div>
            </div>
            <div className="ki a">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M2 7h20v10H2z" /><path d="M6 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="kpi">
          <div className="kl">Excel Import Revenue</div>
          <div className="kpi-i">
            <div>
              <div className="kv" style={{ fontSize: 24, color: "#c084fc" }}>₹{summary.excelRevenue.toLocaleString("en-IN")}</div>
              <div className="ks">Bulk legacy data</div>
            </div>
            <div className="ki w">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="row wrap mb4" style={{ gap: 12 }}>
        <div className="iw" style={{ flex: 1, maxWidth: 340 }}>
          <svg className="ic" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by member, email, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inp"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="inp"
          style={{ width: 190 }}
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
          className="inp"
          style={{ width: 150 }}
        >
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="CREATED">CREATED</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="tw">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No payments found matching your filters." />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="fw5">
                    {p.member.name}
                    <span className="txs tft tmo" style={{ display: "block", fontSize: 10.5 }}>
                      {p.member.memberCode ? `#${p.member.memberCode}` : p.member.email}
                    </span>
                  </td>
                  <td className="mu">{p.plan.name}</td>
                  <td className="tlm tmo fw6">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td>
                    <span className="badge n">{p.method || "ONLINE"}</span>
                  </td>
                  <td>
                    {p.status === "PAID" ? (
                      <span className="badge g">Paid</span>
                    ) : p.status === "FAILED" ? (
                      <span className="badge r">Failed</span>
                    ) : (
                      <span className="badge a">Created</span>
                    )}
                  </td>
                  <td className="mo">{formatDate(p.paidAt || p.createdAt)}</td>
                  <td>
                    <Link
                      href={`/member/pay/success?paymentId=${p.id}`}
                      target="_blank"
                      className="ab"
                    >
                      Receipt ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

export default PaymentsClient;