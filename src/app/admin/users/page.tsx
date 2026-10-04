"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminUser } from "@/lib/admin-service";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Couldn't load admin users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(user: AdminUser) {
    setBusy(user.email);
    setError(null);
    try {
      const nextRole = user.role === "owner" ? "staff" : "owner";
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't update role");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update role");
    } finally {
      setBusy(null);
    }
  }

  async function remove(user: AdminUser) {
    if (!confirm(`Remove admin access for ${user.email}?`)) return;
    setBusy(user.email);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.email)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't remove user");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove user");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Admin Users</h1>
          <p className="mt-1 text-sm text-stone-500">
            Owners have full access. Staff can only view and update orders.
          </p>
        </div>
        <Link href="/admin/users/new" className="tap-press rounded-lg bg-[#A61400] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          + New User
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-400">Loading…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-stone-400">No admin users yet.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.email} className={busy === u.email ? "opacity-50" : ""}>
                <td className="px-4 py-3 text-stone-900">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "owner" ? "bg-[#A61400]/10 text-[#A61400]" : "bg-stone-100 text-stone-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button disabled={busy === u.email} onClick={() => toggleRole(u)} className="text-sm font-medium text-[#A61400] hover:text-[#7d0f00]">
                      Make {u.role === "owner" ? "Staff" : "Owner"}
                    </button>
                    <button disabled={busy === u.email} onClick={() => remove(u)} className="text-sm font-medium text-stone-400 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
