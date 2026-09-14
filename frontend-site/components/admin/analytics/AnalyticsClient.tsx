"use client";

import { Badge, PageHeader } from "@/components/admin/ui";
import { LineChart, type TrendPoint } from "@/components/admin/dashboard/LineChart";

type AnalyticsData = {
  monthlyRevenue: { label: string; revenue: number }[];
  revenueByPlan: { plan: string; revenue: number }[];
  peakHours: { day: string; hour: string; count: number }[];
  memberGrowth: { label: string; newMembers: number }[];
  totalRevenue: number;
  totalPayments: number;
};

/** Lime accent bar + condensed heading */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-6 w-[3px] rounded-full bg-gym-lime" style={{ boxShadow: "0 0 10px #9ad90188" }} />
      <h2 style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "1.15rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

/** KPI stat card with lime value */
function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #141a1c, #0f1416)",
        border: "1px solid rgba(154,217,1,0.2)",
        borderRadius: "0.75rem",
        padding: "24px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* lime glow blob */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(154,217,1,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", margin: "0 0 10px" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "2.4rem", fontWeight: 800, color: "#9ad901", margin: "0 0 4px", lineHeight: 1, textShadow: "0 0 18px rgba(154,217,1,0.4)" }}>
        {value}
      </p>
      <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{sub}</p>
    </div>
  );
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const totalJoins = data.memberGrowth.reduce((acc, curr) => acc + curr.newMembers, 0);
  const avgMonthly = Math.round(data.totalRevenue / 12);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <PageHeader
        title="Revenue & Growth Analytics"
        subtitle="12-month performance, revenue stream breakdown, and peak attendance patterns."
        action={
          <Badge tone="green">
            Total Revenue: ₹{data.totalRevenue.toLocaleString("en-IN")}
          </Badge>
        }
      />

      {/* ── KPI STRIP ── */}
      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <KpiCard
          label="12-Month Total Revenue"
          value={`₹${data.totalRevenue.toLocaleString("en-IN")}`}
          sub={`${data.totalPayments} transactions verified`}
        />
        <KpiCard
          label="Avg Monthly Revenue"
          value={`₹${avgMonthly.toLocaleString("en-IN")}`}
          sub="Across active plans"
        />
        <KpiCard
          label="New Joins (12 mo)"
          value={String(totalJoins)}
          sub="Registered members"
        />
      </div>

      {/* ── REVENUE TREND ── */}
      <div
        style={{
          background: "linear-gradient(145deg, #141a1c, #0e1416)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.75rem",
          padding: "28px 28px 20px",
        }}
      >
        <SectionTitle>Monthly Revenue Trend (Last 12 Months)</SectionTitle>
        {data.monthlyRevenue.length > 0 ? (
          <LineChart
            data={data.monthlyRevenue.map((m) => ({ label: m.label, value: m.revenue })) as TrendPoint[]}
            color="#9ad901"
            height={240}
            unit="revenue"
          />
        ) : (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No payment data yet.</p>
        )}
      </div>

      {/* ── REVENUE BY PLAN + MEMBER GROWTH ── */}
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        {/* Revenue by Plan */}
        <div
          style={{
            background: "linear-gradient(145deg, #141a1c, #0e1416)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.75rem",
            padding: "28px",
          }}
        >
          <SectionTitle>Revenue by Plan</SectionTitle>
          {data.revenueByPlan.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No payment data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {data.revenueByPlan.map((item) => {
                const pct =
                  data.totalRevenue > 0
                    ? Math.round((item.revenue / data.totalRevenue) * 100)
                    : 0;
                return (
                  <div key={item.plan}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>{item.plan}</span>
                      <span style={{ color: "#9ad901", fontWeight: 700, fontSize: "0.85rem", fontFamily: "var(--font-space-mono, monospace)" }}>
                        ₹{item.revenue.toLocaleString("en-IN")}&nbsp;
                        <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    {/* Track */}
                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, #9ad901, #c8ff28)",
                          borderRadius: 99,
                          boxShadow: "0 0 10px rgba(154,217,1,0.4)",
                          transition: "width 0.8s cubic-bezier(.22,.7,.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Member Growth Chart */}
        <div
          style={{
            background: "linear-gradient(145deg, #141a1c, #0e1416)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.75rem",
            padding: "28px 28px 20px",
          }}
        >
          <SectionTitle>New Member Growth</SectionTitle>
          {data.memberGrowth.length > 0 ? (
            <LineChart
              data={data.memberGrowth.map((m) => ({ label: m.label, value: m.newMembers })) as TrendPoint[]}
              color="#60a5fa"
              height={200}
              unit="count"
            />
          ) : (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No member data yet.</p>
          )}
        </div>
      </div>

      {/* ── PEAK HOURS ── */}
      <div
        style={{
          background: "linear-gradient(145deg, #141a1c, #0e1416)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.75rem",
          padding: "28px",
        }}
      >
        <SectionTitle>Top Peak Attendance Hours</SectionTitle>
        <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "-14px", marginBottom: "20px", fontFamily: "var(--font-space-mono, monospace)", letterSpacing: "0.05em" }}>
          Based on scan &amp; check-in timestamps over time
        </p>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {data.peakHours.map((peak, idx) => (
            <div
              key={idx}
              style={{
                background: idx === 0 ? "rgba(154,217,1,0.07)" : "rgba(255,255,255,0.03)",
                border: idx === 0 ? "1px solid rgba(154,217,1,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.6rem",
                padding: "18px 16px",
                textAlign: "center",
              }}
            >
              <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: idx === 0 ? "#9ad901" : "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>
                Rank #{idx + 1}
              </p>
              <p style={{ fontFamily: "var(--font-barlow, sans-serif)", fontSize: "1.35rem", fontWeight: 800, color: idx === 0 ? "#9ad901" : "#fff", lineHeight: 1, margin: "0 0 6px" }}>
                {peak.day}
              </p>
              <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", margin: "0 0 8px" }}>
                @ {peak.hour}
              </p>
              <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {peak.count} check-ins
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsClient;