"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAdminUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">New Admin User</h1>
      <p className="mt-1 text-sm text-stone-500">Give someone staff or owner access to this admin panel.</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
            placeholder="At least 8 characters"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-stone-600">Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "owner" | "staff")}
            className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 outline-none focus:border-[#A61400] focus:ring-2 focus:ring-[#A61400]/10"
          >
            <option value="staff">Staff (orders only)</option>
            <option value="owner">Owner (full access)</option>
          </select>
        </label>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => router.push("/admin/users")} className="tap-press rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="tap-press rounded-xl bg-[#A61400] px-5 py-2.5 font-semibold text-white shadow-sm disabled:opacity-50">
            {submitting ? "Creating…" : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
