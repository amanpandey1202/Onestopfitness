"use client";

import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, Spinner } from "@/components/admin/ui";

type AnalyticsData = {
  monthlyRevenue: { label: string; revenue: number }[];
  revenueByPlan: { plan: string; revenue: number }[];
  peakHours: { day: string; hour: string; count: number }[];
  memberGrowth: { label: string; newMembers: number }[];
  totalRevenue: number;
  totalPayments: number;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then(setData)
      .catch(() => setError("Couldn't load analytics data."));
  }, []);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!data) return <div className="flex justify-center py-24"><Spinner /></div>;

  const maxRevenue = Math.max(...data.monthlyRevenue.map((m) => m.revenue), 1);
  const maxGrowth = Math.max(...data.memberGrowth.map((m) => m.newMembers), 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revenue & Growth Analytics"
        subtitle="12-month performance, revenue stream breakdown, and peak attendance patterns."
        action={
          <Badge tone="green">
            Total Revenue: ₹{data.totalRevenue.toLocaleString("en-IN")}
          </Badge>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">12-Month Total Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">
            ₹{data.totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-white/40">{data.totalPayments} transactions verified</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Avg Monthly Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">
            ₹{Math.round(data.totalRevenue / 12).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-white/40">Across active plans</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">New Joins (12 mo)</p>
          <p className="mt-2 font-display text-3xl font-bold text-gym-lime">
            {data.memberGrowth.reduce((acc, curr) => acc + curr.newMembers, 0)}
          </p>
          <p className="mt-1 text-xs text-white/40">Registered members</p>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
          Monthly Revenue Trend (Last 12 Months)
        </h2>
        <div className="mt-6 flex items-end gap-2 sm:gap-4 h-56 pt-6">
          {data.monthlyRevenue.map((item, idx) => {
            const heightPct = Math.round((item.revenue / maxRevenue) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] text-gym-lime opacity-0 group-hover:opacity-100 transition font-mono">
                  ₹{item.revenue >= 1000 ? `${Math.round(item.revenue / 1000)}k` : item.revenue}
                </div>
                <div
                  className="w-full bg-gym-lime/20 border-t-2 border-gym-lime rounded-t transition-all group-hover:bg-gym-lime/40"
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
                <span className="text-[11px] text-white/50">{item.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Plan */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Revenue by Plan
          </h2>
          {data.revenueByPlan.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">No payment data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {data.revenueByPlan.map((item) => {
                const pct = data.totalRevenue > 0 ? Math.round((item.revenue / data.totalRevenue) * 100) : 0;
                return (
                  <div key={item.plan} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-white">{item.plan}</span>
                      <span className="text-gym-lime font-bold">
                        ₹{item.revenue.toLocaleString("en-IN")} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gym-lime" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Member Growth Trend */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            New Member Growth
          </h2>
          <div className="mt-6 flex items-end gap-2 sm:gap-4 h-44 pt-4">
            {data.memberGrowth.map((item, idx) => {
              const heightPct = Math.round((item.newMembers / maxGrowth) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                  <span className="text-[10px] text-white/70">{item.newMembers}</span>
                  <div
                    className="w-full bg-blue-500/30 border-t-2 border-blue-400 rounded-t transition-all group-hover:bg-blue-500/50"
                    style={{ height: `${Math.max(heightPct, 6)}%` }}
                  />
                  <span className="text-[10px] text-white/40">{item.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Peak Attendance Hours */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
          Top Peak Attendance Hours
        </h2>
        <p className="mt-1 text-xs text-white/45">Based on scan &amp; check-in timestamps over time</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {data.peakHours.map((peak, idx) => (
            <div key={idx} className="rounded-lg border border-white/10 bg-gym-black p-4 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gym-lime">Rank #{idx + 1}</span>
              <p className="mt-1 font-display text-lg font-bold text-white">{peak.day} @ {peak.hour}</p>
              <p className="mt-1 text-xs text-white/50">{peak.count} check-ins</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
