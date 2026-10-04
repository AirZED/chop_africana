"use client";

import { useEffect, useState } from "react";
import type { AuditLogEntry } from "@/lib/audit-service";

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((res) => res.json())
      .then((data) => setEntries(data.entries))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl font-[900] tracking-[-0.02em] text-stone-900">Audit Log</h1>
      <p className="mt-1 text-sm text-stone-500">Every catalog, order, and admin-user change, most recent first.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Loading…</td></tr>
            )}
            {!loading && entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No activity recorded yet.</td></tr>
            )}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-4 py-3 text-stone-500">{new Date(e.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-stone-900">{e.adminEmail}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-700">{e.action}</td>
                <td className="px-4 py-3 text-stone-600">
                  {e.target} <span className="text-stone-400">{e.targetId.slice(0, 40)}</span>
                </td>
                <td className="px-4 py-3 text-stone-500">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
