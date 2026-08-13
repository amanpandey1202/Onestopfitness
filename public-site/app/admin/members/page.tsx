"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
  TextArea,
} from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { formatDate } from "@/lib/format";

type Plan = { id: string; name: string; price: number; durationDays: number };

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  memberCode: string | null;
  isActive: boolean;
  createdAt: string;
  memberProfile: {
    fitnessGoal: string | null;
    joiningDate: string | null;
    notes: string | null;
    alternatePhone: string | null;
    aadhaarNumber: string | null;
    address: string | null;
    parentName: string | null;
    parentPhone: string | null;
  } | null;
  memberships: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    plan: Plan;
  }[];
};

function isMembershipActive(m: Member["memberships"][0]) {
  return m.status === "ACTIVE" && new Date(m.endDate).getTime() >= Date.now();
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [assignTo, setAssignTo] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Couldn't load members.");
    }
  }, []);

  useEffect(() => {
    reload();
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => {});
  }, [reload]);

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
    const a = document.createElement("a");
    a.href = "/api/admin/members/export";
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

  const filtered = (members ?? []).filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.name, m.email, m.phone ?? "", m.memberCode ?? ""].some((v) =>
      v.toLowerCase().includes(q)
    );
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
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const latest = m.memberships[0];
                const active = latest ? isMembershipActive(latest) : false;
                return (
                  <tr key={m.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-xs text-white/50">{m.email}</p>
                      {m.phone && <p className="text-xs text-white/40">{m.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="green">{m.memberCode ?? "—"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {latest ? (
                        <>
                          <p className="text-white/80">{latest.plan.name}</p>
                          <p className="text-xs text-white/45">
                            till {formatDate(latest.endDate)}
                          </p>
                        </>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge tone={m.isActive ? "green" : "red"}>
                          {m.isActive ? "Active" : "Suspended"}
                        </Badge>
                        {latest && (
                          <Badge tone={active ? "green" : "yellow"}>{active ? "Paid" : "Expired"}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-white/55 lg:table-cell">
                      {formatDate(m.memberProfile?.joiningDate ?? m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => { setEditing(m); setShowForm(true); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => setAssignTo(m)}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
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
                        </Button>
                        <Button
                          variant="danger"
                          className="px-2 py-1 text-xs"
                          onClick={() => {
                            if (confirm(`Delete ${m.name} permanently?`)) {
                              action(() => fetch(`/api/admin/members/${m.id}`, { method: "DELETE" }));
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
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
    aadhaarNumber: editing?.memberProfile?.aadhaarNumber ?? "",
    address: editing?.memberProfile?.address ?? "",
    parentName: editing?.memberProfile?.parentName ?? "",
    parentPhone: editing?.memberProfile?.parentPhone ?? "",
  }));

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

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
            aadhaarNumber: f.aadhaarNumber || null,
            address: f.address || null,
            parentName: f.parentName || null,
            parentPhone: f.parentPhone || null,
          };
          if (editing) {
            body.joiningDate = f.joiningDate || null;
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
        <Field label="Name">
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        {!editing && (
          <Field label="Email">
            <Input type="email" required value={f.email} onChange={set("email")} />
          </Field>
        )}
        {!editing && (
          <Field label="Temporary password" hint="Min 8 characters. Changeable by the member later.">
            <Input type="password" required minLength={8} value={f.password} onChange={set("password")} />
          </Field>
        )}
        <Field label="Phone">
          <Input value={f.phone} onChange={set("phone")} />
        </Field>
        <Field label="Date joined">
          <Input type="date" value={f.joiningDate} onChange={set("joiningDate")} />
        </Field>
        <Field label="Fitness goal">
          <Input value={f.fitnessGoal} onChange={set("fitnessGoal")} />
        </Field>
        {!editing && (
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
        )}
        <div className="sm:col-span-2 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gym-lime">Private details</p>
          <p className="mt-1 text-xs text-white/40">Stored securely and only visible to admins — never included in Excel exports.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Alternate phone">
              <Input value={f.alternatePhone} onChange={set("alternatePhone")} />
            </Field>
            <Field label="Aadhaar number">
              <Input value={f.aadhaarNumber} onChange={set("aadhaarNumber")} />
            </Field>
            <Field label="Parent / guardian name">
              <Input value={f.parentName} onChange={set("parentName")} />
            </Field>
            <Field label="Parent / guardian phone">
              <Input value={f.parentPhone} onChange={set("parentPhone")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <TextArea rows={2} value={f.address} onChange={set("address")} />
              </Field>
            </div>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <TextArea rows={2} value={f.notes} onChange={set("notes")} />
          </Field>
        </div>
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
                {p.name} — ₹{p.price}/month
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
