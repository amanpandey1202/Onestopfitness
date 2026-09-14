"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  PasswordInput,
  Select,
  Spinner,
  TextArea,
  Toggle,
} from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { formatDate, planPeriodLabel } from "@/lib/format";
import { fitnessGoalOptions } from "@/lib/goals";
import { verificationMissing } from "@/lib/memberVerification";

type Plan = { id: string; name: string; price: number; durationDays: number };

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  memberCode: string | null;
  isActive: boolean;
  emailVerified: string | null;
  createdAt: string;
  category: "member" | "new";
  isVerified: boolean;
  memberProfile: {
    fitnessGoal: string | null;
    joiningDate: string | null;
    notes: string | null;
    alternatePhone: string | null;
    aadhaarNumber: string | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
    emergencyContact: string | null;
  } | null;
  memberships: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    plan: Plan;
  }[];
  attendance: { checkIn: string }[];
};

function isMembershipActive(m: Member["memberships"][0]) {
  return m.status === "ACTIVE" && new Date(m.endDate).getTime() >= Date.now();
}

export function MembersClient({
  initialMembers,
  initialPlans,
  initialStatus,
  initialShowForm,
}: {
  initialMembers: Member[] | null;
  initialPlans: Plan[];
  initialStatus?: string;
  initialShowForm?: boolean;
}) {
  const [members, setMembers] = useState<Member[] | null>(initialMembers ?? null);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "member" | "new">("all");
  const [verifyFilter, setVerifyFilter] = useState<"all" | "needed" | "verified">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "expired" | "absentee">(
    (initialStatus as "active" | "suspended" | "expired" | "absentee") || "all"
  );
  const [showForm, setShowForm] = useState(initialShowForm ?? false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [assignTo, setAssignTo] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/members?category=all&status=all");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Couldn't load members.");
    }
  }, []);

  useEffect(() => {
    if (members === null) reload();
    if (plans.length === 0) {
      fetch("/api/admin/plans")
        .then((r) => r.json())
        .then((d) => setPlans(d.plans ?? []))
        .catch(() => {});
    }
  }, [members, plans.length, reload]);

  async function action(fn: () => Promise<Response>, onSuccess?: () => void) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      onSuccess?.();
      await reload();
      setShowForm(false);
      setEditing(null);
      setAssignTo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleExport() {
    if (!window.confirm("This file contains full Aadhaar numbers, addresses and contacts. Download anyway?")) return;
    const a = document.createElement("a");
    a.href = "/api/admin/members/export?confirm=1";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportMsg(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/members/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      const s = data.summary ?? {};
      setImportMsg({
        ok: true,
        text: `Import done — ${s.created ?? 0} created, ${s.updated ?? 0} updated, ${s.failed ?? 0} failed.${data.note ? " " + data.note : ""}`,
      });
      await reload();
    } catch (err) {
      setImportMsg({ ok: false, text: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setBusy(false);
    }
  }

  const fourteenDaysAgo = Date.now() - 14 * 24 * 3600 * 1000;

  const filtered = (members ?? []).filter((m) => {
    const q = search.trim().toLowerCase();
    if (q && ![m.name, m.email, m.phone ?? "", m.memberCode ?? ""].some((v) => v.toLowerCase().includes(q))) {
      return false;
    }
    if (verifyFilter === "needed" && m.isVerified) return false;
    if (verifyFilter === "verified" && !m.isVerified) return false;
    if (categoryFilter === "member" && m.category !== "member") return false;
    if (categoryFilter === "new" && m.category !== "new") return false;

    const latest = m.memberships[0];
    const active = latest ? isMembershipActive(latest) : false;
    const lastCheckIn = m.attendance[0]?.checkIn ? new Date(m.attendance[0].checkIn).getTime() : 0;
    const absentee = new Date(m.createdAt).getTime() <= fourteenDaysAgo && lastCheckIn < fourteenDaysAgo;

    if (statusFilter === "active" && !(m.isActive && active)) return false;
    if (statusFilter === "suspended" && m.isActive) return false;
    if (statusFilter === "expired" && !(latest && !active)) return false;
    if (statusFilter === "absentee" && !absentee) return false;
    return true;
  });

  if (members === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Members"
        subtitle="All gym members — add, edit, suspend or assign a membership."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={handleExport} disabled={busy}>
              Export Excel
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById("member-import")?.click()} disabled={busy}>
              Import Excel
            </Button>
            <input
              id="member-import"
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button onClick={() => { setEditing(null); setShowForm((v) => !v); }}>
              {showForm ? "Cancel" : "+ Add Member"}
            </Button>
          </div>
        }
      />

      {importMsg && (
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${importMsg.ok ? "border-gym-lime/40 bg-gym-lime/10 text-gym-lime" : "border-red-400/40 bg-red-500/10 text-red-300"}`}>
          {importMsg.text}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <MemberForm
          plans={plans}
          editing={editing}
          busy={busy}
          onSubmit={(body, method) =>
            action(async () => {
              const url = editing ? `/api/admin/members/${editing.id}` : "/api/admin/members";
              return fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
            })
          }
        />
      )}

      {assignTo && (
        <AssignMembership
          member={assignTo}
          plans={plans}
          busy={busy}
          onClose={() => setAssignTo(null)}
          onSubmit={(body) =>
            action(() =>
              fetch(`/api/admin/members/${assignTo.id}/memberships`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
            )
          }
        />
      )}

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "member", label: "Members" },
            { key: "new", label: "New Registrations" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              categoryFilter === tab.key
                ? "bg-gym-lime text-gym-ink"
                : "border border-white/10 text-white/60 hover:border-gym-lime/40 hover:text-gym-lime"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "suspended", label: "Suspended" },
            { key: "expired", label: "Expired" },
            { key: "absentee", label: "Absent 14+ days" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              statusFilter === tab.key
                ? "bg-gym-lime text-gym-ink"
                : "border border-white/10 text-white/60 hover:border-gym-lime/40 hover:text-gym-lime"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Verification filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "needed", label: "Verification Needed" },
            { key: "verified", label: "Verified" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setVerifyFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              verifyFilter === tab.key
                ? "bg-gym-lime text-gym-ink"
                : "border border-white/10 text-white/60 hover:border-gym-lime/40 hover:text-gym-lime"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No members found">
          Add your first member to get started.
        </EmptyState>
      ) : (
        <div className="tw">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Expires</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const latest = m.memberships[0];
                const active = latest ? isMembershipActive(latest) : false;
                const expiring = latest && new Date(latest.endDate).getTime() < Date.now() + 7 * 24 * 3600 * 1000;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="row g3">
                        <div className={m.category === "new" ? "av am" : "av"}>
                          {m.name.trim()[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="fw5">{m.name}</div>
                          <div className="txs tft tmo">{m.phone ?? m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mu">
                      {latest ? (
                        <>
                          <div>{latest.plan.name}</div>
                          <div className="tmo tft" style={{ fontSize: 10.5 }}>
                            {m.memberCode ?? "—"}
                          </div>
                        </>
                      ) : (
                        <span className="tft">—</span>
                      )}
                    </td>
                    <td>
                      <div className="stack g2" style={{ gap: 4 }}>
                        <span className={m.isActive ? "badge g" : "badge r"}>
                          {m.isActive ? "Active" : "Suspended"}
                        </span>
                        {m.category === "new" ? (
                          <span className="badge a">New Registration</span>
                        ) : latest ? (
                          <span className={active ? "badge g" : "badge r"}>{active ? "Paid" : "Expired"}</span>
                        ) : null}
                        <span className={m.isVerified ? "badge g" : "badge r"}>
                          {m.isVerified ? "Verified" : "Verification Needed"}
                        </span>
                      </div>
                    </td>
                    <td className="mo">{formatDate(m.memberProfile?.joiningDate ?? m.createdAt)}</td>
                    <td className={`mo ${expiring ? "tab" : ""}`}>
                      {latest ? formatDate(latest.endDate) : "—"}
                    </td>
                    <td>
                      <div className="row g3" style={{ justifyContent: "flex-end" }}>
                        <button className="ab" onClick={() => { setEditing(m); setShowForm(true); }}>
                          Edit
                        </button>
                        <button className="ab" onClick={() => setAssignTo(m)}>
                          Assign Plan
                        </button>
                        <button
                          className="ab"
                          onClick={() =>
                            action(() =>
                              fetch(`/api/admin/members/${m.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ isActive: !m.isActive }),
                              })
                            )
                          }
                        >
                          {m.isActive ? "Suspend" : "Activate"}
                        </button>
                        <button
                          className="ab d"
                          onClick={() => {
                            if (confirm(`Delete ${m.name} permanently?`)) {
                              action(() => fetch(`/api/admin/members/${m.id}`, { method: "DELETE" }));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MemberForm({
  plans,
  editing,
  busy,
  onSubmit,
}: {
  plans: Plan[];
  editing: Member | null;
  busy: boolean;
  onSubmit: (body: Record<string, unknown>, method: string) => void;
}) {
  // Aadhaar comes back from the list API masked ("XXXX-XXXX-<last4>") for
  // display; never prefill or round-trip the masked placeholder into the DB.
  const aadhaarFromList = editing?.memberProfile?.aadhaarNumber ?? "";
  const aadhaarIsMasked = aadhaarFromList.startsWith("XXXX-");

  const [f, setF] = useState(() => ({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    phone: editing?.phone ?? "",
    password: "",
    fitnessGoal: editing?.memberProfile?.fitnessGoal ?? "",
    notes: editing?.memberProfile?.notes ?? "",
    planId: editing?.memberships[0]?.plan.id ?? "",
    joiningDate: editing?.memberProfile?.joiningDate ? editing.memberProfile.joiningDate.slice(0, 10) : "",
    alternatePhone: editing?.memberProfile?.alternatePhone ?? "",
    aadhaarNumber: aadhaarIsMasked ? "" : aadhaarFromList,
    address: editing?.memberProfile?.address ?? "",
    parentName: editing?.memberProfile?.parentName ?? "",
    parentPhone: editing?.memberProfile?.parentPhone ?? "",
    emergencyContact: editing?.memberProfile?.emergencyContact ?? "",
    markEmailVerified: editing ? !editing.emailVerified : false,
  }));

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  const missingFields = verificationMissing({
    aadhaarNumber: aadhaarIsMasked ? "masked" : (f.aadhaarNumber || undefined),
    address: f.address || undefined,
    parentPhone: f.parentPhone || undefined,
    emergencyContact: f.emergencyContact || undefined,
  });

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-white">
        {editing ? `Edit — ${editing.name}` : "Add a new member"}
      </h2>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body: Record<string, unknown> = {
            name: f.name,
            phone: f.phone || null,
            fitnessGoal: f.fitnessGoal || null,
            notes: f.notes || null,
            alternatePhone: f.alternatePhone || null,
            aadhaarNumber:
              editing && f.aadhaarNumber === "" && aadhaarIsMasked
                ? undefined // masked placeholder — keep existing ciphertext
                : (f.aadhaarNumber || null),
            address: f.address || null,
            parentName: f.parentName || null,
            parentPhone: f.parentPhone || null,
            emergencyContact: f.emergencyContact || null,
          };
          if (editing) {
            body.joiningDate = f.joiningDate || null;
            body.markEmailVerified = f.markEmailVerified;
            onSubmit(body, "PATCH");
          } else {
            body.email = f.email;
            body.password = f.password;
            body.planId = f.planId || null;
            body.joiningDate = f.joiningDate || null;
            onSubmit(body, "POST");
          }
        }}
      >
        {/* ── Basic info ───────────────────────────────────────── */}
        <Field label="Name">
          <Input required autoComplete="name" autoCapitalize="words" value={f.name} onChange={set("name")} />
        </Field>
        {!editing && (
          <Field label="Email">
            <Input type="email" required value={f.email} onChange={set("email")} />
          </Field>
        )}
        {!editing && (
          <Field label="Temporary password" hint="Min 8 characters. Changeable by the member later.">
            <PasswordInput required minLength={8} value={f.password} onChange={set("password")} />
          </Field>
        )}
        <Field label="Phone">
          <Input type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Date joined">
          <Input type="date" value={f.joiningDate} onChange={set("joiningDate")} />
        </Field>
        <Field label="Fitness goal">
          <Select value={f.fitnessGoal} onChange={set("fitnessGoal")}>
            {fitnessGoalOptions(f.fitnessGoal).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </Select>
        </Field>

        {/* ── Required for verification ─────────────────────── */}
        <div className="sm:col-span-2 rounded-md border border-gym-lime/30 bg-gym-lime/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gym-lime">
            ⚠️ Required for verification
          </p>
          <p className="mt-1 text-xs text-white/40">
            If the member signed up online, fill these after viewing their Aadhaar card at the front desk.
            {missingFields.length > 0 && (
              <span className="ml-1 text-white/60">
                Missing: {missingFields.join(", ")}.
              </span>
            )}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Aadhaar number">
              <Input
                type="tel"
                autoComplete="off"
                inputMode="numeric"
                maxLength={14}
                value={f.aadhaarNumber}
                onChange={set("aadhaarNumber")}
                placeholder="0000 0000 0000"
              />
            </Field>
            <Field label="Emergency / parent phone">
              <Input type="tel" autoComplete="tel-national" value={f.parentPhone} onChange={set("parentPhone")} placeholder="+91 …" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Full address">
                <TextArea
                  rows={2}
                  autoCapitalize="words"
                  autoComplete="street-address"
                  value={f.address}
                  onChange={set("address")}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Optional details ──────────────────────────────── */}
        <div className="sm:col-span-2 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-white/55">Optional details</p>
          <p className="mt-1 text-xs text-white/40">Stored securely, visible only to admins — never included in Excel exports.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Alternate phone">
              <Input type="tel" autoComplete="tel" value={f.alternatePhone} onChange={set("alternatePhone")} />
            </Field>
            <Field label="Parent / guardian name">
              <Input autoCapitalize="words" value={f.parentName} onChange={set("parentName")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Emergency contact" hint="Used for profile verification — same as parent phone if that's the emergency number.">
                <Input type="tel" autoComplete="tel-national" value={f.emergencyContact} onChange={set("emergencyContact")} placeholder="+91 …" />
              </Field>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <TextArea rows={2} value={f.notes} onChange={set("notes")} />
          </Field>
        </div>
        {editing && (
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {editing.emailVerified ? "Email verified" : "Email not verified"}
              </p>
              <p className="text-xs text-white/40">
                Check this box to approve the email when the member is present in person (e.g. self-registered members whose
                verification email wasn&apos;t received or expired).
              </p>
            </div>
            <Toggle
              checked={f.markEmailVerified}
              onChange={(v) => setF((prev) => ({ ...prev, markEmailVerified: v }))}
              label="Mark email as verified"
            />
          </div>
        )}
        {!editing && (
          <div className="sm:col-span-2">
            <Field label="Starting plan">
              <Select value={f.planId} onChange={set("planId")}>
                <option value="">No plan yet</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save Changes" : "Create Member"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AssignMembership({
  member,
  plans,
  busy,
  onClose,
  onSubmit,
}: {
  member: Member;
  plans: Plan[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (body: { planId: string; startDate?: string }) => void;
}) {
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
          Assign Membership — {member.name}
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition hover:text-white"
          aria-label="Close"
        >
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ planId, startDate: startDate || undefined });
        }}
      >
        <Field label="Plan">
          <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₹{p.price} / {planPeriodLabel(p.durationDays)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date" hint="Blank = today.">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Assigning…" : "Assign / Renew"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default MembersClient;