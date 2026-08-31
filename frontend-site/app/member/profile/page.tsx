"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Spinner } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

type ProfileData = {
  user: { id: string; name: string; email: string; phone: string | null; profileImageUrl: string | null };
  profile: { fitnessGoal: string | null; joiningDate: string | null } | null;
};

export default function MemberProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [phone, setPhone] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwNotice, setPwNotice] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me) {
          setData({
            user: {
              id: me.id,
              name: me.name,
              email: me.email,
              phone: me.phone,
              profileImageUrl: me.profileImageUrl,
            },
            profile: me.memberProfile ?? null,
          });
          setPhone(me.phone ?? "");
          setFitnessGoal(me.memberProfile?.fitnessGoal ?? "");
        }
      })
      .catch(() => setError("Couldn't load your profile."));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone || null, fitnessGoal: fitnessGoal || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Save failed");
      setNotice("Profile updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwNotice(null);
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not change your password.");
      setPwNotice("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Could not change your password.");
    } finally {
      setPwBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white">My Profile</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gym-lime/40 bg-gym-lime/10 font-display text-2xl font-bold text-gym-lime">
            {data.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-xl font-bold text-white">{data.user.name}</p>
            <p className="text-sm text-white/55">{data.user.email}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/45">Member since</dt>
            <dd className="mt-1 font-semibold text-white/85">
              {formatDate(data.profile?.joiningDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/45">Member ID</dt>
            <dd className="mt-1 font-mono text-xs text-white/70">{data.user.id}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Edit Details</h2>
        <form onSubmit={save} className="mt-4 space-y-4">
          <Field label="Phone">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
          </Field>
          <Field label="Fitness goal">
            <Input value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} placeholder="e.g. Fat loss & strength" />
          </Field>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {notice && <p className="text-sm text-gym-lime">{notice}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">Change Password</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <Field label="Current password">
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              minLength={1}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password" hint="Minimum 8 characters, with a letter, number and special character.">
            <Input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          {pwError && <p className="text-sm text-red-300">{pwError}</p>}
          {pwNotice && <p className="text-sm text-gym-lime">{pwNotice}</p>}
          <Button type="submit" disabled={pwBusy}>
            {pwBusy ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
